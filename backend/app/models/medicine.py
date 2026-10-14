import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum as SAEnum,
    Float,
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


class MedicineVerificationStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    OCR_EXTRACTED = "ocr_extracted"
    AWAITING_CONFIRMATION = "awaiting_confirmation"
    VERIFIED = "verified"
    VERIFICATION_REQUIRED = "verification_required"
    DISCONTINUED = "discontinued"


class PrescriptionVerificationStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    OCR_EXTRACTED = "ocr_extracted"
    VERIFIED = "verified"
    REJECTED = "rejected"


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), index=True, nullable=False)
    brand_name = Column(String(255), nullable=True)
    active_ingredient = Column(String(255), nullable=True)
    strength = Column(String(100), nullable=False)  # e.g., "500 mg", "10 ml"
    dosage_form = Column(String(100), nullable=True)  # tablet, capsule, syrup, drop
    prescribed_quantity = Column(String(100), default="1 tablet", nullable=True)
    route = Column(String(100), default="oral", nullable=True)

    # Medicine Visual Identification
    tablet_color = Column(String(50), nullable=True)  # e.g. white, yellow, pink
    tablet_shape = Column(String(50), nullable=True)  # e.g. round, oval, capsule
    tablet_size = Column(String(100), nullable=True)  # e.g. small 6mm, medium 10mm
    strip_cover_color = Column(String(100), nullable=True)  # e.g. silver, blue blister pack
    box_color = Column(String(100), nullable=True)  # e.g. red and white box
    packaging_image_path = Column(String(512), nullable=True)  # uploaded image of tablet or box

    # Compatibility aliases
    color = Column(String(50), nullable=True)
    shape = Column(String(50), nullable=True)
    size_description = Column(String(100), nullable=True)
    packaging_color = Column(String(50), nullable=True)

    # Non-literacy Pictogram Support
    icon_symbol = Column(String(50), default="sun", nullable=True)  # sun, moon, food, water
    pictogram_code = Column(String(100), default="sun-morning", nullable=True)  # sun-morning, moon-night, meal-before

    special_instructions = Column(Text, nullable=True)
    food_instructions = Column(String(100), default="after_food", nullable=True)  # before_food, with_food, after_food
    warning_info = Column(Text, nullable=True)
    prescriber_name = Column(String(255), nullable=True)
    pharmacy_name = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    verification_status = Column(
        SAEnum(MedicineVerificationStatus),
        default=MedicineVerificationStatus.VERIFIED,
        nullable=False,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    # Tablet Stock & Inventory Tracking
    total_tablets = Column(Integer, default=30, nullable=False)
    remaining_tablets = Column(Integer, default=30, nullable=False)
    low_stock_threshold = Column(Integer, default=10, nullable=False)
    last_low_stock_alert_at = Column(DateTime(timezone=True), nullable=True)

    prescription_id = Column(String(36), ForeignKey("prescriptions.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    patient = relationship("User", foreign_keys=[patient_id], back_populates="medicines")
    prescription = relationship("Prescription", foreign_keys=[prescription_id], post_update=True)
    schedules = relationship("MedicineSchedule", back_populates="medicine", cascade="all, delete-orphan")
    reminders = relationship("ReminderEvent", back_populates="medicine", cascade="all, delete-orphan")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    patient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    medicine_id = Column(String(36), nullable=True)
    file_path = Column(String(512), nullable=False)
    file_type = Column(String(50), nullable=True)
    ocr_raw_text = Column(Text, nullable=True)
    ocr_extracted_data = Column(JSON, default=dict, nullable=False)
    ocr_confidence = Column(Float, default=0.0, nullable=False)
    verification_status = Column(
        SAEnum(PrescriptionVerificationStatus),
        default=PrescriptionVerificationStatus.UPLOADED,
        nullable=False,
    )
    verified_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verification_notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    patient = relationship("User", foreign_keys=[patient_id])
    verifier = relationship("User", foreign_keys=[verified_by])
