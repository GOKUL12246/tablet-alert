from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AdherenceStatsResponse(BaseModel):
    patient_id: str
    patient_name: Optional[str] = None
    total_scheduled: int
    total_confirmed: int
    total_missed: int
    adherence_rate: float  # Percentage 0-100
    period_start: Optional[date] = None
    period_end: Optional[date] = None


class DeliveryStatsResponse(BaseModel):
    total_attempted: int
    total_delivered: int
    total_failed: int
    delivery_rate: float  # Percentage
    by_channel: Dict[str, int] = Field(default_factory=dict)


class ReminderStatsResponse(BaseModel):
    patient_id: Optional[str] = None
    total_reminders: int
    confirmed: int
    missed: int
    pending: int
    cancelled: int
    escalated_to_caregiver: int
    adherence_rate: float


class ProblemStatementMetricsResponse(BaseModel):
    literacy_support_interactions: int = Field(default=0, description="Usage count of voice, pictogram, and easy-mode features")
    sms_keypad_confirmations: int = Field(default=0, description="Confirmations received via numeric SMS (keypad phones)")
    disability_accommodation_usage: Dict[str, int] = Field(default_factory=dict, description="Active user count broken down by disability type")
    escalation_to_family_count: int = Field(default=0, description="Total times family/caregivers were alerted for missed doses")
    avg_response_time_after_escalation: float = Field(default=0.0, description="Average minutes taken by family/patient to respond after escalation")


class AdherenceSummaryResponse(BaseModel):
    adherence_rate: float
    total_doses: int
    taken_doses: int
    missed_doses: int
    streak_days: int
    daily_breakdown: List[Dict[str, Any]] = Field(default_factory=list)
    problem_statement_metrics: Optional[ProblemStatementMetricsResponse] = None


class SystemSettingBase(BaseModel):
    key: str
    value: Any
    description: Optional[str] = None


class SystemSettingUpdate(BaseModel):
    value: Any
    description: Optional[str] = None


class SystemSettingOut(SystemSettingBase):
    id: str
    updated_by: Optional[str] = None
    updated_at: datetime

    class Config:
        from_attributes = True


class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SystemHealthResponse(BaseModel):
    status: str
    database: str
    scheduler_running: bool
    version: str
    active_providers: Dict[str, str]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
