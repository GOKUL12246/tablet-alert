import os
import shutil
import uuid
from datetime import datetime, timezone
from typing import Any, List, Optional
import aiofiles
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.medicine import Prescription, PrescriptionVerificationStatus
from app.models.user import User, UserRole
from app.schemas.medicine import (
    PrescriptionExtractResponse,
    PrescriptionOut,
    PrescriptionVerifyRequest,
)
from app.services.ocr_service import extract_prescription_text

router = APIRouter(prefix="/prescriptions", tags=["Prescriptions"])

UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=PrescriptionOut, status_code=status.HTTP_201_CREATED)
async def upload_prescription(
    file: UploadFile = File(...),
    patient_id: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Upload prescription image/document and run automatic OCR extraction."""
    target_patient_id = current_user.id
    if patient_id and current_user.role in [UserRole.CAREGIVER, UserRole.ADMIN, UserRole.HEALTHCARE_PROFESSIONAL]:
        target_patient_id = patient_id

    file_ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    unique_filename = f"rx_{uuid.uuid4().hex[:12]}{file_ext}"
    dest_path = os.path.join(UPLOAD_DIR, unique_filename)

    async with aiofiles.open(dest_path, "wb") as out_file:
        content = await file.read()
        await out_file.write(content)

    # Perform OCR Extraction
    ocr_result = extract_prescription_text(dest_path)

    prescription = Prescription(
        patient_id=target_patient_id,
        file_path=dest_path,
        file_type=file.content_type or "image/jpeg",
        ocr_raw_text=ocr_result.get("raw_text"),
        ocr_extracted_data=ocr_result.get("extracted_data", {}),
        ocr_confidence=ocr_result.get("confidence", 0.0),
        verification_status=PrescriptionVerificationStatus.OCR_EXTRACTED,
    )
    db.add(prescription)
    db.commit()
    db.refresh(prescription)
    return prescription


@router.get("/{id}/extract", response_model=PrescriptionExtractResponse)
def get_ocr_extraction(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve raw OCR text and parsed medication details from prescription."""
    prescription = db.query(Prescription).filter(Prescription.id == id).first()
    if not prescription:
        raise NotFoundException(detail=f"Prescription '{id}' not found")

    return {
        "raw_text": prescription.ocr_raw_text or "",
        "extracted_data": prescription.ocr_extracted_data or {},
        "confidence": prescription.ocr_confidence,
        "warnings": [],
    }


@router.post("/{id}/verify", response_model=PrescriptionOut)
def verify_prescription(
    id: str,
    payload: PrescriptionVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Verify or reject prescription data by patient, caregiver, or healthcare professional."""
    prescription = db.query(Prescription).filter(Prescription.id == id).first()
    if not prescription:
        raise NotFoundException(detail=f"Prescription '{id}' not found")

    prescription.verification_status = payload.status
    prescription.verified_by = current_user.id
    prescription.verified_at = datetime.now(timezone.utc)
    if payload.verification_notes:
        prescription.verification_notes = payload.verification_notes

    db.commit()
    db.refresh(prescription)
    return prescription


@router.get("/{id}", response_model=PrescriptionOut)
def get_prescription(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve prescription details."""
    prescription = db.query(Prescription).filter(Prescription.id == id).first()
    if not prescription:
        raise NotFoundException(detail=f"Prescription '{id}' not found")
    return prescription
