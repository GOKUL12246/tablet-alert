import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RecipientType(str, enum.Enum):
    PATIENT = "patient"
    CAREGIVER = "caregiver"


class DeliveryChannel(str, enum.Enum):
    SMS = "sms"
    EMAIL = "email"
    APP = "app"
    VOICE = "voice"


class DeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    BOUNCED = "bounced"


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reminder_id = Column(String(36), ForeignKey("reminder_events.id", ondelete="SET NULL"), nullable=True, index=True)
    caregiver_alert_id = Column(String(36), ForeignKey("caregiver_alerts.id", ondelete="SET NULL"), nullable=True, index=True)
    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_type = Column(SAEnum(RecipientType), default=RecipientType.PATIENT, nullable=False)
    channel = Column(SAEnum(DeliveryChannel), default=DeliveryChannel.SMS, nullable=False)
    status = Column(SAEnum(DeliveryStatus), default=DeliveryStatus.PENDING, nullable=False, index=True)
    provider_name = Column(String(50), default="demo", nullable=False)
    provider_message_id = Column(String(255), nullable=True, index=True)
    provider_status = Column(String(50), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    attempt_number = Column(Integer, default=1, nullable=False)
    idempotency_key = Column(String(128), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    reminder = relationship("ReminderEvent", back_populates="deliveries")
    caregiver_alert = relationship("CaregiverAlert", back_populates="deliveries")
    recipient = relationship("User")
