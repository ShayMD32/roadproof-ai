from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "Server Running",
        "version": "1.0"
    }


def test_create_vehicle():
    response = client.post(
        "/vehicle",
        json={
            "registration": "AB12 CDE",
            "make": "BMW",
            "model": "M3",
            "year": 2023
        }
    )

    assert response.status_code == 200
    assert response.json()["vehicle"]["registration"] == "AB12 CDE"
    assert response.json()["vehicle"]["make"] == "BMW"


def test_duplicate_vehicle():
    vehicle_data = {
        "registration": "XY12 ABC",
        "make": "Audi",
        "model": "RS3",
        "year": 2024
    }

    client.post("/vehicle", json=vehicle_data)
    response = client.post("/vehicle", json=vehicle_data)

    assert response.status_code == 409
    assert response.json()["detail"] == "Vehicle already exists"


def test_get_vehicle():
    vehicle_data = {
        "registration": "ZZ99 XYZ",
        "make": "Mercedes",
        "model": "A35",
        "year": 2024
    }

    client.post("/vehicle", json=vehicle_data)

    response = client.get("/vehicles/zz99xyz")

    assert response.status_code == 200
    assert response.json()["registration"] == "ZZ99 XYZ"
    assert response.json()["make"] == "Mercedes"


def test_update_vehicle():
    vehicle_data = {
        "registration": "YY22 CAR",
        "make": "BMW",
        "model": "M3",
        "year": 2022
    }

    client.post("/vehicle", json=vehicle_data)

    updated_data = {
        "registration": "YY22 CAR",
        "make": "BMW",
        "model": "M3 Competition",
        "year": 2024
    }

    response = client.put(
        "/vehicles/yy22car",
        json=updated_data
    )

    assert response.status_code == 200
    assert response.json()["vehicle"]["model"] == "M3 Competition"
    assert response.json()["vehicle"]["year"] == 2024


def test_delete_vehicle():
    vehicle_data = {
        "registration": "DL55 CAR",
        "make": "Ford",
        "model": "Focus",
        "year": 2021
    }

    client.post("/vehicle", json=vehicle_data)

    response = client.delete("/vehicles/dl55car")

    assert response.status_code == 200
    assert response.json()["message"] == "Vehicle deleted successfully!"

    get_response = client.get("/vehicles/dl55car")

    assert get_response.status_code == 404
    assert get_response.json()["detail"] == "Vehicle not found"