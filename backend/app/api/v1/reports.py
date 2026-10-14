from datetime import date
from typing import Any, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User, UserRole
from app.schemas.report import (
    AdherenceStatsResponse,
    AdherenceSummaryResponse,
    DeliveryStatsResponse,
    ReminderStatsResponse,
)
from app.services.report_service import (
    export_csv,
    get_adherence_summary,
    get_delivery_stats,
    get_reminder_stats,
)

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/summary", response_model=AdherenceSummaryResponse)
def get_summary_report(
    patient_id: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Get 7-day adherence breakdown, streak, and problem statement metrics."""
    target_patient_id = current_user.id
    if patient_id and current_user.role in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        target_patient_id = patient_id

    summary = get_adherence_summary(db, target_patient_id)
    return summary


@router.get("/adherence", response_model=AdherenceStatsResponse)
def get_adherence_report(
    patient_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve medication adherence rate and statistics."""
    target_patient_id = current_user.id
    if patient_id and current_user.role in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        target_patient_id = patient_id

    stats = get_reminder_stats(db, target_patient_id, start_date=start_date, end_date=end_date)
    target_user = db.query(User).filter(User.id == target_patient_id).first()

    return AdherenceStatsResponse(
        patient_id=target_patient_id,
        patient_name=target_user.full_name if target_user else "Patient",
        total_scheduled=stats["total_reminders"],
        total_confirmed=stats["confirmed"],
        total_missed=stats["missed"],
        adherence_rate=stats["adherence_rate"],
        period_start=start_date,
        period_end=end_date,
    )


@router.get("/delivery", response_model=DeliveryStatsResponse)
def get_notification_delivery_report(
    patient_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve notification delivery success rates and channel statistics."""
    target_patient_id = current_user.id
    if patient_id and current_user.role in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        target_patient_id = patient_id
    elif current_user.role == UserRole.ADMIN and not patient_id:
        target_patient_id = None

    stats = get_delivery_stats(db, target_patient_id, start_date=start_date, end_date=end_date)
    return stats


@router.get("/export/csv")
def download_adherence_csv(
    patient_id: Optional[str] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Response:
    """Download reminder adherence logs as a CSV file."""
    target_patient_id = current_user.id
    if patient_id and current_user.role in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        target_patient_id = patient_id
    elif current_user.role == UserRole.ADMIN and not patient_id:
        target_patient_id = None

    csv_data = export_csv(db, target_patient_id, start_date=start_date, end_date=end_date)
    filename = f"medisakhi_report_{patient_id or 'all'}_{date.today().isoformat()}.csv"

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
