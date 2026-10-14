from datetime import datetime, date, time, timedelta, timezone
from typing import List, Optional
import zoneinfo
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.config import settings
from app.core.exceptions import BadRequestException, NotFoundException
from app.models.schedule import MedicineSchedule
from app.models.medicine import Medicine
from app.models.reminder import (
    ReminderEvent,
    ReminderStatus,
    ConfirmationMethod,
    ConfirmationType,
    DoseConfirmation,
)


def generate_reminders_for_schedule(
    db: Session,
    schedule_id: str,
    days_ahead: int = 2
) -> List[ReminderEvent]:
    """Generate upcoming reminder events for a given medicine schedule idempotently."""
    schedule = db.query(MedicineSchedule).filter(MedicineSchedule.id == schedule_id).first()
    if not schedule or not schedule.is_active:
        return []

    medicine = db.query(Medicine).filter(Medicine.id == schedule.medicine_id).first()
    if not medicine or not medicine.is_active:
        return []

    try:
        tz = zoneinfo.ZoneInfo(schedule.timezone or "Asia/Kolkata")
    except Exception:
        tz = zoneinfo.ZoneInfo("Asia/Kolkata")

    created_events: List[ReminderEvent] = []
    now_in_tz = datetime.now(tz)
    today = now_in_tz.date()

    for d in range(days_ahead):
        target_date = today + timedelta(days=d)

        # Check days_of_week if restricted
        if schedule.days_of_week is not None and len(schedule.days_of_week) > 0:
            if target_date.weekday() not in schedule.days_of_week:
                continue

        for time_str in schedule.reminder_times:
            try:
                parts = time_str.strip().split(":")
                hour = int(parts[0])
                minute = int(parts[1]) if len(parts) > 1 else 0
                target_time = time(hour=hour, minute=minute)
            except Exception:
                continue

            scheduled_dt_local = datetime.combine(target_date, target_time, tzinfo=tz)
            scheduled_dt_utc = scheduled_dt_local.astimezone(timezone.utc)

            # Check if reminder event already exists (idempotency)
            # Allow 10 minute leeway matching to prevent duplicated slots
            window_start = scheduled_dt_utc - timedelta(minutes=5)
            window_end = scheduled_dt_utc + timedelta(minutes=5)

            existing = db.query(ReminderEvent).filter(
                ReminderEvent.schedule_id == schedule.id,
                ReminderEvent.scheduled_datetime >= window_start,
                ReminderEvent.scheduled_datetime <= window_end,
            ).first()

            if not existing:
                reminder = ReminderEvent(
                    schedule_id=schedule.id,
                    medicine_id=medicine.id,
                    patient_id=schedule.patient_id,
                    scheduled_datetime=scheduled_dt_utc,
                    status=ReminderStatus.SCHEDULED,
                    notification_channels=["sms", "app"],
                    escalation_level=0,
                )
                db.add(reminder)
                created_events.append(reminder)

    if created_events:
        db.commit()
        for ev in created_events:
            db.refresh(ev)

    return created_events


def get_upcoming_reminders(
    db: Session,
    patient_id: str,
    hours_ahead: int = 24
) -> List[ReminderEvent]:
    """Retrieve all reminders for a patient scheduled within the next N hours or recently missed."""
    now_utc = datetime.now(timezone.utc)
    future_cutoff = now_utc + timedelta(hours=hours_ahead)
    past_cutoff = now_utc - timedelta(hours=12)

    reminders = db.query(ReminderEvent).filter(
        ReminderEvent.patient_id == patient_id,
        ReminderEvent.scheduled_datetime >= past_cutoff,
        ReminderEvent.scheduled_datetime <= future_cutoff,
    ).order_by(ReminderEvent.scheduled_datetime.asc()).all()

    return reminders


