import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
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


class MedicineSchedule(Base):
    __tablename__ = "medicine_schedules"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    medicine_id = Column(String(36), ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    reminder_times = Column(JSON, default=list, nullable=False)  # e.g., ["08:00", "14:00", "20:00"]
    timezone = Column(String(64), default="Asia/Kolkata", nullable=False)
    days_of_week = Column(JSON, nullable=True)  # e.g. [0, 1, 2, 3, 4, 5, 6] or None for daily
    is_active = Column(Boolean, default=True, nullable=False)
    pause_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    medicine = relationship("Medicine", back_populates="schedules")
    patient = relationship("User", back_populates="schedules")
    reminders = relationship("ReminderEvent", back_populates="schedule", cascade="all, delete-orphan")
