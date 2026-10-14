import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship

from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ReminderStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    PROCESSING = "processing"
    SENT = "sent"
    DELIVERED = "delivered"
    ACKNOWLEDGED = "acknowledged"
    PATIENT_REPORTED_TAKEN = "patient_reported_taken"
    CONFIRMATION_NOT_RECEIVED = "confirmation_not_received"
    DELIVERY_FAILED = "delivery_failed"
    CANCELLED = "cancelled"


class ConfirmationMethod(str, enum.Enum):
    SMS = "sms"
    APP = "app"
    VOICE = "voice"


class ConfirmationType(str, enum.Enum):
    APP_BUTTON = "app_button"
    SMS_REPLY = "sms_reply"
    VOICE_RESPONSE = "voice_response"


class AlertType(str, enum.Enum):
    MISSED_REMINDER = "missed_reminder"
    ASSISTANCE_REQUEST = "assistance_request"
    REPEATED_MISS = "repeated_miss"
    LOW_STOCK = "low_stock"


class AlertStatus(str, enum.Enum):
    OPEN = "open"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"


class ReminderEvent(Base):
    __tablename__ = "reminder_events"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    schedule_id = Column(String(36), ForeignKey("medicine_schedules.id", ondelete="SET NULL"), nullable=True)
    medicine_id = Column(String(36), ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    scheduled_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(SAEnum(ReminderStatus), default=ReminderStatus.SCHEDULED, nullable=False, index=True)
    notification_channels = Column(JSON, default=lambda: ["sms", "app"], nullable=False)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    confirmed_at = Column(DateTime(timezone=True), nullable=True)
    confirmation_method = Column(SAEnum(ConfirmationMethod), nullable=True)
    missed_dose_guidance_shown = Column(Boolean, default=False, nullable=False)
    escalation_level = Column(Integer, default=0, nullable=False)  # 0=none, 1=followup, 2=caregiver_primary, 3=caregiver_secondary
    next_escalation_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    schedule = relationship("MedicineSchedule", back_populates="reminders")
    medicine = relationship("Medicine", back_populates="reminders")
    patient = relationship("User", back_populates="reminders")
    confirmations = relationship("DoseConfirmation", back_populates="reminder", cascade="all, delete-orphan")
    caregiver_alerts = relationship("CaregiverAlert", back_populates="reminder", cascade="all, delete-orphan")
    assistance_requests = relationship("AssistanceRequest", back_populates="reminder", cascade="all, delete-orphan")
    deliveries = relationship("NotificationDelivery", back_populates="reminder", cascade="all, delete-orphan")


class DoseConfirmation(Base):
    __tablename__ = "dose_confirmations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reminder_id = Column(String(36), ForeignKey("reminder_events.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    confirmation_type = Column(SAEnum(ConfirmationType), default=ConfirmationType.APP_BUTTON, nullable=False)
    confirmed_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    notes = Column(Text, nullable=True)
    is_self_reported = Column(Boolean, default=True, nullable=False)

    reminder = relationship("ReminderEvent", back_populates="confirmations")
    patient = relationship("User")


class CaregiverAlert(Base):
    __tablename__ = "caregiver_alerts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reminder_id = Column(String(36), ForeignKey("reminder_events.id", ondelete="SET NULL"), nullable=True, index=True)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    caregiver_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(SAEnum(AlertType), default=AlertType.MISSED_REMINDER, nullable=False)
    message_en = Column(Text, nullable=False)
    message_ta = Column(Text, nullable=False)
    status = Column(SAEnum(AlertStatus), default=AlertStatus.OPEN, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    reminder = relationship("ReminderEvent", back_populates="caregiver_alerts")
    patient = relationship("User", foreign_keys=[patient_id])
    caregiver = relationship("User", foreign_keys=[caregiver_id])
    deliveries = relationship("NotificationDelivery", back_populates="caregiver_alert", cascade="all, delete-orphan")


class AssistanceRequest(Base):
    __tablename__ = "assistance_requests"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reminder_id = Column(String(36), ForeignKey("reminder_events.id", ondelete="SET NULL"), nullable=True)
    request_type = Column(String(100), default="help", nullable=False)
    status = Column(String(50), default="open", nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    patient = relationship("User", foreign_keys=[patient_id])
    reminder = relationship("ReminderEvent", back_populates="assistance_requests")
