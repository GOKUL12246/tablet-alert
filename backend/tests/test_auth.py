from fastapi.testclient import TestClient
from app.models.user import User


def test_register_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "strongpassword123",
            "full_name": "New Registered User",
            "phone_number": "+919876543299",
            "role": "patient",
            "language": "en"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New Registered User"
    assert "id" in data


def test_register_duplicate_email(client: TestClient, test_patient: User):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": test_patient.email,
            "password": "somepassword123",
            "full_name": "Duplicate User",
            "role": "patient",
            "language": "en"
        }
    )
    assert response.status_code == 409


def test_login_success(client: TestClient, test_patient: User):
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_patient.email,
            "password": "password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_patient.email


def test_login_invalid_credentials(client: TestClient, test_patient: User):
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": test_patient.email,
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401


def test_get_current_user_me(client: TestClient, patient_token: str):
    headers = {"Authorization": f"Bearer {patient_token}"}
    response = client.get("/api/v1/auth/me", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test_patient@example.com"


def test_unauthorized_access_fails(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
