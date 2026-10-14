from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.medicine import Medicine
from app.models.reminder import ReminderEvent, ReminderStatus
from app.models.schedule import MedicineSchedule
from app.models.user import User, UserRole
from app.schemas.schedule import (
    PauseScheduleRequest,
    ScheduleCreate,
    ScheduleOut,
    ScheduleUpdate,
)
from app.services.reminder_service import generate_reminders_for_schedule

router = APIRouter(prefix="/schedules", tags=["Schedules"])


@router.post("/", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
    payload: ScheduleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Create a new medication reminder schedule and pre-generate reminders."""
    medicine = db.query(Medicine).filter(Medicine.id == payload.medicine_id).first()
    if not medicine:
        raise NotFoundException(detail=f"Medicine '{payload.medicine_id}' not found")

    target_patient_id = medicine.patient_id

    schedule = MedicineSchedule(
        medicine_id=medicine.id,
        patient_id=target_patient_id,
        reminder_times=payload.reminder_times,
        timezone=payload.timezone,
        days_of_week=payload.days_of_week,
        is_active=True,
    )
    db.add(schedule)
    db.commit()
    db.refresh(schedule)

    # Immediately generate reminders for next 2 days
    generate_reminders_for_schedule(db, schedule.id, days_ahead=2)

    return schedule


@router.put("/{id}", response_model=ScheduleOut)
def update_schedule(
    id: str,
    payload: ScheduleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update reminder schedule times or frequency."""
    schedule = db.query(MedicineSchedule).filter(MedicineSchedule.id == id).first()
    if not schedule:
        raise NotFoundException(detail=f"Schedule '{id}' not found")

    update_dict = payload.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(schedule, key, value)

    db.commit()
    db.refresh(schedule)

    if schedule.is_active:
        if "reminder_times" in update_dict:
            now_utc = datetime.now(timezone.utc)
            db.query(ReminderEvent).filter(
                ReminderEvent.schedule_id == schedule.id,
                ReminderEvent.scheduled_datetime >= now_utc,
                ReminderEvent.status.in_([ReminderStatus.SCHEDULED, ReminderStatus.PROCESSING])
            ).delete(synchronize_session=False)
            db.commit()
        generate_reminders_for_schedule(db, schedule.id, days_ahead=2)

    return schedule


@router.post("/{id}/pause", response_model=ScheduleOut)
def pause_schedule(
    id: str,
    payload: PauseScheduleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Temporarily pause a medication reminder schedule."""
    schedule = db.query(MedicineSchedule).filter(MedicineSchedule.id == id).first()
    if not schedule:
        raise NotFoundException(detail=f"Schedule '{id}' not found")

    schedule.is_active = False
    schedule.pause_reason = payload.pause_reason or "Paused by user"
    db.commit()
    db.refresh(schedule)
    return schedule


@router.post("/{id}/resume", response_model=ScheduleOut)
def resume_schedule(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Resume a previously paused schedule and re-generate reminder events."""
    schedule = db.query(MedicineSchedule).filter(MedicineSchedule.id == id).first()
    if not schedule:
        raise NotFoundException(detail=f"Schedule '{id}' not found")

    schedule.is_active = True
    schedule.pause_reason = None
    db.commit()
    db.refresh(schedule)

    generate_reminders_for_schedule(db, schedule.id, days_ahead=2)
    return schedule


@router.get("/upcoming", response_model=List[ScheduleOut])
def list_active_schedules(
    patient_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List active reminder schedules."""
    target_patient_id = current_user.id
    if patient_id and current_user.role in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        target_patient_id = patient_id

    schedules = db.query(MedicineSchedule).filter(
        MedicineSchedule.patient_id == target_patient_id,
        MedicineSchedule.is_active == True
    ).all()
    return schedules
