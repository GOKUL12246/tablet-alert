from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.notification import DeliveryChannel, DeliveryStatus, NotificationDelivery, RecipientType
from app.services.notification_service import record_delivery, retry_failed_notifications


def test_send_test_notification_demo(monkeypatch, client: TestClient, test_patient, patient_token: str):
    from app.config import settings
    monkeypatch.setattr(settings, "SMS_PROVIDER", "demo")

    headers = {"Authorization": f"Bearer {patient_token}"}
    response = client.post(
        "/api/v1/notifications/test",
        headers=headers,
        json={
            "recipient_id": test_patient.id,
            "channel": "sms",
            "message": "MEDISAKHI Test: Time for your medicine.",
            "phone_number": "+919876543201"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] in ["delivered", "sent"]
    assert data["provider_name"] == "demo"
    assert "id" in data


def test_notification_delivery_recording_and_retry(monkeypatch, db_session: Session, test_patient):
    from app.config import settings
    monkeypatch.setattr(settings, "SMS_PROVIDER", "demo")

    # Record a failed delivery
    delivery = record_delivery(
        db_session,
        {
            "recipient_id": test_patient.id,
            "recipient_type": RecipientType.PATIENT,
            "channel": DeliveryChannel.SMS,
            "status": DeliveryStatus.FAILED,
            "error_message": "Network timeout",
            "attempt_number": 1,
            "idempotency_key": "test-fail-key-1"
        }
    )
    assert delivery.status == DeliveryStatus.FAILED

    # Run retry logic
    retry_failed_notifications(db_session)
    db_session.refresh(delivery)

    # In demo mode, retry will succeed
    assert delivery.attempt_number == 2
    assert delivery.status == DeliveryStatus.DELIVERED
