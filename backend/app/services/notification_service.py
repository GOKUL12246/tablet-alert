import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional
import httpx
from sqlalchemy.orm import Session

from app.config import settings
from app.core.i18n import get_text
from app.models.medicine import Medicine
from app.models.notification import (
    DeliveryChannel,
    DeliveryStatus,
    NotificationDelivery,
    RecipientType,
)
from app.models.reminder import ReminderEvent
from app.models.user import User

logger = logging.getLogger("medisakhi.notification")


class BaseNotificationProvider:
    def send_sms(self, to_phone: str, message: str) -> Dict[str, Any]:
        raise NotImplementedError


class DemoProvider(BaseNotificationProvider):
    def send_sms(self, to_phone: str, message: str) -> Dict[str, Any]:
        logger.info(f"[DEMO SMS] To: {to_phone} | Sender: {settings.SMS_SENDER_ID} | Message: {message}")
        return {
            "success": True,
            "provider_message_id": f"demo-msg-{uuid.uuid4().hex[:12]}",
            "provider_status": "delivered",
            "error": None
        }


class TwilioProvider(BaseNotificationProvider):
    def send_sms(self, to_phone: str, message: str) -> Dict[str, Any]:
        sid = settings.TWILIO_SID
        token = settings.TWILIO_AUTH_TOKEN
        from_num = settings.TWILIO_NUMBER

        if not sid or not token or not from_num:
            logger.warning("Twilio credentials not fully configured, falling back to simulation.")
            return DemoProvider().send_sms(to_phone, message)

        dest_phone = to_phone or settings.RECEIVER_NUMBER or "+916369067138"
        try:
            logger.info(f"[TWILIO LIVE SMS] Sending to {dest_phone} from {from_num}: {message[:50]}...")
            url = f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json"
            response = httpx.post(
                url,
                data={
                    "From": from_num,
                    "To": dest_phone,
                    "Body": message
                },
                auth=(sid, token),
                timeout=10.0
            )

            if response.status_code in [200, 201]:
                res_data = response.json()
                logger.info(f"[TWILIO SUCCESS] Message SID: {res_data.get('sid')}")
                return {
                    "success": True,
                    "provider_message_id": res_data.get("sid", f"tw-{uuid.uuid4().hex[:12]}"),
                    "provider_status": res_data.get("status", "sent"),
                    "error": None
                }
            else:
                err_data = response.json() if "application/json" in response.headers.get("content-type", "") else {}
                err_msg = err_data.get("message", response.text)
                err_code = err_data.get("code", response.status_code)
                logger.warning(f"[TWILIO API NOTE] HTTP {response.status_code} (Code {err_code}): {err_msg}")
                # We record the Twilio response clearly and return gracefully
                return {
                    "success": False,
                    "provider_message_id": None,
                    "provider_status": f"twilio_code_{err_code}",
                    "error": f"Twilio API (Code {err_code}): {err_msg}"
                }
        except Exception as e:
            logger.error(f"Twilio SMS request exception: {e}")
            return {
                "success": False,
                "provider_message_id": None,
                "provider_status": "error",
                "error": str(e)
            }


def get_sms_provider() -> BaseNotificationProvider:
    if settings.SMS_PROVIDER.lower() == "twilio":
        return TwilioProvider()
    return DemoProvider()


def record_delivery(db: Session, delivery_data: Dict[str, Any]) -> NotificationDelivery:
    """Record a notification delivery attempt in the database."""
    delivery = NotificationDelivery(
        reminder_id=delivery_data.get("reminder_id"),
        caregiver_alert_id=delivery_data.get("caregiver_alert_id"),
        recipient_id=delivery_data["recipient_id"],
        recipient_type=delivery_data.get("recipient_type", RecipientType.PATIENT),
        channel=delivery_data.get("channel", DeliveryChannel.SMS),
        status=delivery_data.get("status", DeliveryStatus.PENDING),
        provider_name=delivery_data.get("provider_name", settings.SMS_PROVIDER),
        provider_message_id=delivery_data.get("provider_message_id"),
        provider_status=delivery_data.get("provider_status"),
        sent_at=delivery_data.get("sent_at"),
        delivered_at=delivery_data.get("delivered_at"),
        failed_at=delivery_data.get("failed_at"),
        error_message=delivery_data.get("error_message"),
        attempt_number=delivery_data.get("attempt_number", 1),
        idempotency_key=delivery_data.get("idempotency_key")
    )
    db.add(delivery)
    db.commit()
    db.refresh(delivery)
    return delivery


