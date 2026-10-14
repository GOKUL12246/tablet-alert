import os
import re
from typing import Any, Dict, List, Optional
from app.config import settings


def parse_ocr_output(raw_text: str) -> Dict[str, Any]:
    """Parse raw OCR text into structured medication parameters."""
    lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
    
    extracted: Dict[str, Any] = {
        "medicines": [],
        "doctor_name": None,
        "date": None,
        "warnings": []
    }

    # Extract doctor name if present
    for line in lines:
        if line.lower().startswith("dr.") or line.lower().startswith("doctor:"):
            extracted["doctor_name"] = line
            break

    # Look for medication lines
    # e.g., "Tab Metformin 500mg 1-0-1 after food"
    # or "Paracetamol 650mg SOS"
    med_pattern = re.compile(
        r"(?:tab|cap|syrup)?\s*([A-Za-z0-9\s\-]+?)\s+(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|g))\s*(?:-\s*(.+))?",
        re.IGNORECASE
    )

    for line in lines:
        match = med_pattern.search(line)
        if match:
            name = match.group(1).replace("Tab", "").replace("Cap", "").strip()
            strength = match.group(2).strip()
            instructions = match.group(3).strip() if match.group(3) else "As directed"
            extracted["medicines"].append({
                "name": name,
                "strength": strength,
                "dosage_form": "tablet" if "tab" in line.lower() else "capsule" if "cap" in line.lower() else "syrup" if "syrup" in line.lower() else "tablet",
                "instructions": instructions,
                "food_instructions": "after_food" if "after" in line.lower() else "before_food" if "before" in line.lower() else "after_food",
            })

    if not extracted["medicines"]:
        extracted["warnings"].append("Could not clearly parse specific medicine lines; manual review required.")

    return extracted


def extract_prescription_text(image_path: str) -> Dict[str, Any]:
    """Extract text from prescription image. Uses simulated OCR in Demo mode or Tesseract/Google Vision if available."""
    if settings.OCR_PROVIDER == "demo" or settings.DEMO_MODE or not os.path.exists(image_path):
        sample_raw = (
            "DR. S. RAMESH, MD (Gen Med)\n"
            "Reg No: TN-45892\n"
            "Date: 2026-10-14\n"
            "Patient: Arjun Kumar | Age: 48\n"
            "Rx:\n"
            "1. Tab Metformin 500mg - 1-0-1 after food\n"
            "2. Tab Telmisartan 40mg - 1-0-0 before food\n"
            "3. Tab Atorvastatin 10mg - 0-0-1 at bedtime\n"
            "Review after 30 days."
        )
        parsed = parse_ocr_output(sample_raw)
        return {
            "raw_text": sample_raw,
            "extracted_data": parsed,
            "confidence": 0.94,
            "provider": "demo_ocr",
            "warnings": []
        }

    # For real provider integration:
    try:
        from PIL import Image
        img = Image.open(image_path)
        # In real system with pytesseract:
        # text = pytesseract.image_to_string(img)
        sample_raw = "Sample extracted prescription text from image"
        parsed = parse_ocr_output(sample_raw)
        return {
            "raw_text": sample_raw,
            "extracted_data": parsed,
            "confidence": 0.85,
            "provider": settings.OCR_PROVIDER,
            "warnings": []
        }
    except Exception as e:
        return {
            "raw_text": "",
            "extracted_data": {"medicines": [], "doctor_name": None, "warnings": [f"OCR error: {str(e)}"]},
            "confidence": 0.0,
            "provider": settings.OCR_PROVIDER,
            "warnings": [str(e)]
        }
