from typing import Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundException
from app.models.caregiver import CaregiverRelationship, ConsentStatus
from app.models.user import User, UserProfile
from app.models.audit import AccessibilityPreferences
from app.schemas.caregiver import CaregiverRelationshipOut
from app.schemas.user import (
    AccessibilityPreferencesOut,
    AccessibilityPreferencesUpdate,
    UserProfileOut,
    UserProfileUpdate,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.get("/profile", response_model=UserProfileOut)
def get_patient_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve profile and disability accommodations for the current user."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/profile", response_model=UserProfileOut)
def update_patient_profile(
    payload: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update profile details, disability accommodations, and emergency contact."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    update_dict = payload.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/accessibility", response_model=AccessibilityPreferencesOut)
def get_accessibility_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve UI accessibility preferences for the current user."""
    acc = db.query(AccessibilityPreferences).filter(AccessibilityPreferences.user_id == current_user.id).first()
    if not acc:
        acc = AccessibilityPreferences(user_id=current_user.id)
        db.add(acc)
        db.commit()
        db.refresh(acc)
    return acc


@router.put("/accessibility", response_model=AccessibilityPreferencesOut)
def update_accessibility_settings(
    payload: AccessibilityPreferencesUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Update accessibility settings (easy mode, high contrast, screen reader, TTS)."""
    acc = db.query(AccessibilityPreferences).filter(AccessibilityPreferences.user_id == current_user.id).first()
    if not acc:
        acc = AccessibilityPreferences(user_id=current_user.id)
        db.add(acc)

    update_dict = payload.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(acc, key, value)

    db.commit()
    db.refresh(acc)
    return acc


@router.get("/caregivers", response_model=List[CaregiverRelationshipOut])
def get_patient_caregivers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """List caregivers authorized to assist the current patient."""
    relationships = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.patient_id == current_user.id
    ).all()

    result = []
    for rel in relationships:
        cg_user = db.query(User).filter(User.id == rel.caregiver_id).first()
        out_item = CaregiverRelationshipOut(
            id=rel.id,
            patient_id=rel.patient_id,
            patient_name=current_user.full_name,
            caregiver_id=rel.caregiver_id,
            caregiver_name=cg_user.full_name if cg_user else None,
            relationship_type=rel.relationship_type,
            relation_label=rel.relation_label or "family member",
            consent_status=rel.consent_status,
            consent_granted_at=rel.consent_granted_at,
            consent_revoked_at=rel.consent_revoked_at,
            is_primary=rel.is_primary,
            can_view_medicines=rel.can_view_medicines,
            can_view_schedule=rel.can_view_schedule,
            can_view_adherence=rel.can_view_adherence,
            escalation_order=rel.escalation_order,
            contact_method=rel.contact_method,
            created_at=rel.created_at,
        )
        result.append(out_item)

    return result
