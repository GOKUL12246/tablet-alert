from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.config import settings
from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.medicine import Medicine
from app.models.reminder import (
    AssistanceRequest,
    ConfirmationMethod,
    DoseConfirmation,
    ReminderEvent,
    ReminderStatus,
)
from app.models.user import User, UserRole
from app.schemas.reminder import (
    AssistanceRequestCreate,
    AssistanceRequestOut,
    DoseConfirmationOut,
    ReminderConfirmRequest,
    ReminderMissedRequest,
    ReminderOut,
)
from app.services.escalation_service import alert_caregivers_for_assistance
from app.services.reminder_service import (
    confirm_reminder,
    get_upcoming_reminders,
    mark_missed,
)

router = APIRouter(prefix="/reminders", tags=["Reminders"])


def build_reminder_out(reminder: ReminderEvent, db: Session) -> ReminderOut:
    med = db.query(Medicine).filter(Medicine.id == reminder.medicine_id).first()
    pat = db.query(User).filter(User.id == reminder.patient_id).first()
    ist_tz = timezone(timedelta(hours=5, minutes=30))
    raw_dt = reminder.scheduled_datetime
    aware_dt = raw_dt.replace(tzinfo=timezone.utc) if raw_dt.tzinfo is None else raw_dt
    local_dt = aware_dt.astimezone(ist_tz)
    local_time_str = local_dt.strftime("%H:%M")

    return ReminderOut(
        id=reminder.id,
        schedule_id=reminder.schedule_id,
        medicine_id=reminder.medicine_id,
        medicine_name=med.name if med else "Medicine",
        medicine_strength=med.strength if med else "",
        patient_id=reminder.patient_id,
        patient_name=pat.full_name if pat else "Patient",
        scheduled_datetime=aware_dt,
        scheduled_time_local=local_time_str,
        color=(med.tablet_color or med.color or "white") if med else "white",
        shape=(med.tablet_shape or med.shape or "round") if med else "round",
        food_instructions=med.food_instructions if med else "after_food",
        status=reminder.status,
        notification_channels=reminder.notification_channels or ["sms", "app"],
        sent_at=reminder.sent_at,
        delivered_at=reminder.delivered_at,
        acknowledged_at=reminder.acknowledged_at,
        confirmed_at=reminder.confirmed_at,
        confirmation_method=reminder.confirmation_method,
        missed_dose_guidance_shown=reminder.missed_dose_guidance_shown,
        escalation_level=reminder.escalation_level,
        next_escalation_at=reminder.next_escalation_at,
        created_at=reminder.created_at,
        updated_at=reminder.updated_at,
    )


