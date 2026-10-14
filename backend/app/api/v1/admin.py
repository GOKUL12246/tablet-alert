from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_admin, get_db
from app.config import settings
from app.core.exceptions import NotFoundException
from app.models.audit import AuditLog, SystemSettings
from app.models.user import User, UserRole
from app.schemas.report import (
    AuditLogOut,
    SystemHealthResponse,
    SystemSettingOut,
    SystemSettingUpdate,
)
from app.schemas.user import UserOut
from app.core.scheduler import scheduler

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(get_current_admin)])


class UpdateRoleRequest(BaseModel):
    role: UserRole


class CreateOrUpdateSettingRequest(BaseModel):
    key: str
    value: Any
    description: Optional[str] = None


@router.get("/users", response_model=List[UserOut])
def list_all_users(
    role: Optional[UserRole] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
) -> Any:
    """Administrator view to list all registered users."""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    return query.order_by(User.created_at.desc()).limit(limit).all()


@router.put("/users/{id}/role", response_model=UserOut)
def update_user_role(
    id: str,
    payload: UpdateRoleRequest,
    db: Session = Depends(get_db)
) -> Any:
    """Change user role (e.g., promote to healthcare_professional or admin)."""
    user = db.query(User).filter(User.id == id).first()
    if not user:
        raise NotFoundException(detail=f"User '{id}' not found")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.get("/system-settings", response_model=List[SystemSettingOut])
def get_system_settings(db: Session = Depends(get_db)) -> Any:
    """List system-wide application settings."""
    return db.query(SystemSettings).all()


@router.put("/system-settings", response_model=SystemSettingOut)
def update_system_setting(
    payload: CreateOrUpdateSettingRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
) -> Any:
    """Update or insert a system setting key/value."""
    setting = db.query(SystemSettings).filter(SystemSettings.key == payload.key).first()
    if not setting:
        setting = SystemSettings(
            key=payload.key,
            value=payload.value,
            description=payload.description,
            updated_by=current_admin.id
        )
        db.add(setting)
    else:
        setting.value = payload.value
        if payload.description:
            setting.description = payload.description
        setting.updated_by = current_admin.id
        setting.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(setting)
    return setting


@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    limit: int = Query(100, ge=1, le=500),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve system security and change audit logs."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()


@router.get("/system-health", response_model=SystemHealthResponse)
def get_system_health(db: Session = Depends(get_db)) -> Any:
    """Retrieve operational status, database health, scheduler state, and active providers."""
    # Check DB
    db_status = "connected"
    try:
        db.execute(db.query(User).limit(1).statement)
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "database": db_status,
        "scheduler_running": scheduler.running,
        "version": "1.0.0",
        "active_providers": {
            "sms": settings.SMS_PROVIDER,
            "ocr": settings.OCR_PROVIDER,
            "email": settings.EMAIL_PROVIDER,
            "demo_mode": str(settings.DEMO_MODE)
        },
        "timestamp": datetime.now(timezone.utc)
    }