def confirm_reminder(
    db: Session,
    reminder_id: str,
    patient_id: str,
    method: ConfirmationMethod = ConfirmationMethod.APP,
    notes: Optional[str] = None,
    confirmed_at: Optional[datetime] = None
) -> DoseConfirmation:
    """Confirm that the scheduled medication dose was taken (idempotent)."""
    reminder = db.query(ReminderEvent).filter(
        ReminderEvent.id == reminder_id,
        ReminderEvent.patient_id == patient_id
    ).first()

    if not reminder:
        raise NotFoundException(detail=f"Reminder with ID '{reminder_id}' not found for this patient.")

    # Check if already confirmed (idempotent)
    existing_conf = db.query(DoseConfirmation).filter(
        DoseConfirmation.reminder_id == reminder_id
    ).first()

    now_utc = confirmed_at or datetime.now(timezone.utc)

    if existing_conf:
        # Idempotent response: update notes if supplied and return
        if notes:
            existing_conf.notes = notes
            db.commit()
            db.refresh(existing_conf)
        return existing_conf

    # Map method to confirmation type
    conf_type_map = {
        ConfirmationMethod.SMS: ConfirmationType.SMS_REPLY,
        ConfirmationMethod.APP: ConfirmationType.APP_BUTTON,
        ConfirmationMethod.VOICE: ConfirmationType.VOICE_RESPONSE,
    }
    c_type = conf_type_map.get(method, ConfirmationType.APP_BUTTON)

    confirmation = DoseConfirmation(
        reminder_id=reminder.id,
        patient_id=patient_id,
        confirmation_type=c_type,
        confirmed_at=now_utc,
        notes=notes,
        is_self_reported=True
    )
    db.add(confirmation)

    reminder.status = ReminderStatus.PATIENT_REPORTED_TAKEN
    reminder.confirmed_at = now_utc
    reminder.confirmation_method = method
    reminder.next_escalation_at = None  # Stop escalations once confirmed

    # Tablet stock reduction & low-stock check
    medicine = db.query(Medicine).filter(Medicine.id == reminder.medicine_id).first()
    if medicine:
        current_rem = medicine.remaining_tablets if medicine.remaining_tablets is not None else 30
        medicine.remaining_tablets = max(0, current_rem - 1)

        threshold = medicine.low_stock_threshold or 10
        if medicine.remaining_tablets <= threshold:
            # Check daily once condition: "alert i alerm daily once"
            should_alert = False
            if medicine.last_low_stock_alert_at is None:
                should_alert = True
            elif medicine.last_low_stock_alert_at.date() < now_utc.date():
                should_alert = True

            if should_alert:
                medicine.last_low_stock_alert_at = now_utc
                from app.models.user import User
                patient = db.query(User).filter(User.id == patient_id).first()
                patient_name = patient.full_name if patient else "Patient"

                # 1. Live Gmail low-stock alert
                from app.services.email_service import send_low_stock_alert_email
                send_low_stock_alert_email(
                    patient_name=patient_name,
                    medicine_name=medicine.name,
                    strength=medicine.strength,
                    remaining_tablets=medicine.remaining_tablets,
                    total_tablets=medicine.total_tablets or 30,
                    to_email=settings.GMAIL_RECEIVER
                )

                # 2. Live SMS low-stock alert
                from app.services.notification_service import get_sms_provider
                provider = get_sms_provider()
                sms_text = f"⚠️ MEDISAKHI ALERT: Patient {patient_name} has only {medicine.remaining_tablets} tablets of {medicine.name} left. Please refill prescription soon!"
                provider.send_sms(to_phone=settings.CARETAKER_PHONE or "+916369067138", message=sms_text)

                # 3. Create CaregiverAlert in database
                from app.models.reminder import CaregiverAlert, AlertType, AlertStatus
                from app.services.escalation_service import get_authorized_caregivers
                caregivers = get_authorized_caregivers(db, patient_id)
                for cg in caregivers:
                    cg_alert = CaregiverAlert(
                        reminder_id=reminder.id,
                        patient_id=patient_id,
                        caregiver_id=cg.caregiver_id,
                        alert_type=AlertType.LOW_STOCK,
                        message_en=f"⚠️ Low Stock: Only {medicine.remaining_tablets} tablets left for {medicine.name}. Refill needed.",
                        message_ta=f"⚠️ குறைந்த இருப்பு: {medicine.name} மாத்திரை {medicine.remaining_tablets} மட்டுமே உள்ளது. உடனே வாங்கவும்.",
                        status=AlertStatus.OPEN
                    )
                    db.add(cg_alert)

    db.commit()
    db.refresh(confirmation)
    return confirmation


def mark_missed(
    db: Session,
    reminder_id: str,
    reason: Optional[str] = None
) -> ReminderEvent:
    """Mark a reminder as missed with guidance shown."""
    reminder = db.query(ReminderEvent).filter(ReminderEvent.id == reminder_id).first()
    if not reminder:
        raise NotFoundException(detail=f"Reminder with ID '{reminder_id}' not found")

    reminder.status = ReminderStatus.CONFIRMATION_NOT_RECEIVED
    reminder.missed_dose_guidance_shown = True
    reminder.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(reminder)
    return reminder


def check_escalation_needed(db: Session, reminder_id: str) -> bool:
    """Check if reminder is past due and requires next level escalation."""
    reminder = db.query(ReminderEvent).filter(ReminderEvent.id == reminder_id).first()
    if not reminder:
        return False

    if reminder.status in [ReminderStatus.PATIENT_REPORTED_TAKEN, ReminderStatus.CANCELLED]:
        return False

    now_utc = datetime.now(timezone.utc)
    if reminder.next_escalation_at and reminder.next_escalation_at <= now_utc:
        return True

    return False


def process_due_reminders(db: Session) -> None:
    """Process all scheduled reminders whose time has arrived."""
    from app.services.notification_service import send_reminder_notification

    now_utc = datetime.now(timezone.utc)

    # Find reminders that are due
    due_reminders = db.query(ReminderEvent).filter(
        ReminderEvent.status == ReminderStatus.SCHEDULED,
        ReminderEvent.scheduled_datetime <= now_utc
    ).all()

    for reminder in due_reminders:
        reminder.status = ReminderStatus.PROCESSING
        db.commit()

        # Send notification
        send_reminder_notification(db, reminder.id)

        reminder.status = ReminderStatus.SENT
        reminder.sent_at = datetime.now(timezone.utc)
        # Schedule first escalation check
        reminder.next_escalation_at = reminder.sent_at + timedelta(minutes=settings.ESCALATION_DELAY_FIRST)
        db.commit()
