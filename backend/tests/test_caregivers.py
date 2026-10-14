from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.caregiver import CaregiverRelationship, ConsentStatus
from app.models.reminder import CaregiverAlert, AlertStatus, AlertType
from app.core.security import create_access_token


def test_caregiver_link_request_and_approval(
    client: TestClient,
    db_session: Session,
    test_patient,
    test_caregiver,
    caregiver_token: str,
    patient_token: str
):
    # 1. Caregiver initiates request
    cg_headers = {"Authorization": f"Bearer {caregiver_token}"}
    req_res = client.post(
        "/api/v1/caregivers/request",
        headers=cg_headers,
        json={
            "patient_id": test_patient.id,
            "relationship_type": "daughter",
            "relation_label": "daughter",
            "contact_method": "both"
        }
    )
    assert req_res.status_code == 201
    rel_id = req_res.json()["id"]
    assert req_res.json()["consent_status"] == "pending"

    # 2. Patient approves the request
    pat_headers = {"Authorization": f"Bearer {patient_token}"}
    approve_res = client.post(
        f"/api/v1/caregivers/{rel_id}/approve",
        headers=pat_headers,
        json={"is_primary": True, "relation_label": "daughter"}
    )
    assert approve_res.status_code == 200
    assert approve_res.json()["consent_status"] == "approved"
    assert approve_res.json()["is_primary"] is True


def test_caregiver_alert_lifecycle(
    client: TestClient,
    db_session: Session,
    test_patient,
    test_caregiver,
    caregiver_token: str
):
    # 1. Create an alert for caregiver
    alert = CaregiverAlert(
        patient_id=test_patient.id,
        caregiver_id=test_caregiver.id,
        alert_type=AlertType.MISSED_REMINDER,
        message_en="Your daughter Test Patient missed their medicine.",
        message_ta="மருந்து தவறவிடப்பட்டது",
        status=AlertStatus.OPEN
    )
    db_session.add(alert)
    db_session.commit()
    db_session.refresh(alert)

    cg_headers = {"Authorization": f"Bearer {caregiver_token}"}

    # 2. Caregiver retrieves alerts
    alerts_res = client.get("/api/v1/caregivers/alerts", headers=cg_headers)
    assert alerts_res.status_code == 200
    assert len(alerts_res.json()) >= 1

    # 3. Acknowledge alert
    ack_res = client.post(f"/api/v1/caregivers/alerts/{alert.id}/acknowledge", headers=cg_headers)
    assert ack_res.status_code == 200
    assert ack_res.json()["status"] == "acknowledged"

    # 4. Resolve alert
    resolve_res = client.post(
        f"/api/v1/caregivers/alerts/{alert.id}/resolve",
        headers=cg_headers,
        json={"notes": "Checked on patient, medicine now taken."}
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["status"] == "resolved"