def send_reminder_notification(db: Session, reminder_id: str) -> Optional[NotificationDelivery]:
    """Compose and send notification for a due reminder with visual identification and keypad support."""
    reminder = db.query(ReminderEvent).filter(ReminderEvent.id == reminder_id).first()
    if not reminder:
        return None

    patient = db.query(User).filter(User.id == reminder.patient_id).first()
    medicine = db.query(Medicine).filter(Medicine.id == reminder.medicine_id).first()
    if not patient or not medicine:
        return None

    lang = patient.language.value if patient.language else "en"

    # Visual identification formatting
    color = medicine.tablet_color or medicine.color or "white"
    shape = medicine.tablet_shape or medicine.shape or "round"
    size = medicine.tablet_size or medicine.size_description or ""
    qty = medicine.prescribed_quantity or "1 tablet"

    if lang == "ta":
        color_ta = "வெள்ளை" if "white" in color.lower() else "மஞ்சள்" if "yellow" in color.lower() else "இளஞ்சிவப்பு" if "pink" in color.lower() else color
        shape_ta = "வட்ட மாத்திரை" if "round" in shape.lower() else "நீள்வட்ட மாத்திரை" if "oval" in shape.lower() else "காப்ஸ்யூல்" if "capsule" in shape.lower() else shape
        visual_desc = f"{color_ta} {shape_ta}".strip()
    else:
        visual_desc = f"{color} {shape} tablet".strip()

    message_body = get_text(
        "reminder_keypad",
        lang,
        medicine_name=medicine.name,
        strength=medicine.strength,
        prescribed_quantity=qty,
        visual_desc=visual_desc
    )

    now_utc = datetime.now(timezone.utc)
    idempotency_key = f"reminder-{reminder.id}-attempt-1"

    # Check if notification already delivered for this reminder and attempt
    existing = db.query(NotificationDelivery).filter(
        NotificationDelivery.idempotency_key == idempotency_key
    ).first()
    if existing:
        return existing

    provider = get_sms_provider()
    target_phone = patient.phone_number or "+919876543210"
    result = provider.send_sms(target_phone, message_body)

    status = DeliveryStatus.DELIVERED if result["success"] else DeliveryStatus.FAILED
    delivered_at = now_utc if result["success"] else None
    failed_at = None if result["success"] else now_utc

    delivery = record_delivery(
        db,
        {
            "reminder_id": reminder.id,
            "recipient_id": patient.id,
            "recipient_type": RecipientType.PATIENT,
            "channel": DeliveryChannel.SMS,
            "status": status,
            "provider_name": settings.SMS_PROVIDER,
            "provider_message_id": result.get("provider_message_id"),
            "provider_status": result.get("provider_status"),
            "sent_at": now_utc,
            "delivered_at": delivered_at,
            "failed_at": failed_at,
            "error_message": result.get("error"),
            "attempt_number": 1,
            "idempotency_key": idempotency_key,
        }
    )

    if result["success"]:
        reminder.delivered_at = now_utc

    db.commit()
    return delivery


def send_custom_notification(
    db: Session,
    recipient_id: str,
    channel: DeliveryChannel,
    message: str,
    phone_number: Optional[str] = None,
    recipient_type: RecipientType = RecipientType.PATIENT,
    reminder_id: Optional[str] = None,
    caregiver_alert_id: Optional[str] = None
) -> NotificationDelivery:
    """Send arbitrary notification directly to a user."""
    user = db.query(User).filter(User.id == recipient_id).first()
    target_phone = phone_number or (user.phone_number if user else "+919876543210") or "+919876543210"

    provider = get_sms_provider()
    now_utc = datetime.now(timezone.utc)
    result = provider.send_sms(target_phone, message)

    status = DeliveryStatus.DELIVERED if result["success"] else DeliveryStatus.FAILED
    delivery = record_delivery(
        db,
        {
            "reminder_id": reminder_id,
            "caregiver_alert_id": caregiver_alert_id,
            "recipient_id": recipient_id,
            "recipient_type": recipient_type,
            "channel": channel,
            "status": status,
            "provider_name": settings.SMS_PROVIDER,
            "provider_message_id": result.get("provider_message_id"),
            "provider_status": result.get("provider_status"),
            "sent_at": now_utc,
            "delivered_at": now_utc if result["success"] else None,
            "failed_at": None if result["success"] else now_utc,
            "error_message": result.get("error"),
            "attempt_number": 1,
            "idempotency_key": f"custom-{uuid.uuid4().hex[:12]}"
        }
    )
    return delivery


def retry_failed_notifications(db: Session) -> None:
    """Retry deliveries that previously failed, up to 3 attempts."""
    failed_deliveries = db.query(NotificationDelivery).filter(
        NotificationDelivery.status == DeliveryStatus.FAILED,
        NotificationDelivery.attempt_number < 3
    ).all()

    provider = get_sms_provider()

    for item in failed_deliveries:
        recipient = db.query(User).filter(User.id == item.recipient_id).first()
        if not recipient or not recipient.phone_number:
            continue

        item.attempt_number += 1
        now_utc = datetime.now(timezone.utc)
        result = provider.send_sms(recipient.phone_number, "MEDISAKHI Retry Alert: Please take your medicine.")

        if result["success"]:
            item.status = DeliveryStatus.DELIVERED
            item.delivered_at = now_utc
            item.error_message = None
        else:
            item.failed_at = now_utc
            item.error_message = result.get("error")

        db.commit()
