from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import re
from sqlalchemy.orm import Session

from app.core.i18n import get_text
from app.models.medicine import Medicine
from app.models.reminder import (
    AssistanceRequest,
    ConfirmationMethod,
    DoseConfirmation,
    ReminderEvent,
    ReminderStatus,
)
from app.models.user import User
from app.services.auth_service import get_user_by_phone
from app.services.reminder_service import confirm_reminder
from app.services.notification_service import send_custom_notification
from app.models.notification import DeliveryChannel


def parse_sms_reply(body: str) -> str:
    """Parse SMS reply text to determine intent: 'confirm', 'help', or 'unknown'.
    Keypad phone logic:
    - Pressing 2 or sending help keywords triggers caregiver assistance.
    - Pressing ANY keypad button (any single digit 0-9, *, #, or confirmation words like ok, yes, taken) confirms dose has been taken.
    - Unrelated text returns 'unknown'."""
    if not body:
        return "unknown"

    cleaned = body.strip().lower()
    if not cleaned:
        return "unknown"

    # 1. Explicit help / assistance requests
    if cleaned == "2":
        return "help"

    help_keywords = [
        "help", "sos", "assist", "problem", "side effect", "pain",
        "உதவி", "பிரச்சனை", "ஆபத்து"
    ]
    for kw in help_keywords:
        if kw == cleaned or re.search(rf"\b{re.escape(kw)}\b", cleaned):
            return "help"

    # 2. Keypad single button press: any digit 0-9 or keypad symbols (*, #)
    if cleaned in ["0", "1", "3", "4", "5", "6", "7", "8", "9", "*", "#"]:
        return "confirm"

    # 3. Standard confirmation words
    confirm_keywords = [
        "yes", "y", "taken", "took", "done", "ok", "confirm",
        "ஆமாம்", "எடுத்தேன்", "சரி"
    ]
    for kw in confirm_keywords:
        if kw == cleaned or re.search(rf"\b{re.escape(kw)}\b", cleaned):
            return "confirm"

    return "unknown"


def find_pending_reminder_for_phone(db: Session, phone: str) -> Optional[ReminderEvent]:
    """Find the most recent pending or sent reminder within the last 24 hours for this phone."""
    patient = get_user_by_phone(db, phone)
    if not patient:
        return None

    now_utc = datetime.now(timezone.utc)
    lookback = now_utc - timedelta(hours=24)

    reminder = db.query(ReminderEvent).filter(
        ReminderEvent.patient_id == patient.id,
        ReminderEvent.status.in_([ReminderStatus.SENT, ReminderStatus.PROCESSING, ReminderStatus.SCHEDULED]),
        ReminderEvent.scheduled_datetime >= lookback,
    ).order_by(ReminderEvent.scheduled_datetime.desc()).first()

    return reminder


def is_duplicate_confirmation(db: Session, reminder_id: str, method: str = "sms") -> bool:
    """Check if reminder has already been confirmed."""
    existing = db.query(DoseConfirmation).filter(
        DoseConfirmation.reminder_id == reminder_id
    ).first()
    return existing is not None


def process_incoming_sms(
    db: Session,
    from_number: str,
    body: str,
    timestamp: Optional[datetime] = None
) -> Dict[str, Any]:
    """Process an inbound SMS message from a patient, with 1=confirm, 2=help keypad support."""
    patient = get_user_by_phone(db, from_number)
    if not patient:
        return {
            "success": False,
            "action": "ignored",
            "message": "Phone number not associated with any registered user."
        }

    lang = patient.language.value if patient.language else "en"
    intent = parse_sms_reply(body)

    if intent == "confirm":
        reminder = find_pending_reminder_for_phone(db, from_number)
        if not reminder:
            reply_text = get_text("confirmation_duplicate", lang, medicine_name="your medicine")
            send_custom_notification(db, patient.id, DeliveryChannel.SMS, reply_text, phone_number=from_number)
            return {"success": True, "action": "already_confirmed_or_none", "message": reply_text}

        if is_duplicate_confirmation(db, reminder.id, "sms"):
            medicine = db.query(Medicine).filter(Medicine.id == reminder.medicine_id).first()
            med_name = medicine.name if medicine else "medicine"
            reply_text = get_text("confirmation_duplicate", lang, medicine_name=med_name)
            send_custom_notification(db, patient.id, DeliveryChannel.SMS, reply_text, phone_number=from_number)
            return {"success": True, "action": "duplicate_confirmation", "message": reply_text}

        # Perform dose confirmation
        confirm_reminder(
            db=db,
            reminder_id=reminder.id,
            patient_id=patient.id,
            method=ConfirmationMethod.SMS,
            notes=f"Confirmed via SMS keypad reply: '{body.strip()}'",
            confirmed_at=timestamp or datetime.now(timezone.utc)
        )

        medicine = db.query(Medicine).filter(Medicine.id == reminder.medicine_id).first()
        med_name = medicine.name if medicine else "medicine"
        time_str = datetime.now(timezone.utc).strftime("%I:%M %p")
        reply_text = get_text("confirmation_success", lang, patient_name=patient.full_name, medicine_name=med_name, time=time_str)
        send_custom_notification(db, patient.id, DeliveryChannel.SMS, reply_text, phone_number=from_number)

        return {
            "success": True,
            "action": "confirmed",
            "reminder_id": reminder.id,
            "patient_id": patient.id,
            "message": reply_text
        }

    elif intent == "help":
        reminder = find_pending_reminder_for_phone(db, from_number)
        assistance_req = AssistanceRequest(
            patient_id=patient.id,
            reminder_id=reminder.id if reminder else None,
            request_type="sms_keypad_help_request",
            status="open"
        )
        db.add(assistance_req)
        db.commit()

        from app.services.escalation_service import alert_caregivers_for_assistance
        alert_caregivers_for_assistance(db, patient.id, assistance_req.id)

        reply_text = get_text("assistance_received", lang, patient_name=patient.full_name)
        send_custom_notification(db, patient.id, DeliveryChannel.SMS, reply_text, phone_number=from_number)
        return {
            "success": True,
            "action": "help_requested",
            "assistance_request_id": assistance_req.id,
            "message": reply_text
        }

    else:
        reply_text = get_text("unknown_reply", lang)
        send_custom_notification(db, patient.id, DeliveryChannel.SMS, reply_text, phone_number=from_number)
        return {
            "success": True,
            "action": "unknown_reply_handled",
            "message": reply_text
        }
