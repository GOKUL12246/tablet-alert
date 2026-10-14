from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from app.models.medicine import MedicineVerificationStatus, PrescriptionVerificationStatus


class MedicineBase(BaseModel):
    name: str = Field(..., min_length=1)
    brand_name: Optional[str] = None
    active_ingredient: Optional[str] = None
    strength: str = Field(..., min_length=1)
    dosage_form: Optional[str] = "tablet"
    prescribed_quantity: Optional[str] = "1 tablet"
    route: Optional[str] = "oral"

    # Medicine Visual Identification
    tablet_color: Optional[str] = None  # e.g. white, yellow, pink
    tablet_shape: Optional[str] = None  # e.g. round, oval, capsule
    tablet_size: Optional[str] = None  # e.g. small 6mm, medium 10mm
    strip_cover_color: Optional[str] = None  # e.g. silver, blue blister pack
    box_color: Optional[str] = None  # e.g. red and white box
    packaging_image_path: Optional[str] = None

    # Compatibility aliases
    color: Optional[str] = None
    shape: Optional[str] = None
    size_description: Optional[str] = None
    packaging_color: Optional[str] = None

    # Non-literacy Pictogram Support
    icon_symbol: Optional[str] = "sun"  # sun, moon, food, water
    pictogram_code: Optional[str] = "sun-morning"  # sun-morning, moon-night, meal-before

    special_instructions: Optional[str] = None
    food_instructions: Optional[str] = "after_food"
    warning_info: Optional[str] = None
    prescriber_name: Optional[str] = None
    pharmacy_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

    # Tablet Stock & Inventory Tracking
    total_tablets: Optional[int] = 30
    remaining_tablets: Optional[int] = 30
    low_stock_threshold: Optional[int] = 10


class MedicineCreate(MedicineBase):
    patient_id: Optional[str] = None  # Inferred from current user if not provided
    prescription_id: Optional[str] = None
    verification_status: Optional[MedicineVerificationStatus] = MedicineVerificationStatus.VERIFIED


class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    brand_name: Optional[str] = None
    active_ingredient: Optional[str] = None
    strength: Optional[str] = None
    dosage_form: Optional[str] = None
    prescribed_quantity: Optional[str] = None
    route: Optional[str] = None

    tablet_color: Optional[str] = None
    tablet_shape: Optional[str] = None
    tablet_size: Optional[str] = None
    strip_cover_color: Optional[str] = None
    box_color: Optional[str] = None
    packaging_image_path: Optional[str] = None

    color: Optional[str] = None
    shape: Optional[str] = None
    size_description: Optional[str] = None
    packaging_color: Optional[str] = None

    icon_symbol: Optional[str] = None
    pictogram_code: Optional[str] = None

    special_instructions: Optional[str] = None
    food_instructions: Optional[str] = None
    warning_info: Optional[str] = None
    prescriber_name: Optional[str] = None
    pharmacy_name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    verification_status: Optional[MedicineVerificationStatus] = None
    is_active: Optional[bool] = None
    total_tablets: Optional[int] = None
    remaining_tablets: Optional[int] = None
    low_stock_threshold: Optional[int] = None


class MedicineRefillRequest(BaseModel):
    refill_quantity: int = Field(30, ge=1, le=1000, description="Number of tablets added to available stock")


class MedicineOut(MedicineBase):
    id: str
    patient_id: str
    verification_status: MedicineVerificationStatus
    is_active: bool
    prescription_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PrescriptionBase(BaseModel):
    file_path: str
    file_type: Optional[str] = None


class PrescriptionCreate(PrescriptionBase):
    patient_id: Optional[str] = None


class PrescriptionExtractResponse(BaseModel):
    raw_text: str
    extracted_data: Dict[str, Any]
    confidence: float
    warnings: List[str] = Field(default_factory=list)


class PrescriptionVerifyRequest(BaseModel):
    verification_notes: Optional[str] = None
    status: PrescriptionVerificationStatus = PrescriptionVerificationStatus.VERIFIED


class PrescriptionOut(PrescriptionBase):
    id: str
    patient_id: str
    medicine_id: Optional[str] = None
    ocr_raw_text: Optional[str] = None
    ocr_extracted_data: Dict[str, Any] = Field(default_factory=dict)
    ocr_confidence: float
    verification_status: PrescriptionVerificationStatus
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True
