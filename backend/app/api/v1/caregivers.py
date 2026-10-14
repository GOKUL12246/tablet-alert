from datetime import datetime, timezone
from typing import Any, List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import BadRequestException, ForbiddenException, NotFoundException
from app.models.caregiver import CaregiverRelationship, ConsentStatus
from app.models.reminder import AlertStatus, CaregiverAlert
from app.models.user import User, UserRole
from app.schemas.caregiver import (
    CaregiverApprovalRequest,
    CaregiverPatientOut,
    CaregiverRelationshipOut,
    CaregiverRequestCreate,
)
from app.schemas.reminder import CaregiverAlertOut, CaregiverAlertResolveRequest
from app.services.auth_service import get_user_by_email, get_user_by_phone
from app.services.escalation_service import resolve_alert
from app.services.report_service import get_adherence_rate

router = APIRouter(prefix="/caregivers", tags=["Caregivers"])


@router.post("/request", response_model=CaregiverRelationshipOut, status_code=status.HTTP_201_CREATED)
def request_caregiver_link(
    payload: CaregiverRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Caregiver or family member initiates a link request to assist a patient."""
    target_patient: User = None
    if payload.patient_id:
        target_patient = db.query(User).filter(User.id == payload.patient_id).first()
    elif payload.patient_email:
        target_patient = get_user_by_email(db, payload.patient_email)
    elif payload.patient_phone:
        target_patient = get_user_by_phone(db, payload.patient_phone)

    if not target_patient:
        raise NotFoundException(detail="Target patient could not be located by email, phone, or ID.")

    # Check existing relationship
    existing = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.patient_id == target_patient.id,
        CaregiverRelationship.caregiver_id == current_user.id
    ).first()

    if existing:
        return CaregiverRelationshipOut(
            id=existing.id,
            patient_id=existing.patient_id,
            patient_name=target_patient.full_name,
            caregiver_id=existing.caregiver_id,
            caregiver_name=current_user.full_name,
            relationship_type=existing.relationship_type,
            relation_label=existing.relation_label or "family member",
            consent_status=existing.consent_status,
            consent_granted_at=existing.consent_granted_at,
            consent_revoked_at=existing.consent_revoked_at,
            is_primary=existing.is_primary,
            can_view_medicines=existing.can_view_medicines,
            can_view_schedule=existing.can_view_schedule,
            can_view_adherence=existing.can_view_adherence,
            escalation_order=existing.escalation_order,
            contact_method=existing.contact_method,
            created_at=existing.created_at,
        )

    relationship = CaregiverRelationship(
        patient_id=target_patient.id,
        caregiver_id=current_user.id,
        relationship_type=payload.relationship_type,
        relation_label=payload.relation_label or "family member",
        consent_status=ConsentStatus.PENDING,
        contact_method=payload.contact_method,
        can_view_medicines=payload.can_view_medicines,
        can_view_schedule=payload.can_view_schedule,
        can_view_adherence=payload.can_view_adherence,
    )
    db.add(relationship)
    db.commit()
    db.refresh(relationship)

    return CaregiverRelationshipOut(
        id=relationship.id,
        patient_id=relationship.patient_id,
        patient_name=target_patient.full_name,
        caregiver_id=relationship.caregiver_id,
        caregiver_name=current_user.full_name,
        relationship_type=relationship.relationship_type,
        relation_label=relationship.relation_label or "family member",
        consent_status=relationship.consent_status,
        consent_granted_at=relationship.consent_granted_at,
        consent_revoked_at=relationship.consent_revoked_at,
        is_primary=relationship.is_primary,
        can_view_medicines=relationship.can_view_medicines,
        can_view_schedule=relationship.can_view_schedule,
        can_view_adherence=relationship.can_view_adherence,
        escalation_order=relationship.escalation_order,
        contact_method=relationship.contact_method,
        created_at=relationship.created_at,
    )


@router.post("/{relationship_id}/approve", response_model=CaregiverRelationshipOut)
def approve_caregiver_relationship(
    relationship_id: str,
    payload: Optional[CaregiverApprovalRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Patient approves a caregiver's access request."""
    rel = db.query(CaregiverRelationship).filter(CaregiverRelationship.id == relationship_id).first()
    if not rel:
        raise NotFoundException(detail=f"Relationship '{relationship_id}' not found")

    if rel.patient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise ForbiddenException(detail="Only the patient can approve this relationship request")

    rel.consent_status = ConsentStatus.APPROVED
    rel.consent_granted_at = datetime.now(timezone.utc)
    rel.consent_revoked_at = None

    if payload:
        if payload.is_primary is not None:
            rel.is_primary = payload.is_primary
        if payload.can_view_medicines is not None:
            rel.can_view_medicines = payload.can_view_medicines
        if payload.can_view_schedule is not None:
            rel.can_view_schedule = payload.can_view_schedule
        if payload.can_view_adherence is not None:
            rel.can_view_adherence = payload.can_view_adherence
        if payload.escalation_order is not None:
            rel.escalation_order = payload.escalation_order
        if payload.relation_label is not None:
            rel.relation_label = payload.relation_label

    db.commit()
    db.refresh(rel)

    cg_user = db.query(User).filter(User.id == rel.caregiver_id).first()
    return CaregiverRelationshipOut(
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


@router.post("/{relationship_id}/revoke", response_model=CaregiverRelationshipOut)
def revoke_caregiver_relationship(
    relationship_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Patient revokes an existing caregiver authorization."""
    rel = db.query(CaregiverRelationship).filter(CaregiverRelationship.id == relationship_id).first()
    if not rel:
        raise NotFoundException(detail=f"Relationship '{relationship_id}' not found")

    if rel.patient_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise ForbiddenException(detail="Only the patient can revoke this relationship")

    rel.consent_status = ConsentStatus.REVOKED
    rel.consent_revoked_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(rel)

    cg_user = db.query(User).filter(User.id == rel.caregiver_id).first()
    return CaregiverRelationshipOut(
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


@router.get("/patients", response_model=List[CaregiverPatientOut])
def get_caregiver_patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve all patients linked to the authenticated caregiver."""
    relationships = db.query(CaregiverRelationship).filter(
        CaregiverRelationship.caregiver_id == current_user.id,
        CaregiverRelationship.consent_status == ConsentStatus.APPROVED
    ).all()

    result = []
    for rel in relationships:
        pat = db.query(User).filter(User.id == rel.patient_id).first()
        if not pat:
            continue

        adh_rate = get_adherence_rate(db, pat.id) if rel.can_view_adherence else None
        open_alerts = db.query(CaregiverAlert).filter(
            CaregiverAlert.caregiver_id == current_user.id,
            CaregiverAlert.patient_id == pat.id,
            CaregiverAlert.status.in_([AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED])
        ).count()

        result.append(CaregiverPatientOut(
            patient_id=pat.id,
            patient_name=pat.full_name,
            patient_email=pat.email,
            patient_phone=pat.phone_number,
            relationship_type=rel.relationship_type,
            relation_label=rel.relation_label or "family member",
            is_primary=rel.is_primary,
            can_view_medicines=rel.can_view_medicines,
            can_view_schedule=rel.can_view_schedule,
            can_view_adherence=rel.can_view_adherence,
            adherence_rate=adh_rate,
            open_alerts_count=open_alerts,
        ))

    return result


@router.get("/alerts", response_model=List[CaregiverAlertOut])
def get_caregiver_alerts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve all open or active alerts assigned to the current caregiver."""
    alerts = db.query(CaregiverAlert).filter(
        CaregiverAlert.caregiver_id == current_user.id,
        CaregiverAlert.status.in_([AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED])
    ).order_by(CaregiverAlert.created_at.desc()).all()

    out_list = []
    for a in alerts:
        pat = db.query(User).filter(User.id == a.patient_id).first()
        out_list.append(CaregiverAlertOut(
            id=a.id,
            reminder_id=a.reminder_id,
            patient_id=a.patient_id,
            patient_name=pat.full_name if pat else "Patient",
            caregiver_id=a.caregiver_id,
            alert_type=a.alert_type,
            message_en=a.message_en,
            message_ta=a.message_ta,
            status=a.status,
            created_at=a.created_at,
            acknowledged_at=a.acknowledged_at,
            resolved_at=a.resolved_at,
            notes=a.notes,
        ))
    return out_list


@router.post("/alerts/{id}/acknowledge", response_model=CaregiverAlertOut)
def acknowledge_alert(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Caregiver acknowledges seeing an alert."""
    alert = db.query(CaregiverAlert).filter(CaregiverAlert.id == id).first()
    if not alert:
        raise NotFoundException(detail=f"Alert '{id}' not found")
    if alert.caregiver_id != current_user.id:
        raise ForbiddenException(detail="You cannot acknowledge an alert assigned to another caregiver")

    alert.status = AlertStatus.ACKNOWLEDGED
    alert.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(alert)

    pat = db.query(User).filter(User.id == alert.patient_id).first()
    return CaregiverAlertOut(
        id=alert.id,
        reminder_id=alert.reminder_id,
        patient_id=alert.patient_id,
        patient_name=pat.full_name if pat else "Patient",
        caregiver_id=alert.caregiver_id,
        alert_type=alert.alert_type,
        message_en=alert.message_en,
        message_ta=alert.message_ta,
        status=alert.status,
        created_at=alert.created_at,
        acknowledged_at=alert.acknowledged_at,
        resolved_at=alert.resolved_at,
        notes=alert.notes,
    )


@router.post("/alerts/{id}/resolve", response_model=CaregiverAlertOut)
def resolve_caregiver_alert_endpoint(
    id: str,
    payload: Optional[CaregiverAlertResolveRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Mark a caregiver alert as fully resolved."""
    notes = payload.notes if payload else None
    alert = resolve_alert(db, id, current_user.id, notes=notes)
    pat = db.query(User).filter(User.id == alert.patient_id).first()

    return CaregiverAlertOut(
        id=alert.id,
        reminder_id=alert.reminder_id,
        patient_id=alert.patient_id,
        patient_name=pat.full_name if pat else "Patient",
        caregiver_id=alert.caregiver_id,
        alert_type=alert.alert_type,
        message_en=alert.message_en,
        message_ta=alert.message_ta,
        status=alert.status,
        created_at=alert.created_at,
        acknowledged_at=alert.acknowledged_at,
        resolved_at=alert.resolved_at,
        notes=alert.notes,
    )
