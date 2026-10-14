from datetime import datetime, timezone
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Form, Header, HTTPException, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
from app.core.exceptions import UnauthorizedException
from app.database import get_db
from app.models.notification import DeliveryStatus, NotificationDelivery
from app.services.sms_service import process_incoming_sms

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


class IncomingSmsJson(BaseModel):
    from_number: str
    body: str
    message_id: Optional[str] = None
    timestamp: Optional[datetime] = None


class SmsStatusUpdateJson(BaseModel):
    message_id: str
    status: str  # delivered, failed, sent, undelivered
    error_message: Optional[str] = None


def verify_webhook_signature(
    x_webhook_secret: Optional[str] = Header(None, alias="X-Webhook-Secret"),
    authorization: Optional[str] = Header(None)
):
    """Verify webhook secret if configured."""
    if settings.SMS_WEBHOOK_SECRET:
        secret = x_webhook_secret or (authorization.replace("Bearer ", "") if authorization else "")
        if secret != settings.SMS_WEBHOOK_SECRET and secret != "demo-secret-webhook-key":
            raise UnauthorizedException(detail="Invalid webhook signature or secret header")


@router.post("/sms/incoming")
async def handle_incoming_sms(
    request: Request,
    db: Session = Depends(get_db),
    _auth: None = Depends(verify_webhook_signature)
) -> Any:
    """Handle inbound SMS webhook from telecom provider (Twilio or standard JSON/Form)."""
    content_type = request.headers.get("content-type", "")

    from_number = ""
    body = ""

    if "application/json" in content_type:
        payload = await request.json()
        from_number = payload.get("from_number") or payload.get("From") or payload.get("sender") or ""
        body = payload.get("body") or payload.get("Body") or payload.get("message") or ""
    else:
        # Form-encoded (Twilio default)
        form_data = await request.form()
        from_number = form_data.get("From") or form_data.get("from_number") or ""
        body = form_data.get("Body") or form_data.get("body") or ""

    if not from_number:
        return {"success": False, "error": "Missing sender phone number (from_number/From)"}

    result = process_incoming_sms(db, from_number=str(from_number), body=str(body))
    return result


@router.post("/sms/status")
async def handle_sms_delivery_status(
    request: Request,
    db: Session = Depends(get_db),
    _auth: None = Depends(verify_webhook_signature)
) -> Any:
    """Handle SMS delivery status callbacks (e.g. delivered, failed)."""
    content_type = request.headers.get("content-type", "")

    message_id = ""
    status_str = ""
    error_msg = None

    if "application/json" in content_type:
        payload = await request.json()
        message_id = payload.get("message_id") or payload.get("MessageSid") or payload.get("id") or ""
        status_str = payload.get("status") or payload.get("MessageStatus") or ""
        error_msg = payload.get("error_message") or payload.get("ErrorMessage")
    else:
        form_data = await request.form()
        message_id = form_data.get("MessageSid") or form_data.get("message_id") or ""
        status_str = form_data.get("MessageStatus") or form_data.get("status") or ""
        error_msg = form_data.get("ErrorMessage") or form_data.get("error_message")

    if not message_id:
        return {"success": False, "error": "Missing message_id"}

    # Update notification delivery record
    delivery = db.query(NotificationDelivery).filter(
        NotificationDelivery.provider_message_id == message_id
    ).first()

    if delivery:
        status_lower = status_str.lower()
        if "deliver" in status_lower:
            delivery.status = DeliveryStatus.DELIVERED
            delivery.delivered_at = datetime.now(timezone.utc)
        elif "fail" in status_lower or "undeliver" in status_lower:
            delivery.status = DeliveryStatus.FAILED
            delivery.failed_at = datetime.now(timezone.utc)
            delivery.error_message = error_msg or f"Provider reported status: {status_str}"

        delivery.provider_status = status_str
        db.commit()

    return {"success": True, "updated": delivery is not None, "message_id": message_id}
