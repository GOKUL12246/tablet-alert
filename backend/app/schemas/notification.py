from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from app.models.notification import DeliveryChannel, DeliveryStatus, RecipientType


class NotificationTestRequest(BaseModel):
    recipient_id: Optional[str] = None
    channel: DeliveryChannel = DeliveryChannel.SMS
    message: str = Field(..., min_length=1)
    phone_number: Optional[str] = None


class NotificationDeliveryOut(BaseModel):
    id: str
    reminder_id: Optional[str] = None
    caregiver_alert_id: Optional[str] = None
    recipient_id: str
    recipient_type: RecipientType
    channel: DeliveryChannel
    status: DeliveryStatus
    provider_name: str
    provider_message_id: Optional[str] = None
    provider_status: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    attempt_number: int
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationStatusResponse(BaseModel):
    id: str
    status: DeliveryStatus
    provider_status: Optional[str] = None
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    error_message: Optional[str] = None
