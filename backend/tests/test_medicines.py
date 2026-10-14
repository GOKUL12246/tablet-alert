from fastapi.testclient import TestClient
from app.services.medicine_service import validate_medicine_data
from app.schemas.medicine import MedicineCreate


def test_create_medicine(client: TestClient, patient_token: str):
    headers = {"Authorization": f"Bearer {patient_token}"}
    response = client.post(
        "/api/v1/medicines/",
        headers=headers,
        json={
            "name": "Paracetamol",
            "brand_name": "Dolo 650",
            "strength": "650 mg",
            "dosage_form": "tablet",
            "prescribed_quantity": "1 tablet",
            "tablet_color": "white",
            "tablet_shape": "round",
            "strip_cover_color": "green blister",
            "box_color": "green and white box",
            "icon_symbol": "sun",
            "pictogram_code": "sun-morning",
            "food_instructions": "after_food",
            "special_instructions": "Take after meals if fever persists."
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Paracetamol"
    assert data["tablet_color"] == "white"
    assert data["strength"] == "650 mg"
    assert "id" in data


def test_create_duplicate_medicine_rejected(client: TestClient, patient_token: str):
    headers = {"Authorization": f"Bearer {patient_token}"}
    payload = {
        "name": "Aspirin",
        "strength": "75 mg",
        "dosage_form": "tablet"
    }
    # First creation
    res1 = client.post("/api/v1/medicines/", headers=headers, json=payload)
    assert res1.status_code == 201

    # Second creation with identical name & strength
    res2 = client.post("/api/v1/medicines/", headers=headers, json=payload)
    assert res2.status_code == 409


def test_list_medicines(client: TestClient, patient_token: str):
    headers = {"Authorization": f"Bearer {patient_token}"}
    response = client.get("/api/v1/medicines/", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_update_medicine(client: TestClient, patient_token: str):
    headers = {"Authorization": f"Bearer {patient_token}"}
    # Create medicine first
    res = client.post(
        "/api/v1/medicines/",
        headers=headers,
        json={"name": "Cetirizine", "strength": "10 mg", "dosage_form": "tablet"}
    )
    assert res.status_code == 201
    med_id = res.json()["id"]

    # Update color & shape
    update_res = client.put(
        f"/api/v1/medicines/{med_id}",
        headers=headers,
        json={"tablet_color": "light blue", "tablet_shape": "oval"}
    )
    assert update_res.status_code == 200
    assert update_res.json()["tablet_color"] == "light blue"
    assert update_res.json()["tablet_shape"] == "oval"


def test_medicine_validation_warnings():
    # Test short name and missing dosage units
    schema = MedicineCreate(
        name="A",
        strength="500",  # missing unit like mg/ml
        food_instructions="on_water"  # unusual food instruction
    )
    warnings = validate_medicine_data(schema)
    assert len(warnings) >= 2
