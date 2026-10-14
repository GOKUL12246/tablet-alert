from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class ScheduleBase(BaseModel):
    reminder_times: List[str] = Field(..., description="List of times in HH:MM 24-hour format, e.g. ['08:00', '20:00']")
    timezone: str = "Asia/Kolkata"
    days_of_week: Optional[List[int]] = Field(None, description="Days of week 0=Monday, 6=Sunday, null for daily")


class ScheduleCreate(ScheduleBase):
    medicine_id: str
    patient_id: Optional[str] = None


class ScheduleUpdate(BaseModel):
    reminder_times: Optional[List[str]] = None
    timezone: Optional[str] = None
    days_of_week: Optional[List[int]] = None
    is_active: Optional[bool] = None
    pause_reason: Optional[str] = None


class PauseScheduleRequest(BaseModel):
    pause_reason: Optional[str] = "User requested pause"


class ScheduleOut(ScheduleBase):
    id: str
    medicine_id: str
    patient_id: str
    is_active: bool
    pause_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
