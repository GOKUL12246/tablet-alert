from typing import List, Optional, Union
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.exceptions import (
    BadRequestException,
    DuplicateResourceException,
    NotFoundException,
)
from app.models.medicine import Medicine, MedicineVerificationStatus
from app.schemas.medicine import MedicineCreate, MedicineUpdate


def validate_medicine_data(data: Union[MedicineCreate, MedicineUpdate]) -> List[str]:
    """Inspect medicine data and return a list of warnings or recommendations."""
    warnings: List[str] = []

    if data.name:
        if len(data.name.strip()) < 2:
            warnings.append("Medicine name is very short; please confirm spelling.")

    if data.strength:
        strength_lower = data.strength.lower()
        if not any(unit in strength_lower for unit in ["mg", "ml", "g", "mcg", "iu", "drop", "puff", "%"]):
            warnings.append("Strength does not specify common dosage units (e.g., mg, ml, mcg).")

    if data.food_instructions:
        allowed = ["before_food", "with_food", "after_food", "empty_stomach", "not_applicable"]
        if data.food_instructions.lower() not in allowed:
            warnings.append(f"Unusual food instruction '{data.food_instructions}'. Expected one of {allowed}.")

    return warnings


def check_duplicate_medicine(
    db: Session,
    patient_id: str,
    name: str,
    strength: str,
    exclude_id: Optional[str] = None
) -> bool:
    """Check if patient already has an active medicine with identical name and strength."""
    query = db.query(Medicine).filter(
        Medicine.patient_id == patient_id,
        func.lower(Medicine.name) == name.strip().lower(),
        func.lower(Medicine.strength) == strength.strip().lower(),
        Medicine.is_active == True,
    )
    if exclude_id:
        query = query.filter(Medicine.id != exclude_id)
    return query.first() is not None


def create_medicine(db: Session, patient_id: str, schema: MedicineCreate) -> Medicine:
    """Create a new medicine record for a patient."""
    if check_duplicate_medicine(db, patient_id, schema.name, schema.strength):
        raise DuplicateResourceException(
            detail=f"An active medicine '{schema.name}' ({schema.strength}) is already registered for this patient."
        )

    medicine = Medicine(
        patient_id=patient_id,
        name=schema.name.strip(),
        brand_name=schema.brand_name.strip() if schema.brand_name else None,
        active_ingredient=schema.active_ingredient.strip() if schema.active_ingredient else None,
        strength=schema.strength.strip(),
        dosage_form=schema.dosage_form,
        prescribed_quantity=schema.prescribed_quantity,
        route=schema.route or "oral",
        tablet_color=schema.tablet_color or schema.color,
        tablet_shape=schema.tablet_shape or schema.shape,
        tablet_size=schema.tablet_size or schema.size_description,
        strip_cover_color=schema.strip_cover_color,
        box_color=schema.box_color,
        packaging_image_path=schema.packaging_image_path,
        color=schema.color or schema.tablet_color,
        shape=schema.shape or schema.tablet_shape,
        size_description=schema.size_description or schema.tablet_size,
        packaging_color=schema.packaging_color or schema.box_color,
        icon_symbol=schema.icon_symbol or "sun",
        pictogram_code=schema.pictogram_code or "sun-morning",
        special_instructions=schema.special_instructions,
        food_instructions=schema.food_instructions or "after_food",
        warning_info=schema.warning_info,
        prescriber_name=schema.prescriber_name,
        pharmacy_name=schema.pharmacy_name,
        start_date=schema.start_date,
        end_date=schema.end_date,
        total_tablets=schema.total_tablets if schema.total_tablets is not None else 30,
        remaining_tablets=schema.remaining_tablets if schema.remaining_tablets is not None else (schema.total_tablets or 30),
        low_stock_threshold=schema.low_stock_threshold if schema.low_stock_threshold is not None else 10,
        verification_status=schema.verification_status or MedicineVerificationStatus.VERIFIED,
        prescription_id=schema.prescription_id,
        is_active=True,
    )
    db.add(medicine)
    db.commit()
    db.refresh(medicine)
    return medicine


def get_patient_medicines(
    db: Session,
    patient_id: str,
    include_inactive: bool = False
) -> List[Medicine]:
    """Retrieve all medicines for a given patient."""
    query = db.query(Medicine).filter(Medicine.patient_id == patient_id)
    if not include_inactive:
        query = query.filter(Medicine.is_active == True)
    return query.order_by(Medicine.name.asc()).all()


def get_medicine_by_id(
    db: Session,
    medicine_id: str,
    patient_id: Optional[str] = None
) -> Optional[Medicine]:
    """Retrieve medicine by ID, optionally restricted to a specific patient."""
    query = db.query(Medicine).filter(Medicine.id == medicine_id)
    if patient_id:
        query = query.filter(Medicine.patient_id == patient_id)
    return query.first()


def update_medicine(
    db: Session,
    medicine_id: str,
    patient_id: str,
    schema: MedicineUpdate
) -> Medicine:
    """Update medicine fields."""
    medicine = get_medicine_by_id(db, medicine_id, patient_id)
    if not medicine:
        raise NotFoundException(detail=f"Medicine with ID '{medicine_id}' not found")

    update_dict = schema.model_dump(exclude_unset=True)

    # Check potential duplicate if name or strength changed
    new_name = update_dict.get("name", medicine.name)
    new_strength = update_dict.get("strength", medicine.strength)
    if (new_name != medicine.name or new_strength != medicine.strength) and update_dict.get("is_active", medicine.is_active):
        if check_duplicate_medicine(db, patient_id, new_name, new_strength, exclude_id=medicine.id):
            raise DuplicateResourceException(
                detail=f"Active medicine with name '{new_name}' and strength '{new_strength}' already exists."
            )

    for field, value in update_dict.items():
        setattr(medicine, field, value)

    db.commit()
    db.refresh(medicine)
    return medicine


def discontinue_medicine(db: Session, medicine_id: str, patient_id: str) -> Medicine:
    """Mark medicine as discontinued and inactive."""
    medicine = get_medicine_by_id(db, medicine_id, patient_id)
    if not medicine:
        raise NotFoundException(detail=f"Medicine with ID '{medicine_id}' not found")

    medicine.is_active = False
    medicine.verification_status = MedicineVerificationStatus.DISCONTINUED

    # Also deactivate associated schedules
    for sched in medicine.schedules:
        sched.is_active = False
        sched.pause_reason = "Medicine discontinued"

    db.commit()
    db.refresh(medicine)
    return medicine


def refill_medicine_stock(
    db: Session,
    medicine_id: str,
    patient_id: str,
    refill_count: int = 30
) -> Medicine:
    """Add tablets to available stock and update total."""
    medicine = get_medicine_by_id(db, medicine_id, patient_id)
    if not medicine:
        raise NotFoundException(detail=f"Medicine with ID '{medicine_id}' not found")

    current_rem = medicine.remaining_tablets if medicine.remaining_tablets is not None else 0
    medicine.remaining_tablets = current_rem + refill_count
    current_tot = medicine.total_tablets if medicine.total_tablets is not None else 0
    medicine.total_tablets = max(current_tot + refill_count, medicine.remaining_tablets)
    # Clear alert flag once refilled
    medicine.last_low_stock_alert_at = None

    db.commit()
    db.refresh(medicine)
    return medicine