@router.get("/upcoming", response_model=List[ReminderOut])
def get_upcoming(
    patient_id: Optional[str] = Query(None),
    hours_ahead: int = Query(24, ge=1, le=168),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve upcoming medicine reminders for the current or authorized patient."""
    target_patient_id = current_user.id
    if patient_id and current_user.role in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        target_patient_id = patient_id

    events = get_upcoming_reminders(db, target_patient_id, hours_ahead=hours_ahead)
    return [build_reminder_out(ev, db) for ev in events]


@router.get("/active-alarm")
def get_active_alarm_details(
    reminder_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve full details for an active alarm, prioritizing specified reminder or currently due reminder."""
    reminder = None
    if reminder_id:
        reminder = db.query(ReminderEvent).filter(ReminderEvent.id == reminder_id).first()

    now_utc = datetime.now(timezone.utc)
    if not reminder:
        # Check if any reminder is due in the immediate window (past 60 min to next 2 min)
        due_start = now_utc - timedelta(minutes=60)
        due_end = now_utc + timedelta(minutes=2)
        reminder = db.query(ReminderEvent).filter(
            ReminderEvent.patient_id == current_user.id,
            ReminderEvent.status.in_([ReminderStatus.SCHEDULED, ReminderStatus.SENT, ReminderStatus.PROCESSING]),
            ReminderEvent.scheduled_datetime >= due_start,
            ReminderEvent.scheduled_datetime <= due_end
        ).order_by(ReminderEvent.scheduled_datetime.desc()).first()

    if not reminder:
        lookback = now_utc - timedelta(hours=4)
        lookahead = now_utc + timedelta(hours=12)
        reminder = db.query(ReminderEvent).filter(
            ReminderEvent.patient_id == current_user.id,
            ReminderEvent.status.in_([ReminderStatus.SCHEDULED, ReminderStatus.SENT, ReminderStatus.PROCESSING]),
            ReminderEvent.scheduled_datetime >= lookback,
            ReminderEvent.scheduled_datetime <= lookahead
        ).order_by(ReminderEvent.scheduled_datetime.asc()).first()

    if not reminder:
        reminder = db.query(ReminderEvent).filter(
            ReminderEvent.patient_id == current_user.id,
            ReminderEvent.status != ReminderStatus.CANCELLED
        ).order_by(ReminderEvent.scheduled_datetime.desc()).first()

    if not reminder:
        raise NotFoundException(detail="No reminders found for patient")

    medicine = db.query(Medicine).filter(Medicine.id == reminder.medicine_id).first()
    med_name = medicine.name if medicine else "Medicine"
    brand_name = medicine.brand_name if medicine else ""
    strength = medicine.strength if medicine else ""
    color = (medicine.tablet_color or medicine.color or "white") if medicine else "white"
    shape = (medicine.tablet_shape or medicine.shape or "round") if medicine else "round"
    food = medicine.food_instructions if medicine else "after_food"
    food_clean = food.replace('_', ' ')

    ist_tz = timezone(timedelta(hours=5, minutes=30))
    time_ist = reminder.scheduled_datetime.astimezone(ist_tz)
    time_str = time_ist.strftime("%I:%M %p")
    hr = time_ist.hour
    period_ta = "காலை" if hr < 12 else ("மதியம்" if hr < 16 else "இரவு")
    ta_hr = hr if hr <= 12 else hr - 12
    if ta_hr == 0: ta_hr = 12
    time_ta_str = f"{period_ta} {ta_hr:02d}:{time_ist.minute:02d}"

    color_ta_map = {
        "white": "வெள்ளை", "pink": "இளஞ்சிவப்பு", "yellow": "மஞ்சள்",
        "blue": "நீலம்", "orange": "ஆரஞ்சு", "red": "சிவப்பு", "green": "பச்சை"
    }
    shape_ta_map = {
        "round": "வட்ட", "oval": "நீள்வட்ட", "capsule": "கேப்சூல்", "oblong": "செவ்வக"
    }
    color_ta = color_ta_map.get(color.lower(), color)
    shape_ta = shape_ta_map.get(shape.lower(), shape)
    food_ta = "உணவுக்குப் பின்" if "after" in food else "உணவுக்கு முன்"

    speech_en = (
        f"Attention! It is {time_str}. Time to take your medicine: {med_name} {strength}. "
        f"This is a {color} {shape} tablet. Take with water {food_clean}. "
        f"Please click OK when you have taken your medicine."
    )
    speech_ta = (
        f"வணக்கம்! நேரம் {time_ta_str} மணி. உங்கள் மருந்தை எடுத்துக்கொள்ளும் நேரம் வந்துவிட்டது. "
        f"மருந்து: {med_name} {strength}. இது {color_ta} நிறத்தில், {shape_ta} வடிவில் இருக்கும் மாத்திரை. "
        f"{food_ta} தண்ணீருடன் எடுத்துக்கொள்ளவும். மாத்திரை சாப்பிட்டதும் சரி பொத்தானை அழுத்தவும்."
    )

    return {
        "reminder_id": reminder.id,
        "scheduled_time": time_str,
        "scheduled_time_ta": time_ta_str,
        "medicine_id": reminder.medicine_id,
        "medicine_name": med_name,
        "brand_name": brand_name,
        "strength": strength,
        "color": color,
        "shape": shape,
        "color_ta": color_ta,
        "shape_ta": shape_ta,
        "food_instructions": food_clean,
        "food_instructions_ta": food_ta,
        "speech_en": speech_en,
        "speech_ta": speech_ta,
        "remaining_tablets": medicine.remaining_tablets if medicine and medicine.remaining_tablets is not None else 30,
        "total_tablets": medicine.total_tablets if medicine and medicine.total_tablets is not None else 30,
    }


@router.get("/{id}", response_model=ReminderOut)
def get_reminder(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve reminder event details."""
    reminder = db.query(ReminderEvent).filter(ReminderEvent.id == id).first()
    if not reminder:
        raise NotFoundException(detail=f"Reminder '{id}' not found")
    return build_reminder_out(reminder, db)


@router.post("/{id}/confirm", response_model=DoseConfirmationOut)
def confirm_dose_taken(
    id: str,
    payload: Optional[ReminderConfirmRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Confirm medication taken by patient or caregiver (idempotent)."""
    reminder = db.query(ReminderEvent).filter(ReminderEvent.id == id).first()
    if not reminder:
        raise NotFoundException(detail=f"Reminder '{id}' not found")

    target_patient_id = reminder.patient_id
    method = payload.method if payload and payload.method else ConfirmationMethod.APP
    notes = payload.notes if payload else None
    confirmed_at = payload.confirmed_at if payload else None

    confirmation = confirm_reminder(
        db=db,
        reminder_id=id,
        patient_id=target_patient_id,
        method=method,
        notes=notes,
        confirmed_at=confirmed_at
    )
    return confirmation


@router.post("/{id}/missed", response_model=ReminderOut)
def record_missed_dose(
    id: str,
    payload: Optional[ReminderMissedRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Mark reminder as missed and display missed-dose guidance."""
    reason = payload.reason if payload else None
    reminder = mark_missed(db, id, reason=reason)
    return build_reminder_out(reminder, db)


@router.post("/{id}/request-help", response_model=AssistanceRequestOut)
def request_assistance_for_reminder(
    id: str,
    payload: Optional[AssistanceRequestCreate] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Submit an urgent assistance or clarification request for a medication dose."""
    reminder = db.query(ReminderEvent).filter(ReminderEvent.id == id).first()
    target_patient_id = current_user.id
    if reminder:
        target_patient_id = reminder.patient_id

    req = AssistanceRequest(
        patient_id=target_patient_id,
        reminder_id=id,
        request_type=payload.request_type,
        status="open"
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # Trigger alert to family caregivers
    alert_caregivers_for_assistance(db, target_patient_id, req.id)

    return req


@router.post("/{id}/escalate-caretaker")
def trigger_immediate_caretaker_alert(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Escalate to registered caregivers immediately if patient did not respond to the alarm."""
    reminder = db.query(ReminderEvent).filter(ReminderEvent.id == id).first()
    if not reminder:
        raise NotFoundException(detail=f"Reminder '{id}' not found")

    patient = db.query(User).filter(User.id == reminder.patient_id).first()
    medicine = db.query(Medicine).filter(Medicine.id == reminder.medicine_id).first()
    med_name = medicine.name if medicine else "medicine"
    p_name = patient.full_name if patient else "Patient"
    time_str = reminder.scheduled_datetime.strftime("%I:%M %p")

    reminder.status = ReminderStatus.CONFIRMATION_NOT_RECEIVED
    reminder.escalation_level = 2
    db.commit()

    # 1. Send live emergency alert email to caregiver via Gmail SMTP
    from app.services.email_service import send_caretaker_emergency_alert_email
    email_result = send_caretaker_emergency_alert_email(
        patient_name=p_name,
        medicine_name=med_name,
        strength=medicine.strength if medicine else "",
        scheduled_time=time_str,
        color=medicine.tablet_color or medicine.color or "white" if medicine else "white",
        shape=medicine.tablet_shape or medicine.shape or "round" if medicine else "round",
        food_instructions=medicine.food_instructions if medicine else "after food",
        to_email=settings.GMAIL_RECEIVER
    )

    # 2. Send SMS attempt to caretaker phone via Twilio
    from app.services.notification_service import get_sms_provider
    provider = get_sms_provider()
    sms_msg = f"🚨 MEDISAKHI ALERT: Patient {p_name} did NOT respond to medicine alarm for {med_name} at {time_str}. Please assist patient!"
    sms_result = provider.send_sms(to_phone=settings.CARETAKER_PHONE or "+916369067138", message=sms_msg)

    from app.services.escalation_service import get_authorized_caregivers, send_caregiver_alert
    from app.models.reminder import AlertType
    caregivers = get_authorized_caregivers(db, reminder.patient_id)
    alerts_sent = []
    for cg_link in caregivers:
        rel = cg_link.relation_label or "family member"
        msg_en = f"🚨 URGENT: Patient {p_name} did NOT respond to the medicine alarm for {med_name} at {time_str}. Please contact or check on them immediately!"
        msg_ta = f"🚨 அவசர எச்சரிக்கை: நோயாளி {p_name} {time_str} மணி {med_name} மாத்திரை அலாரத்திற்கு பதிலளிக்கவில்லை. உடனே அழைத்து உதவவும்!"
        alert = send_caregiver_alert(
            db=db,
            reminder_id=reminder.id,
            caregiver_id=cg_link.caregiver_id,
            patient_id=reminder.patient_id,
            alert_type=AlertType.MISSED_REMINDER,
            custom_msg_en=msg_en,
            custom_msg_ta=msg_ta,
            relation_label=rel
        )
        alerts_sent.append(alert.id)

    return {
        "status": "escalated_to_caregiver",
        "patient_name": p_name,
        "medicine_name": med_name,
        "email_delivery": email_result,
        "sms_delivery": sms_result,
        "caregivers_alerted_count": len(alerts_sent),
        "alerts": alerts_sent
    }
