from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.medicine import Medicine
from app.models.schedule import MedicineSchedule
from app.models.reminder import ReminderEvent, ReminderStatus
from app.services.reminder_service import generate_reminders_for_schedule


def test_generate_and_confirm_reminder(client: TestClient, db_session: Session, test_patient, patient_token: str):
    headers = {"Authorization": f"Bearer {patient_token}"}

    # 1. Create a medicine
    med = Medicine(
        patient_id=test_patient.id,
        name="Amoxicillin",
        strength="500 mg",
        dosage_form="capsule",
        is_active=True
    )
    db_session.add(med)
    db_session.commit()
    db_session.refresh(med)

    # 2. Create a schedule
    sched = MedicineSchedule(
        medicine_id=med.id,
        patient_id=test_patient.id,
        reminder_times=["08:00", "20:00"],
        timezone="Asia/Kolkata",
        is_active=True
    )
    db_session.add(sched)
    db_session.commit()
    db_session.refresh(sched)

    # 3. Generate reminders
    reminders = generate_reminders_for_schedule(db_session, sched.id, days_ahead=1)
    assert len(reminders) >= 1
    rem_id = reminders[0].id

    # 4. Confirm reminder via API
    res1 = client.post(
        f"/api/v1/reminders/{rem_id}/confirm",
        headers=headers,
        json={"method": "app", "notes": "Taken with water"}
    )
    assert res1.status_code == 200
    conf_data = res1.json()
    assert conf_data["reminder_id"] == rem_id

    # 5. Test idempotency: confirming again returns same confirmation
    res2 = client.post(
        f"/api/v1/reminders/{rem_id}/confirm",
        headers=headers,
        json={"method": "app", "notes": "Duplicate click"}
    )
    assert res2.status_code == 200
    assert res2.json()["id"] == conf_data["id"]


def test_mark_reminder_missed(client: TestClient, db_session: Session, test_patient, patient_token: str):
    headers = {"Authorization": f"Bearer {patient_token}"}

    med = Medicine(patient_id=test_patient.id, name="Ibuprofen", strength="400 mg", is_active=True)
    db_session.add(med)
    db_session.commit()

    rem = ReminderEvent(
        medicine_id=med.id,
        patient_id=test_patient.id,
        scheduled_datetime=datetime.now(timezone.utc),
        status=ReminderStatus.SCHEDULED,
    )
    db_session.add(rem)
    db_session.commit()
    db_session.refresh(rem)

    res = client.post(
        f"/api/v1/reminders/{rem.id}/missed",
        headers=headers,
        json={"reason": "Forgot dose"}
    )
    assert res.status_code == 200
    assert res.json()["status"] == "confirmation_not_received"
    assert res.json()["missed_dose_guidance_shown"] is True


def test_tablet_stock_reduction_and_refill(client: TestClient, db_session: Session, test_patient, patient_token: str):
    headers = {"Authorization": f"Bearer {patient_token}"}

    # 1. Create medicine with 11 tablets
    med = Medicine(
        patient_id=test_patient.id,
        name="Metformin Stock Test",
        strength="500 mg",
        dosage_form="tablet",
        is_active=True,
        total_tablets=30,
        remaining_tablets=11,
        low_stock_threshold=10,
    )
    db_session.add(med)
    db_session.commit()
    db_session.refresh(med)

    # 2. Create reminder event
    rem = ReminderEvent(
        medicine_id=med.id,
        patient_id=test_patient.id,
        scheduled_datetime=datetime.now(timezone.utc),
        status=ReminderStatus.SCHEDULED,
    )
    db_session.add(rem)
    db_session.commit()
    db_session.refresh(rem)

    # 3. Confirm reminder -> stock should reduce to 10 and trigger low stock alert
    res = client.post(
        f"/api/v1/reminders/{rem.id}/confirm",
        headers=headers,
        json={"method": "app"}
    )
    assert res.status_code == 200

    db_session.refresh(med)
    assert med.remaining_tablets == 10
    assert med.last_low_stock_alert_at is not None

    # 4. Refill stock via API
    refill_res = client.post(
        f"/api/v1/medicines/{med.id}/refill",
        headers=headers,
        json={"refill_quantity": 30}
    )
    assert refill_res.status_code == 200
    refill_data = refill_res.json()
    assert refill_data["remaining_tablets"] == 40
    assert refill_data["total_tablets"] == 60

