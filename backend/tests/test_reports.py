from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.medicine import Medicine
from app.models.reminder import (
    ConfirmationMethod,
    ConfirmationType,
    DoseConfirmation,
    ReminderEvent,
    ReminderStatus,
)
from app.services.report_service import get_problem_statement_metrics, get_reminder_stats


def test_adherence_and_problem_statement_metrics(
    client: TestClient,
    db_session: Session,
    test_patient,
    patient_token: str
):
    headers = {"Authorization": f"Bearer {patient_token}"}

    med = Medicine(patient_id=test_patient.id, name="Aspirin", strength="75 mg", is_active=True)
    db_session.add(med)
    db_session.commit()

    # Create 1 confirmed and 1 missed reminder
    rem1 = ReminderEvent(
        medicine_id=med.id,
        patient_id=test_patient.id,
        scheduled_datetime=datetime.now(timezone.utc),
        status=ReminderStatus.PATIENT_REPORTED_TAKEN,
        confirmed_at=datetime.now(timezone.utc),
        confirmation_method=ConfirmationMethod.SMS
    )
    db_session.add(rem1)
    db_session.flush()

    conf = DoseConfirmation(
        reminder_id=rem1.id,
        patient_id=test_patient.id,
        confirmation_type=ConfirmationType.SMS_REPLY,
        confirmed_at=datetime.now(timezone.utc),
    )
    db_session.add(conf)

    rem2 = ReminderEvent(
        medicine_id=med.id,
        patient_id=test_patient.id,
        scheduled_datetime=datetime.now(timezone.utc),
        status=ReminderStatus.CONFIRMATION_NOT_RECEIVED,
    )
    db_session.add(rem2)
    db_session.commit()

    # 1. Test adherence endpoint
    res = client.get("/api/v1/reports/adherence", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total_confirmed"] >= 1
    assert data["total_missed"] >= 1
    assert 0.0 <= data["adherence_rate"] <= 100.0

    # 2. Test summary report with problem statement metrics
    res_summary = client.get("/api/v1/reports/summary", headers=headers)
    assert res_summary.status_code == 200
    summary_data = res_summary.json()
    assert "problem_statement_metrics" in summary_data
    assert summary_data["problem_statement_metrics"]["sms_keypad_confirmations"] >= 1

    # 3. Test CSV export endpoint
    res_csv = client.get("/api/v1/reports/export/csv", headers=headers)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers["content-type"]
    assert "Reminder ID" in res_csv.text
