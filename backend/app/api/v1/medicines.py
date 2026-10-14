from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.medicine import Medicine
from app.models.reminder import ReminderEvent, ReminderStatus
from app.models.schedule import MedicineSchedule
from app.models.user import User, UserRole
from app.schemas.medicine import MedicineCreate, MedicineOut, MedicineUpdate, MedicineRefillRequest
from app.schemas.schedule import ScheduleOut
from app.services.reminder_service import generate_reminders_for_schedule
from app.services.medicine_service import (
    create_medicine,
    discontinue_medicine,
    get_medicine_by_id,
    get_patient_medicines,
    refill_medicine_stock,
    update_medicine,
    validate_medicine_data,
)

router = APIRouter(prefix="/medicines", tags=["Medicines"])


@router.post("/", response_model=MedicineOut, status_code=status.HTTP_201_CREATED)
def add_medicine(
    payload: MedicineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Add a new medicine record for the patient."""
    target_patient_id = current_user.id
    if current_user.role in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL] and payload.patient_id:
        target_patient_id = payload.patient_id

    medicine = create_medicine(db, target_patient_id, payload)
    return medicine


@router.get("/", response_model=List[MedicineOut])
def list_medicines(
    patient_id: Optional[str] = Query(None, description="Optional patient ID if accessed by caregiver/doctor"),
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve medicines for the current patient or an authorized patient."""
    target_patient_id = current_user.id
    if patient_id and current_user.role in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        target_patient_id = patient_id

    medicines = get_patient_medicines(db, target_patient_id, include_inactive=include_inactive)
    return medicines


@router.get("/{id}", response_model=MedicineOut)
def get_medicine(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get single medicine by ID."""
    medicine = get_medicine_by_id(db, id)
    if not medicine:
        raise NotFoundException(detail=f"Medicine with ID '{id}' not found")

    if medicine.patient_id != current_user.id and current_user.role not in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        raise ForbiddenException(detail="You do not have permission to view this medicine")

    return medicine


@router.put("/{id}", response_model=MedicineOut)
def update_existing_medicine(
    id: str,
    payload: MedicineUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update medicine properties, dosage instructions, and visual identifiers."""
    medicine = get_medicine_by_id(db, id)
    if not medicine:
        raise NotFoundException(detail=f"Medicine with ID '{id}' not found")

    if medicine.patient_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        raise ForbiddenException(detail="You do not have permission to update this medicine")

    updated = update_medicine(db, id, medicine.patient_id, payload)
    return updated


@router.post("/{id}/discontinue", response_model=MedicineOut)
def stop_medicine(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Discontinue an active medicine."""
    medicine = get_medicine_by_id(db, id)
    if not medicine:
        raise NotFoundException(detail=f"Medicine with ID '{id}' not found")

    if medicine.patient_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        raise ForbiddenException(detail="You do not have permission to discontinue this medicine")

    discontinued = discontinue_medicine(db, id, medicine.patient_id)
    return discontinued


@router.get("/{id}/schedule", response_model=List[ScheduleOut])
def get_schedules_for_medicine(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve reminder schedules linked to this medicine."""
    schedules = db.query(MedicineSchedule).filter(MedicineSchedule.medicine_id == id).all()
    return schedules


class SetMedicineScheduleRequest(BaseModel):
    reminder_times: List[str]
    timezone: Optional[str] = "Asia/Kolkata"


@router.post("/{id}/schedule", response_model=ScheduleOut)
def set_medicine_schedule(
    id: str,
    payload: SetMedicineScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Set or update reminder clock times for a medicine and regenerate upcoming reminders."""
    medicine = get_medicine_by_id(db, id)
    if not medicine:
        raise NotFoundException(detail=f"Medicine with ID '{id}' not found")

    if medicine.patient_id != current_user.id and current_user.role not in [UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        raise ForbiddenException(detail="You do not have permission to modify this schedule")

    schedule = db.query(MedicineSchedule).filter(
        MedicineSchedule.medicine_id == id,
        MedicineSchedule.patient_id == medicine.patient_id
    ).first()

    if not schedule:
        schedule = MedicineSchedule(
            medicine_id=medicine.id,
            patient_id=medicine.patient_id,
            reminder_times=payload.reminder_times,
            timezone=payload.timezone or "Asia/Kolkata",
            is_active=True
        )
        db.add(schedule)
    else:
        schedule.reminder_times = payload.reminder_times
        schedule.is_active = True
        if payload.timezone:
            schedule.timezone = payload.timezone

    db.commit()
    db.refresh(schedule)

    # Clean up pending future scheduled reminders and regenerate with new clock times
    now_utc = datetime.now(timezone.utc)
    db.query(ReminderEvent).filter(
        ReminderEvent.schedule_id == schedule.id,
        ReminderEvent.scheduled_datetime >= now_utc,
        ReminderEvent.status.in_([ReminderStatus.SCHEDULED, ReminderStatus.PROCESSING])
    ).delete(synchronize_session=False)
    db.commit()

    generate_reminders_for_schedule(db, schedule.id, days_ahead=2)
    db.refresh(schedule)
    return schedule


@router.post("/{id}/refill", response_model=MedicineOut)
def refill_medicine(
    id: str,
    payload: MedicineRefillRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Add tablets to available stock and clear alert if refilled."""
    medicine = get_medicine_by_id(db, id)
    if not medicine:
        raise NotFoundException(detail=f"Medicine with ID '{id}' not found")

    return refill_medicine_stock(db, id, medicine.patient_id, payload.refill_quantity)
