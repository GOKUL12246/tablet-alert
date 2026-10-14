from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundException
from app.models.notification import DeliveryChannel, NotificationDelivery, RecipientType
from app.models.user import User, UserRole
from app.schemas.notification import (
    NotificationDeliveryOut,
    NotificationStatusResponse,
    NotificationTestRequest,
)
from app.services.notification_service import send_custom_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.post("/test", response_model=NotificationDeliveryOut, status_code=status.HTTP_201_CREATED)
def send_test_notification(
    payload: NotificationTestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Send test notification (SMS/App) in Demo or Live mode."""
    target_user_id = payload.recipient_id or current_user.id
    target_phone = payload.phone_number or current_user.phone_number

    delivery = send_custom_notification(
        db=db,
        recipient_id=target_user_id,
        channel=payload.channel,
        message=payload.message,
        phone_number=target_phone,
        recipient_type=RecipientType.PATIENT,
    )
    return delivery


@router.get("/history", response_model=List[NotificationDeliveryOut])
def get_notification_history(
    recipient_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve audit trail of notification deliveries."""
    target_id = current_user.id
    if recipient_id and current_user.role in [UserRole.ADMIN, UserRole.CAREGIVER, UserRole.HEALTHCARE_PROFESSIONAL]:
        target_id = recipient_id

    query = db.query(NotificationDelivery)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(NotificationDelivery.recipient_id == target_id)

    deliveries = query.order_by(NotificationDelivery.created_at.desc()).limit(limit).all()
    return deliveries


@router.get("/{id}/status", response_model=NotificationStatusResponse)
def get_notification_status(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Check delivery status for a specific notification."""
    delivery = db.query(NotificationDelivery).filter(NotificationDelivery.id == id).first()
    if not delivery:
        raise NotFoundException(detail=f"Notification '{id}' not found")
    return delivery
