from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.medicine import Medicine
from app.models.reminder import DoseConfirmation, ReminderEvent, ReminderStatus
from app.services.sms_service import parse_sms_reply


def test_parse_sms_reply():
    assert parse_sms_reply("1") == "confirm"
    assert parse_sms_reply("YES") == "confirm"
    assert parse_sms_reply("taken") == "confirm"
    assert parse_sms_reply("ஆமாம்") == "confirm"

    assert parse_sms_reply("2") == "help"
    assert parse_sms_reply("HELP") == "help"
    assert parse_sms_reply("SOS") == "help"
    assert parse_sms_reply("உதவி") == "help"

    assert parse_sms_reply("hello friend") == "unknown"


def test_incoming_sms_webhook_confirms_dose(client: TestClient, db_session: Session, test_patient):
    med = Medicine(patient_id=test_patient.id, name="Metformin", strength="500 mg", is_active=True)
    db_session.add(med)
    db_session.commit()

    rem = ReminderEvent(
        medicine_id=med.id,
        patient_id=test_patient.id,
        scheduled_datetime=datetime.now(timezone.utc),
        status=ReminderStatus.SENT,
    )
    db_session.add(rem)
    db_session.commit()
    db_session.refresh(rem)

    headers = {"X-Webhook-Secret": "demo-secret-webhook-key"}

    # Patient replies "1" (keypad confirmation)
    response = client.post(
        "/api/v1/webhooks/sms/incoming",
        headers=headers,
        json={
            "from_number": test_patient.phone_number,
            "body": "1"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["action"] == "confirmed"

    # Verify reminder status updated in database
    db_session.refresh(rem)
    assert rem.status == ReminderStatus.PATIENT_REPORTED_TAKEN


def test_incoming_sms_webhook_duplicate_prevented(client: TestClient, db_session: Session, test_patient):
    headers = {"X-Webhook-Secret": "demo-secret-webhook-key"}

    # Send second confirmation for same patient
    response = client.post(
        "/api/v1/webhooks/sms/incoming",
        headers=headers,
        json={
            "from_number": test_patient.phone_number,
            "body": "1"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["action"] in ["already_confirmed_or_none", "duplicate_confirmation"]
