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
    assert response.json()["detail"] == "Only JPEG and PNG images are allowed"


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