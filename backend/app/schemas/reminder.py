from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from app.models.reminder import (
    ReminderStatus,
    ConfirmationMethod,
    ConfirmationType,
    AlertType,
    AlertStatus,
)


class DoseConfirmationOut(BaseModel):
    id: str
    reminder_id: str
    patient_id: str
    confirmation_type: ConfirmationType
    confirmed_at: datetime
    notes: Optional[str] = None
    is_self_reported: bool

    class Config:
        from_attributes = True


class ReminderOut(BaseModel):
    id: str
    schedule_id: Optional[str] = None
    medicine_id: str
    medicine_name: Optional[str] = None
    medicine_strength: Optional[str] = None
    patient_id: str
    patient_name: Optional[str] = None
    scheduled_datetime: datetime
    scheduled_time_local: Optional[str] = None
    color: Optional[str] = None
    shape: Optional[str] = None
    food_instructions: Optional[str] = None
    status: ReminderStatus
    notification_channels: List[str]
    sent_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    acknowledged_at: Optional[datetime] = None
    confirmed_at: Optional[datetime] = None
    confirmation_method: Optional[ConfirmationMethod] = None
    missed_dose_guidance_shown: bool
    escalation_level: int
    next_escalation_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReminderConfirmRequest(BaseModel):
    method: ConfirmationMethod = ConfirmationMethod.APP
    notes: Optional[str] = None
    confirmed_at: Optional[datetime] = None


class ReminderMissedRequest(BaseModel):
    reason: Optional[str] = None


class AssistanceRequestCreate(BaseModel):
    reminder_id: Optional[str] = None
    request_type: str = Field(default="help", description="help | side_effect | clarification | emergency")


class AssistanceRequestOut(BaseModel):
    id: str
    patient_id: str
    reminder_id: Optional[str] = None
    request_type: str
    status: str
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CaregiverAlertOut(BaseModel):
    id: str
    reminder_id: Optional[str] = None
    patient_id: str
    patient_name: Optional[str] = None
    caregiver_id: str
    alert_type: AlertType
    message_en: str
    message_ta: str
    status: AlertStatus
    created_at: datetime
    acknowledged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class CaregiverAlertResolveRequest(BaseModel):
    notes: Optional[str] = None
