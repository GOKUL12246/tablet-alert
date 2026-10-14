import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SAEnum,
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


class UserRole(str, enum.Enum):
    PATIENT = "patient"
    CAREGIVER = "caregiver"
    HEALTHCARE_PROFESSIONAL = "healthcare_professional"
    ADMIN = "admin"


class UserLanguage(str, enum.Enum):
    EN = "en"
    TA = "ta"


class DisabilityType(str, enum.Enum):
    NONE = "none"
    VISUAL = "visual"
    HEARING = "hearing"
    MOBILITY = "mobility"
    COGNITIVE = "cognitive"
    SPEECH = "speech"


class PreferredAlertMode(str, enum.Enum):
    AUDIO = "audio"
    VIBRATION = "vibration"
    VISUAL = "visual"
    SMS = "sms"
    CALL = "call"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone_number = Column(String(32), index=True, nullable=True)
    role = Column(SAEnum(UserRole), default=UserRole.PATIENT, nullable=False)
    language = Column(SAEnum(UserLanguage), default=UserLanguage.EN, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    medicines = relationship("Medicine", back_populates="patient", foreign_keys="Medicine.patient_id", cascade="all, delete-orphan")
    schedules = relationship("MedicineSchedule", back_populates="patient", cascade="all, delete-orphan")
    reminders = relationship("ReminderEvent", back_populates="patient", cascade="all, delete-orphan")
    accessibility = relationship("AccessibilityPreferences", back_populates="user", uselist=False, cascade="all, delete-orphan")
    chat_conversations = relationship("ChatbotConversation", back_populates="patient", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    emergency_contact_name = Column(String(255), nullable=True)
    emergency_contact_phone = Column(String(32), nullable=True)
    blood_group = Column(String(10), nullable=True)
    allergies = Column(JSON, default=list, nullable=False)
    notes = Column(Text, nullable=True)

    # Disability and Accommodation Support
    disability_type = Column(SAEnum(DisabilityType), default=DisabilityType.NONE, nullable=False)
    preferred_alert_mode = Column(SAEnum(PreferredAlertMode), default=PreferredAlertMode.SMS, nullable=False)
    requires_large_display = Column(Boolean, default=False, nullable=False)
    caregiver_assisted_setup = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="profile")
