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
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ConsentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REVOKED = "revoked"


class ContactMethod(str, enum.Enum):
    SMS = "sms"
    APP = "app"
    BOTH = "both"


class CaregiverRelationship(Base):
    __tablename__ = "caregiver_relationships"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    caregiver_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(100), nullable=True)  # daughter, son, spouse, nurse, friend
    relation_label = Column(String(100), default="family member", nullable=False)  # son, daughter, spouse, caretaker, nurse, family member
    consent_status = Column(SAEnum(ConsentStatus), default=ConsentStatus.PENDING, nullable=False, index=True)
    consent_granted_at = Column(DateTime(timezone=True), nullable=True)
    consent_revoked_at = Column(DateTime(timezone=True), nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    can_view_medicines = Column(Boolean, default=True, nullable=False)
    can_view_schedule = Column(Boolean, default=True, nullable=False)
    can_view_adherence = Column(Boolean, default=True, nullable=False)
    escalation_order = Column(Integer, default=1, nullable=False)  # 1=primary, 2=secondary
    contact_method = Column(SAEnum(ContactMethod), default=ContactMethod.BOTH, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    patient = relationship("User", foreign_keys=[patient_id])
    caregiver = relationship("User", foreign_keys=[caregiver_id])

    __table_args__ = (
        UniqueConstraint("patient_id", "caregiver_id", name="uq_patient_caregiver"),
    )
