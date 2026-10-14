from datetime import datetime
from typing import Any, List, Optional
from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole, UserLanguage, DisabilityType, PreferredAlertMode
from app.models.audit import AccessibilityMode


class UserProfileBase(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: List[str] = Field(default_factory=list)
    notes: Optional[str] = None

    # Disability and Accommodation Support
    disability_type: DisabilityType = DisabilityType.NONE
    preferred_alert_mode: PreferredAlertMode = PreferredAlertMode.SMS
    requires_large_display: bool = False
    caregiver_assisted_setup: bool = False


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[List[str]] = None
    notes: Optional[str] = None
    disability_type: Optional[DisabilityType] = None
    preferred_alert_mode: Optional[PreferredAlertMode] = None
    requires_large_display: Optional[bool] = None
    caregiver_assisted_setup: Optional[bool] = None


class UserProfileOut(UserProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: Optional[str] = None
    role: UserRole = UserRole.PATIENT
    language: UserLanguage = UserLanguage.EN


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    language: Optional[UserLanguage] = None
    is_active: Optional[bool] = None


class UserOut(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    profile: Optional[UserProfileOut] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class AccessibilityPreferencesBase(BaseModel):
    mode: AccessibilityMode = AccessibilityMode.STANDARD
    font_size_multiplier: float = 1.0
    high_contrast: bool = False
    reduced_motion: bool = False
    screen_reader_mode: bool = False
    tts_enabled: bool = False
    tts_language: str = "en"
    tts_rate: float = 1.0


class AccessibilityPreferencesUpdate(BaseModel):
    mode: Optional[AccessibilityMode] = None
    font_size_multiplier: Optional[float] = None
    high_contrast: Optional[bool] = None
    reduced_motion: Optional[bool] = None
    screen_reader_mode: Optional[bool] = None
    tts_enabled: Optional[bool] = None
    tts_language: Optional[str] = None
    tts_rate: Optional[float] = None


class AccessibilityPreferencesOut(AccessibilityPreferencesBase):
    id: str
    user_id: str
    updated_at: datetime

    class Config:
        from_attributes = True
