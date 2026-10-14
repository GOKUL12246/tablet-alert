from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

from app.models.caregiver import ConsentStatus, ContactMethod


class CaregiverRequestCreate(BaseModel):
    patient_email: Optional[EmailStr] = None
    patient_phone: Optional[str] = None
    patient_id: Optional[str] = None
    relationship_type: str = Field(default="family", description="e.g. daughter, son, spouse, nurse")
    relation_label: str = Field(default="family member", description="e.g. son, daughter, spouse, caretaker, nurse")
    contact_method: ContactMethod = ContactMethod.BOTH
    can_view_medicines: bool = True
    can_view_schedule: bool = True
    can_view_adherence: bool = True


class CaregiverRelationshipOut(BaseModel):
    id: str
    patient_id: str
    patient_name: Optional[str] = None
    caregiver_id: str
    caregiver_name: Optional[str] = None
    relationship_type: Optional[str] = None
    relation_label: str = "family member"
    consent_status: ConsentStatus
    consent_granted_at: Optional[datetime] = None
    consent_revoked_at: Optional[datetime] = None
    is_primary: bool
    can_view_medicines: bool
    can_view_schedule: bool
    can_view_adherence: bool
    escalation_order: int
    contact_method: ContactMethod
    created_at: datetime

    class Config:
        from_attributes = True


class CaregiverApprovalRequest(BaseModel):
    is_primary: Optional[bool] = None
    can_view_medicines: Optional[bool] = None
    can_view_schedule: Optional[bool] = None
    can_view_adherence: Optional[bool] = None
    escalation_order: Optional[int] = None
    relation_label: Optional[str] = None


class CaregiverPatientOut(BaseModel):
    patient_id: str
    patient_name: str
    patient_email: str
    patient_phone: Optional[str] = None
    relationship_type: Optional[str] = None
    relation_label: str = "family member"
    is_primary: bool
    can_view_medicines: bool
    can_view_schedule: bool
    can_view_adherence: bool
    adherence_rate: Optional[float] = None
    open_alerts_count: int = 0
