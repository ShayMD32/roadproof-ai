import json

from app.models import InspectionDB, DamageDetectionDB


def create_mock_inspection(image_id, db):
    inspection = InspectionDB(
        damage_image_id=image_id,
        status="completed",
        damage_detected=True,
        damage_count=1,
        highest_confidence=0.9298,
        model_repository="harpreetsahota/car-dd-segmentation-yolov11",
        model_checkpoint="best.pt",
        confidence_threshold=0.25
    )

    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    detection = DamageDetectionDB(
        inspection_id=inspection.id,
        damage_type="dent",
        confidence=0.9298,
        x1=315.31,
        y1=411.14,
        x2=550.91,
        y2=567.41,
        segmentation=json.dumps([
            {"x": 426.12, "y": 411.82},
            {"x": 425.10, "y": 412.84}
        ])
    )

    db.add(detection)
    db.commit()
    db.refresh(inspection)

    return inspection


def test_health(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "Server Running",
        "version": "1.0"
    }


def test_create_vehicle(client):
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
    assert response.json()["vehicle"]["registration"] == "AB12CDE"
    assert response.json()["vehicle"]["make"] == "BMW"


def test_duplicate_vehicle(client):
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


def test_get_vehicle(client):
    vehicle_data = {
        "registration": "ZZ99 XYZ",
        "make": "Mercedes",
        "model": "A35",
        "year": 2024
    }

    client.post("/vehicle", json=vehicle_data)

    response = client.get("/vehicles/zz99xyz")

    assert response.status_code == 200
    assert response.json()["registration"] == "ZZ99XYZ"
    assert response.json()["make"] == "Mercedes"


def test_update_vehicle(client):
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


def test_delete_vehicle(client):
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


def test_upload_damage_image(client):
    vehicle_data = {
        "registration": "IMG12 CAR",
        "make": "BMW",
        "model": "M3",
        "year": 2023
    }

    client.post("/vehicle", json=vehicle_data)

    files = {
        "image": (
            "damage.jpg",
            b"fake-image-data",
            "image/jpeg"
        )
    }

    response = client.post(
        "/vehicles/img12car/damage-image",
        files=files
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Damage image uploaded successfully!"
    assert response.json()["registration"] == "IMG12CAR"
    assert response.json()["image"]["filename"].endswith("_damage.jpg")


def test_reject_invalid_file_type(client):
    vehicle_data = {
        "registration": "FILE12 CAR",
        "make": "Audi",
        "model": "A3",
        "year": 2022
    }

    client.post("/vehicle", json=vehicle_data)

    files = {
        "image": (
            "notes.txt",
            b"this is not an image",
            "text/plain"
        )
    }

    response = client.post(
        "/vehicles/file12car/damage-image",
        files=files
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "Only JPEG and PNG images are allowed"
    )


def test_reject_oversized_image(client):
    vehicle_data = {
        "registration": "BIG12 CAR",
        "make": "Mercedes",
        "model": "A35",
        "year": 2024
    }

    client.post("/vehicle", json=vehicle_data)

    oversized_image = b"x" * (5 * 1024 * 1024 + 1)

    files = {
        "image": (
            "huge.jpg",
            oversized_image,
            "image/jpeg"
        )
    }

    response = client.post(
        "/vehicles/big12car/damage-image",
        files=files
    )

    assert response.status_code == 413
    assert response.json()["detail"] == (
        "Image file is too large. Maximum size is 5MB."
    )


def test_analyse_damage_image(client, monkeypatch):
    vehicle_data = {
        "registration": "AI12 CAR",
        "make": "BMW",
        "model": "M3",
        "year": 2023
    }

    client.post("/vehicle", json=vehicle_data)

    files = {
        "image": (
            "damage.jpg",
            b"fake-image-data",
            "image/jpeg"
        )
    }

    upload_response = client.post(
        "/vehicles/ai12car/damage-image",
        files=files
    )

    image_id = upload_response.json()["image"]["id"]

    def fake_analyse_damage_image(image_id, db):
        return create_mock_inspection(
            image_id=image_id,
            db=db
        )

    monkeypatch.setattr(
        "app.main.analyse_damage_image",
        fake_analyse_damage_image
    )

    response = client.post(
        f"/damage-images/{image_id}/analyse"
    )

    assert response.status_code == 200

    inspection = response.json()["inspection"]

    assert inspection["status"] == "completed"
    assert inspection["damage_detected"] is True
    assert inspection["damage_count"] == 1
    assert inspection["highest_confidence"] == 0.9298

    assert len(inspection["detections"]) == 1
    assert inspection["detections"][0]["damage_type"] == "dent"
    assert inspection["detections"][0]["confidence"] == 0.9298


def test_analyse_missing_damage_image(client):
    response = client.post(
        "/damage-images/999999/analyse"
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Damage image not found"


def test_get_image_inspections(client, monkeypatch):
    vehicle_data = {
        "registration": "HIST12 CAR",
        "make": "BMW",
        "model": "M4",
        "year": 2024
    }

    client.post("/vehicle", json=vehicle_data)

    files = {
        "image": (
            "front-damage.jpg",
            b"fake-image-data",
            "image/jpeg"
        )
    }

    upload_response = client.post(
        "/vehicles/hist12car/damage-image",
        files=files
    )

    image_id = upload_response.json()["image"]["id"]

    def fake_analyse_damage_image(image_id, db):
        return create_mock_inspection(
            image_id=image_id,
            db=db
        )

    monkeypatch.setattr(
        "app.main.analyse_damage_image",
        fake_analyse_damage_image
    )

    analysis_response = client.post(
        f"/damage-images/{image_id}/analyse"
    )

    assert analysis_response.status_code == 200

    response = client.get(
        f"/damage-images/{image_id}/inspections"
    )

    assert response.status_code == 200
    assert response.json()["image_id"] == image_id
    assert response.json()["inspection_count"] == 1

    inspection = response.json()["inspections"][0]

    assert inspection["status"] == "completed"
    assert inspection["damage_detected"] is True
    assert inspection["damage_count"] == 1
    assert inspection["highest_confidence"] == 0.9298

    assert inspection["model"]["checkpoint"] == "best.pt"

    detection = inspection["detections"][0]

    assert detection["damage_type"] == "dent"
    assert detection["confidence"] == 0.9298
    assert len(detection["segmentation"]) == 2