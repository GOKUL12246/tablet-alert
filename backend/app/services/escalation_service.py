from datetime import datetime, timedelta, timezone
from typing import List, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import NotFoundException, ForbiddenException
from app.core.i18n import get_text
from app.models.caregiver import CaregiverRelationship, ConsentStatus
from app.models.medicine import Medicine
from app.models.notification import DeliveryChannel, RecipientType
from app.models.reminder import (
    AlertStatus,
    AlertType,
    CaregiverAlert,
    ReminderEvent,
    ReminderStatus,
)
from app.models.user import User
from app.services.notification_service import send_custom_notification


def get_authorized_caregivers(
    db: Session,
    patient_id: str,
    escalation_order: Optional[int] = None
) -> List[CaregiverRelationship]:
    """Retrieve approved caregivers for a patient, optionally filtering by escalation order."""
    query = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.patient_id == patient_id,
        CaregiverRelationship.consent_status == ConsentStatus.APPROVED,
    )
    if escalation_order is not None:
        query = query.filter(CaregiverRelationship.escalation_order == escalation_order)
    return query.order_by(CaregiverRelationship.escalation_order.asc()).all()


def send_caregiver_alert(
    db: Session,
    reminder_id: Optional[str],
    caregiver_id: str,
    patient_id: str,
    alert_type: AlertType = AlertType.MISSED_REMINDER,
    custom_msg_en: Optional[str] = None,
    custom_msg_ta: Optional[str] = None,
    relation_label: Optional[str] = None,
) -> CaregiverAlert:
    """Create an alert for a caregiver with explicit relation wording and dispatch a notification."""
    patient = db.query(User).filter(User.id == patient_id).first()
    patient_name = patient.full_name if patient else "Patient"

    rel = relation_label or "family member"
    time_str = "scheduled time"
    if reminder_id:
        reminder = db.query(ReminderEvent).filter(ReminderEvent.id == reminder_id).first()
        if reminder:
            time_str = reminder.scheduled_datetime.strftime("%I:%M %p")

    msg_en = custom_msg_en or get_text("missed_alert_caregiver", "en", relation=rel, patient_name=patient_name, time=time_str)
    msg_ta = custom_msg_ta or get_text("missed_alert_caregiver", "ta", relation=rel, patient_name=patient_name, time=time_str)

    alert = CaregiverAlert(
        reminder_id=reminder_id,
        patient_id=patient_id,
        caregiver_id=caregiver_id,
        alert_type=alert_type,
        message_en=msg_en,
        message_ta=msg_ta,
        status=AlertStatus.OPEN,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Dispatch notification to caregiver
    caregiver = db.query(User).filter(User.id == caregiver_id).first()
    lang = caregiver.language.value if caregiver and caregiver.language else "en"
    text_to_send = msg_ta if lang == "ta" else msg_en

    send_custom_notification(
        db=db,
        recipient_id=caregiver_id,
        channel=DeliveryChannel.SMS,
        message=text_to_send,
        recipient_type=RecipientType.CAREGIVER,
        caregiver_alert_id=alert.id,
        reminder_id=reminder_id,
    )

    return alert


def check_and_escalate(db: Session, reminder_id: str) -> None:
    """Escalate a missed reminder through configured tiers to family members."""
    reminder = db.query(ReminderEvent).filter(ReminderEvent.id == reminder_id).first()
    if not reminder:
        return

    # If already confirmed or cancelled, stop
    if reminder.status in [ReminderStatus.PATIENT_REPORTED_TAKEN, ReminderStatus.CANCELLED]:
        reminder.next_escalation_at = None
        db.commit()
        return

    patient = db.query(User).filter(User.id == reminder.patient_id).first()
    medicine = db.query(Medicine).filter(Medicine.id == reminder.medicine_id).first()
    now_utc = datetime.now(timezone.utc)
    lang = patient.language.value if patient and patient.language else "en"
    med_name = medicine.name if medicine else "medicine"

    if reminder.escalation_level == 0:
        # Tier 1: Patient follow-up SMS
        reminder.escalation_level = 1
        reminder.next_escalation_at = now_utc + timedelta(minutes=settings.ESCALATION_DELAY_SECOND)
        time_str = reminder.scheduled_datetime.strftime("%I:%M %p")
        followup_msg = f"{get_text('missed_alert_first', lang, patient_name=patient.full_name, medicine_name=med_name, time=time_str)} {get_text('reminder_prompt', lang)}"
        send_custom_notification(
            db=db,
            recipient_id=patient.id,
            channel=DeliveryChannel.SMS,
            message=followup_msg,
            recipient_type=RecipientType.PATIENT,
            reminder_id=reminder.id
        )

    elif reminder.escalation_level == 1:
        # Tier 2: Primary Caregiver / Family Alert
        reminder.escalation_level = 2
        reminder.status = ReminderStatus.CONFIRMATION_NOT_RECEIVED
        reminder.next_escalation_at = now_utc + timedelta(minutes=settings.ESCALATION_DELAY_CAREGIVER)

        primary_caregivers = get_authorized_caregivers(db, reminder.patient_id, escalation_order=1)
        for cg_link in primary_caregivers:
            send_caregiver_alert(
                db=db,
                reminder_id=reminder.id,
                caregiver_id=cg_link.caregiver_id,
                patient_id=reminder.patient_id,
                alert_type=AlertType.MISSED_REMINDER,
                relation_label=cg_link.relation_label
            )

    elif reminder.escalation_level == 2:
        # Tier 3: Secondary Caregiver / Family Alert
        reminder.escalation_level = 3
        reminder.next_escalation_at = None  # End automated escalation

        secondary_caregivers = get_authorized_caregivers(db, reminder.patient_id, escalation_order=2)
        for cg_link in secondary_caregivers:
            send_caregiver_alert(
                db=db,
                reminder_id=reminder.id,
                caregiver_id=cg_link.caregiver_id,
                patient_id=reminder.patient_id,
                alert_type=AlertType.REPEATED_MISS,
                relation_label=cg_link.relation_label
            )

    db.commit()


def check_pending_escalations(db: Session) -> None:
    """Inspect all active reminders that have passed their next_escalation_at timestamp."""
    now_utc = datetime.now(timezone.utc)
    pending_reminders = db.query(ReminderEvent).filter(
        ReminderEvent.next_escalation_at.isnot(None),
        ReminderEvent.next_escalation_at <= now_utc,
        ReminderEvent.status.notin_([ReminderStatus.PATIENT_REPORTED_TAKEN, ReminderStatus.CANCELLED])
    ).all()

    for rem in pending_reminders:
        check_and_escalate(db, rem.id)


def alert_caregivers_for_assistance(db: Session, patient_id: str, request_id: str) -> None:
    """Notify family caregivers when patient requests help."""
    caregivers = get_authorized_caregivers(db, patient_id)
    patient = db.query(User).filter(User.id == patient_id).first()
    p_name = patient.full_name if patient else "Patient"

    for cg in caregivers:
        rel = cg.relation_label or "family member"
        msg_en = f"Assistance Needed: Your {rel} {p_name} requested help through MEDISAKHI. Please reach out immediately."
        msg_ta = f"உதவி தேவை: உங்கள் {rel} {p_name} மெடிசகியில் உதவி கோரியுள்ளார். தயவுசெய்து உடனடியாக தொடர்பு கொள்ளவும்."
        send_caregiver_alert(
            db=db,
            reminder_id=None,
            caregiver_id=cg.caregiver_id,
            patient_id=patient_id,
            alert_type=AlertType.ASSISTANCE_REQUEST,
            custom_msg_en=msg_en,
            custom_msg_ta=msg_ta,
            relation_label=rel
        )


def resolve_alert(
    db: Session,
    alert_id: str,
    caregiver_id: str,
    notes: Optional[str] = None
) -> CaregiverAlert:
    """Acknowledge or resolve an active caregiver alert."""
    alert = db.query(CaregiverAlert).filter(CaregiverAlert.id == alert_id).first()
    if not alert:
        raise NotFoundException(detail=f"Caregiver alert '{alert_id}' not found")
    if alert.caregiver_id != caregiver_id:
        raise ForbiddenException(detail="You are not authorized to resolve this alert")

    alert.status = AlertStatus.RESOLVED
    alert.resolved_at = datetime.now(timezone.utc)
    if notes:
        alert.notes = notes

    db.commit()
    db.refresh(alert)
    return alert


def get_open_alerts_for_caregiver(db: Session, caregiver_id: str) -> List[CaregiverAlert]:
    """Fetch all open or unresolved alerts assigned to a caregiver."""
    return db.query(CaregiverAlert).filter(
        CaregiverAlert.caregiver_id == caregiver_id,
        CaregiverAlert.status.in_([AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED])
    ).order_by(CaregiverAlert.created_at.desc()).all()
