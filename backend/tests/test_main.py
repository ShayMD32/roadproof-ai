import json

from app.models import (
    AuditLogDB,
    DamageDetectionDB,
    InspectionDB,
    OrganisationMembershipDB,
)


from conftest import (
    TestingSessionLocal,
)


def create_mock_inspection(
    image_id,
    db,
):
    inspection = InspectionDB(
        damage_image_id=image_id,
        status="completed",
        damage_detected=True,
        damage_count=1,
        highest_confidence=0.9298,
        model_repository=(
            "harpreetsahota/"
            "car-dd-segmentation-yolov11"
        ),
        model_checkpoint="best.pt",
        confidence_threshold=0.25,
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
        segmentation=json.dumps(
            [
                {
                    "x": 426.12,
                    "y": 411.82,
                },
                {
                    "x": 425.10,
                    "y": 412.84,
                },
            ]
        ),
    )

    db.add(detection)
    db.commit()
    db.refresh(inspection)

    return inspection


def create_user_headers(
    client,
    email,
    full_name,
):
    password = "Password123"

    register_response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": full_name,
        },
    )

    assert (
        register_response.status_code
        == 201
    )

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert (
        login_response.status_code
        == 200
    )

    token = login_response.json()[
        "access_token"
    ]

    return {
        "Authorization":
            f"Bearer {token}",
    }


def test_health(client):
    response = client.get(
        "/health"
    )

    assert (
        response.status_code
        == 200
    )

    assert response.json() == {
        "status": "Server Running",
        "version": "1.0",
    }


def test_protected_route_requires_auth(
    client,
):
    response = client.get(
        "/vehicles"
    )

    assert (
        response.status_code
        == 401
    )


def test_create_vehicle(
    authenticated_client,
):
    response = authenticated_client.post(
        "/vehicle",
        json={
            "registration": "AB12 CDE",
            "make": "BMW",
            "model": "M3",
            "year": 2023,
        },
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "vehicle"
        ]["registration"]
        == "AB12CDE"
    )

    assert (
        response.json()[
            "vehicle"
        ]["make"]
        == "BMW"
    )


def test_duplicate_vehicle(
    authenticated_client,
):
    vehicle_data = {
        "registration": "XY12 ABC",
        "make": "Audi",
        "model": "RS3",
        "year": 2024,
    }

    first_response = (
        authenticated_client.post(
            "/vehicle",
            json=vehicle_data,
        )
    )

    assert (
        first_response.status_code
        == 200
    )

    response = (
        authenticated_client.post(
            "/vehicle",
            json=vehicle_data,
        )
    )

    assert (
        response.status_code
        == 409
    )

    assert (
        response.json()["detail"]
        == (
            "Vehicle already exists "
            "in this workspace"
        )
    )


def test_get_vehicle(
    authenticated_client,
):
    vehicle_data = {
        "registration": "ZZ99 XYZ",
        "make": "Mercedes",
        "model": "A35",
        "year": 2024,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    response = authenticated_client.get(
        "/vehicles/zz99xyz"
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "registration"
        ]
        == "ZZ99XYZ"
    )

    assert (
        response.json()["make"]
        == "Mercedes"
    )


def test_update_vehicle(
    authenticated_client,
):
    vehicle_data = {
        "registration": "YY22 CAR",
        "make": "BMW",
        "model": "M3",
        "year": 2022,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    updated_data = {
        "registration": "YY22 CAR",
        "make": "BMW",
        "model": "M3 Competition",
        "year": 2024,
    }

    response = authenticated_client.put(
        "/vehicles/yy22car",
        json=updated_data,
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()[
            "vehicle"
        ]["model"]
        == "M3 Competition"
    )

    assert (
        response.json()[
            "vehicle"
        ]["year"]
        == 2024
    )


def test_delete_vehicle(
    authenticated_client,
):
    vehicle_data = {
        "registration": "DL55 CAR",
        "make": "Ford",
        "model": "Focus",
        "year": 2021,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    response = authenticated_client.delete(
        "/vehicles/dl55car"
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()["message"]
        == "Vehicle deleted successfully!"
    )

    get_response = authenticated_client.get(
        "/vehicles/dl55car"
    )

    assert (
        get_response.status_code
        == 404
    )

    assert (
        get_response.json()["detail"]
        == "Vehicle not found"
    )


def test_upload_damage_image(
    authenticated_client,
):
    vehicle_data = {
        "registration": "IMG12 CAR",
        "make": "BMW",
        "model": "M3",
        "year": 2023,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    files = {
        "image": (
            "damage.jpg",
            b"fake-image-data",
            "image/jpeg",
        )
    }

    response = authenticated_client.post(
        "/vehicles/img12car/damage-image",
        files=files,
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()["message"]
        == (
            "Damage image uploaded "
            "successfully!"
        )
    )

    assert (
        response.json()["registration"]
        == "IMG12CAR"
    )

    image_data = response.json()["image"]

    assert (
        image_data["filename"]
        .endswith(
            "_damage.jpg"
        )
    )

    assert (
        "file_path"
        not in image_data
    )

    assert (
        image_data["content_url"]
        == (
            f"/damage-images/"
            f"{image_data['id']}/content"
        )
    )


def test_damage_image_list_hides_file_path(
    authenticated_client,
):
    authenticated_client.post(
        "/vehicle",
        json={
            "registration":
                "SAFE12CAR",
            "make":
                "BMW",
            "model":
                "M4",
            "year":
                2024,
        },
    )

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "safe12car/"
                "damage-image"
            ),
            files={
                "image": (
                    "damage.png",
                    b"fake-image-data",
                    "image/png",
                )
            },
        )
    )

    assert (
        upload_response.status_code
        == 200
    )

    response = authenticated_client.get(
        (
            "/vehicles/"
            "safe12car/"
            "damage-images"
        )
    )

    assert (
        response.status_code
        == 200
    )

    images = (
        response.json()["images"]
    )

    assert len(images) == 1

    assert (
        "file_path"
        not in images[0]
    )

    assert (
        images[0]["content_url"]
        == (
            f"/damage-images/"
            f"{images[0]['id']}/content"
        )
    )


def test_authenticated_user_can_fetch_own_image(
    authenticated_client,
):
    authenticated_client.post(
        "/vehicle",
        json={
            "registration":
                "OWN12IMG",
            "make":
                "Audi",
            "model":
                "A3",
            "year":
                2023,
        },
    )

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "own12img/"
                "damage-image"
            ),
            files={
                "image": (
                    "damage.jpg",
                    b"image-bytes",
                    "image/jpeg",
                )
            },
        )
    )

    assert (
        upload_response.status_code
        == 200
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    response = authenticated_client.get(
        (
            f"/damage-images/"
            f"{image_id}/content"
        )
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.content
        == b"image-bytes"
    )

    assert (
        response.headers[
            "content-type"
        ].startswith(
            "image/jpeg"
        )
    )

    assert (
        response.headers[
            "cache-control"
        ]
        == "private, no-store"
    )


def test_image_content_requires_auth(
    client,
    authenticated_client,
):
    authenticated_client.post(
        "/vehicle",
        json={
            "registration":
                "AUTH12IMG",
            "make":
                "BMW",
            "model":
                "M3",
            "year":
                2024,
        },
    )

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "auth12img/"
                "damage-image"
            ),
            files={
                "image": (
                    "damage.jpg",
                    b"image-bytes",
                    "image/jpeg",
                )
            },
        )
    )

    assert (
        upload_response.status_code
        == 200
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    client.headers.pop(
        "Authorization",
        None,
    )

    response = client.get(
        (
            f"/damage-images/"
            f"{image_id}/content"
        )
    )

    assert (
        response.status_code
        == 401
    )


def test_other_user_cannot_fetch_private_image(
    client,
):
    owner_headers = (
        create_user_headers(
            client,
            "imageowner@example.com",
            "Image Owner",
        )
    )

    outsider_headers = (
        create_user_headers(
            client,
            "imageoutsider@example.com",
            "Image Outsider",
        )
    )

    create_response = client.post(
        "/vehicle",
        headers=owner_headers,
        json={
            "registration":
                "PRIVATEIMG",
            "make":
                "Mercedes",
            "model":
                "A35",
            "year":
                2024,
        },
    )

    assert (
        create_response.status_code
        == 200
    )

    upload_response = client.post(
        (
            "/vehicles/"
            "privateimg/"
            "damage-image"
        ),
        headers=owner_headers,
        files={
            "image": (
                "private.jpg",
                b"private-image",
                "image/jpeg",
            )
        },
    )

    assert (
        upload_response.status_code
        == 200
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    response = client.get(
        (
            f"/damage-images/"
            f"{image_id}/content"
        ),
        headers=outsider_headers,
    )

    assert (
        response.status_code
        == 404
    )

    assert (
        response.json()["detail"]
        == "Damage image not found"
    )


def test_reject_invalid_file_type(
    authenticated_client,
):
    vehicle_data = {
        "registration": "FILE12 CAR",
        "make": "Audi",
        "model": "A3",
        "year": 2022,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    files = {
        "image": (
            "notes.txt",
            b"this is not an image",
            "text/plain",
        )
    }

    response = authenticated_client.post(
        "/vehicles/file12car/damage-image",
        files=files,
    )

    assert (
        response.status_code
        == 400
    )

    assert (
        response.json()["detail"]
        == (
            "Only JPEG and PNG images "
            "are allowed"
        )
    )


def test_reject_oversized_image(
    authenticated_client,
):
    vehicle_data = {
        "registration": "BIG12 CAR",
        "make": "Mercedes",
        "model": "A35",
        "year": 2024,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    oversized_image = (
        b"x"
        * (
            5
            * 1024
            * 1024
            + 1
        )
    )

    files = {
        "image": (
            "huge.jpg",
            oversized_image,
            "image/jpeg",
        )
    }

    response = authenticated_client.post(
        "/vehicles/big12car/damage-image",
        files=files,
    )

    assert (
        response.status_code
        == 413
    )

    assert (
        response.json()["detail"]
        == (
            "Image file is too large. "
            "Maximum size is 5MB."
        )
    )


def test_analyse_damage_image(
    authenticated_client,
    monkeypatch,
):
    vehicle_data = {
        "registration": "AI12 CAR",
        "make": "BMW",
        "model": "M3",
        "year": 2023,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    files = {
        "image": (
            "damage.jpg",
            b"fake-image-data",
            "image/jpeg",
        )
    }

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "ai12car/"
                "damage-image"
            ),
            files=files,
        )
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    def fake_analyse_damage_image(
        image_id,
        db,
    ):
        return create_mock_inspection(
            image_id=image_id,
            db=db,
        )

    monkeypatch.setattr(
        (
            "app.main."
            "analyse_damage_image"
        ),
        fake_analyse_damage_image,
    )

    response = authenticated_client.post(
        (
            f"/damage-images/"
            f"{image_id}/analyse"
        )
    )

    assert (
        response.status_code
        == 200
    )

    inspection = (
        response.json()["inspection"]
    )

    assert (
        inspection["status"]
        == "completed"
    )

    assert (
        inspection[
            "damage_detected"
        ]
        is True
    )

    assert (
        inspection["damage_count"]
        == 1
    )

    assert (
        inspection[
            "highest_confidence"
        ]
        == 0.9298
    )

    assert (
        len(
            inspection[
                "detections"
            ]
        )
        == 1
    )

    assert (
        inspection[
            "detections"
        ][0][
            "damage_type"
        ]
        == "dent"
    )

    assert (
        inspection[
            "detections"
        ][0][
            "confidence"
        ]
        == 0.9298
    )


def test_analyse_missing_damage_image(
    authenticated_client,
):
    response = authenticated_client.post(
        (
            "/damage-images/"
            "999999/analyse"
        )
    )

    assert (
        response.status_code
        == 404
    )

    assert (
        response.json()["detail"]
        == "Damage image not found"
    )


def test_get_image_inspections(
    authenticated_client,
    monkeypatch,
):
    vehicle_data = {
        "registration": "HIST12 CAR",
        "make": "BMW",
        "model": "M4",
        "year": 2024,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    files = {
        "image": (
            "front-damage.jpg",
            b"fake-image-data",
            "image/jpeg",
        )
    }

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "hist12car/"
                "damage-image"
            ),
            files=files,
        )
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    def fake_analyse_damage_image(
        image_id,
        db,
    ):
        return create_mock_inspection(
            image_id=image_id,
            db=db,
        )

    monkeypatch.setattr(
        (
            "app.main."
            "analyse_damage_image"
        ),
        fake_analyse_damage_image,
    )

    analysis_response = (
        authenticated_client.post(
            (
                f"/damage-images/"
                f"{image_id}/analyse"
            )
        )
    )

    assert (
        analysis_response.status_code
        == 200
    )

    response = authenticated_client.get(
        (
            f"/damage-images/"
            f"{image_id}/inspections"
        )
    )

    assert (
        response.status_code
        == 200
    )

    assert (
        response.json()["image_id"]
        == image_id
    )

    assert (
        response.json()[
            "inspection_count"
        ]
        == 1
    )

    inspection = (
        response.json()[
            "inspections"
        ][0]
    )

    assert (
        inspection["status"]
        == "completed"
    )

    assert (
        inspection[
            "damage_detected"
        ]
        is True
    )

    assert (
        inspection["damage_count"]
        == 1
    )

    assert (
        inspection[
            "highest_confidence"
        ]
        == 0.9298
    )

    assert (
        inspection["model"][
            "checkpoint"
        ]
        == "best.pt"
    )

    detection = (
        inspection[
            "detections"
        ][0]
    )

    assert (
        detection["damage_type"]
        == "dent"
    )

    assert (
        detection["confidence"]
        == 0.9298
    )

    assert (
        len(
            detection[
                "segmentation"
            ]
        )
        == 2
    )


def test_get_inspection_report(
    authenticated_client,
    monkeypatch,
):
    vehicle_data = {
        "registration": "REPORT12 CAR",
        "make": "BMW",
        "model": "M3",
        "year": 2024,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    files = {
        "image": (
            "damage.jpg",
            b"fake-image-data",
            "image/jpeg",
        )
    }

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "report12car/"
                "damage-image"
            ),
            files=files,
        )
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    def fake_analyse_damage_image(
        image_id,
        db,
    ):
        return create_mock_inspection(
            image_id=image_id,
            db=db,
        )

    monkeypatch.setattr(
        (
            "app.main."
            "analyse_damage_image"
        ),
        fake_analyse_damage_image,
    )

    analysis_response = (
        authenticated_client.post(
            (
                f"/damage-images/"
                f"{image_id}/analyse"
            )
        )
    )

    inspection_id = (
        analysis_response.json()[
            "inspection"
        ]["id"]
    )

    response = authenticated_client.get(
        (
            f"/inspections/"
            f"{inspection_id}/report"
        )
    )

    assert (
        response.status_code
        == 200
    )

    report = (
        response.json()["report"]
    )

    assert (
        report["inspection_id"]
        == inspection_id
    )

    assert (
        report["vehicle"][
            "registration"
        ]
        == "REPORT12CAR"
    )

    assert (
        report["vehicle"]["make"]
        == "BMW"
    )

    assert (
        report["vehicle"]["model"]
        == "M3"
    )

    assert (
        report["summary"][
            "damage_detected"
        ]
        is True
    )

    assert (
        report["summary"][
            "damage_count"
        ]
        == 1
    )

    assert (
        len(
            report[
                "detections"
            ]
        )
        == 1
    )

    assert (
        report["detections"][0][
            "damage_type"
        ]
        == "dent"
    )


def test_get_missing_inspection_report(
    authenticated_client,
):
    response = authenticated_client.get(
        (
            "/inspections/"
            "999999/report"
        )
    )

    assert (
        response.status_code
        == 404
    )

    assert (
        response.json()["detail"]
        == "Inspection not found"
    )


def test_get_vehicle_inspection_summary(
    authenticated_client,
    monkeypatch,
):
    vehicle_data = {
        "registration": "SUM12 CAR",
        "make": "BMW",
        "model": "M4",
        "year": 2024,
    }

    authenticated_client.post(
        "/vehicle",
        json=vehicle_data,
    )

    files = {
        "image": (
            "damage.jpg",
            b"fake-image-data",
            "image/jpeg",
        )
    }

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "sum12car/"
                "damage-image"
            ),
            files=files,
        )
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    def fake_analyse_damage_image(
        image_id,
        db,
    ):
        return create_mock_inspection(
            image_id=image_id,
            db=db,
        )

    monkeypatch.setattr(
        (
            "app.main."
            "analyse_damage_image"
        ),
        fake_analyse_damage_image,
    )

    analysis_response = (
        authenticated_client.post(
            (
                f"/damage-images/"
                f"{image_id}/analyse"
            )
        )
    )

    assert (
        analysis_response.status_code
        == 200
    )

    inspection_id = (
        analysis_response.json()[
            "inspection"
        ]["id"]
    )

    response = authenticated_client.get(
        (
            "/vehicles/"
            "sum12car/"
            "inspection-summary"
        )
    )

    assert (
        response.status_code
        == 200
    )

    summary = response.json()

    assert (
        summary["registration"]
        == "SUM12CAR"
    )

    assert (
        summary["vehicle"]["make"]
        == "BMW"
    )

    assert (
        summary["vehicle"]["model"]
        == "M4"
    )

    assert (
        summary["total_images"]
        == 1
    )

    assert (
        summary[
            "total_inspections"
        ]
        == 1
    )

    assert (
        summary[
            "damage_detected"
        ]
        is True
    )

    assert (
        summary[
            "total_damage_detections"
        ]
        == 1
    )

    assert (
        summary[
            "latest_inspection_id"
        ]
        == inspection_id
    )


def test_get_missing_vehicle_inspection_summary(
    authenticated_client,
):
    response = authenticated_client.get(
        (
            "/vehicles/"
            "NOTREAL123/"
            "inspection-summary"
        )
    )

    assert (
        response.status_code
        == 404
    )

    assert (
        response.json()["detail"]
        == "Vehicle not found"
    )


def test_delete_damage_image(
    authenticated_client,
):
    vehicle_data = {
        "registration": "DEL12 IMG",
        "make": "BMW",
        "model": "M3",
        "year": 2024,
    }

    create_response = (
        authenticated_client.post(
            "/vehicle",
            json=vehicle_data,
        )
    )

    assert (
        create_response.status_code
        == 200
    )

    files = {
        "image": (
            "damage.jpg",
            b"fake-image-data",
            "image/jpeg",
        )
    }

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "del12img/"
                "damage-image"
            ),
            files=files,
        )
    )

    assert (
        upload_response.status_code
        == 200
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    delete_response = (
        authenticated_client.delete(
            (
                f"/damage-images/"
                f"{image_id}"
            )
        )
    )

    assert (
        delete_response.status_code
        == 200
    )

    assert (
        delete_response.json()[
            "message"
        ]
        == (
            "Damage image deleted "
            "successfully"
        )
    )

    get_response = (
        authenticated_client.get(
            (
                "/vehicles/"
                "del12img/"
                "damage-images"
            )
        )
    )

    assert (
        get_response.status_code
        == 200
    )

    assert (
        get_response.json()[
            "images"
        ]
        == []
    )


def test_delete_vehicle_and_associated_data(
    authenticated_client,
):
    vehicle_data = {
        "registration": "DEL99 CAR",
        "make": "Audi",
        "model": "RS3",
        "year": 2024,
    }

    create_response = (
        authenticated_client.post(
            "/vehicle",
            json=vehicle_data,
        )
    )

    assert (
        create_response.status_code
        == 200
    )

    files = {
        "image": (
            "damage.jpg",
            b"fake-image-data",
            "image/jpeg",
        )
    }

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "del99car/"
                "damage-image"
            ),
            files=files,
        )
    )

    assert (
        upload_response.status_code
        == 200
    )

    delete_response = (
        authenticated_client.delete(
            (
                "/vehicles/"
                "del99car/full"
            )
        )
    )

    assert (
        delete_response.status_code
        == 200
    )

    assert (
        delete_response.json()[
            "message"
        ]
        == (
            "Vehicle and associated data "
            "deleted successfully"
        )
    )

    get_response = (
        authenticated_client.get(
            "/vehicles/del99car"
        )
    )

    assert (
        get_response.status_code
        == 404
    )


def test_user_cannot_view_another_users_vehicle(
    client,
):
    user_a_headers = (
        create_user_headers(
            client,
            "usera@example.com",
            "User A",
        )
    )

    user_b_headers = (
        create_user_headers(
            client,
            "userb@example.com",
            "User B",
        )
    )

    create_response = client.post(
        "/vehicle",
        headers=user_a_headers,
        json={
            "registration": "PRIVATE1",
            "make": "BMW",
            "model": "M3",
            "year": 2024,
        },
    )

    assert (
        create_response.status_code
        == 200
    )

    response = client.get(
        "/vehicles/PRIVATE1",
        headers=user_b_headers,
    )

    assert (
        response.status_code
        == 404
    )

    assert (
        response.json()["detail"]
        == "Vehicle not found"
    )


def test_user_vehicle_list_is_isolated(
    client,
):
    user_a_headers = (
        create_user_headers(
            client,
            "owner@example.com",
            "Vehicle Owner",
        )
    )

    user_b_headers = (
        create_user_headers(
            client,
            "viewer@example.com",
            "Other User",
        )
    )

    create_response = client.post(
        "/vehicle",
        headers=user_a_headers,
        json={
            "registration": "ISO12CAR",
            "make": "Audi",
            "model": "RS3",
            "year": 2024,
        },
    )

    assert (
        create_response.status_code
        == 200
    )

    owner_response = client.get(
        "/vehicles",
        headers=user_a_headers,
    )

    assert (
        owner_response.status_code
        == 200
    )

    owner_vehicles = (
        owner_response.json()
    )

    assert (
        len(owner_vehicles)
        == 1
    )

    assert (
        owner_vehicles[0][
            "registration"
        ]
        == "ISO12CAR"
    )

    other_response = client.get(
        "/vehicles",
        headers=user_b_headers,
    )

    assert (
        other_response.status_code
        == 200
    )

    assert (
        other_response.json()
        == []
    )

def get_audit_log(
    action,
):
    db = TestingSessionLocal()

    try:
        return (
            db.query(AuditLogDB)
            .filter(
                AuditLogDB.action
                == action
            )
            .order_by(
                AuditLogDB.id.desc()
            )
            .first()
        )

    finally:
        db.close()


def create_account_with_id(
    client,
    email,
    full_name,
):
    password = "Password123"

    register_response = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": full_name,
        },
    )

    assert (
        register_response.status_code
        == 201
    )

    user_id = (
        register_response.json()["id"]
    )

    login_response = client.post(
        "/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )

    assert (
        login_response.status_code
        == 200
    )

    token = login_response.json()[
        "access_token"
    ]

    return (
        user_id,
        {
            "Authorization":
                f"Bearer {token}",
        },
    )


def test_vehicle_update_creates_audit_log(
    authenticated_client,
):
    create_response = (
        authenticated_client.post(
            "/vehicle",
            json={
                "registration":
                    "AUDITUP1",
                "make":
                    "BMW",
                "model":
                    "M3",
                "year":
                    2024,
            },
        )
    )

    assert (
        create_response.status_code
        == 200
    )

    vehicle_id = (
        create_response.json()[
            "vehicle"
        ]["id"]
    )

    response = authenticated_client.put(
        "/vehicles/AUDITUP1",
        json={
            "registration":
                "AUDITUP1",
            "make":
                "BMW",
            "model":
                "M3 Competition",
            "year":
                2025,
        },
    )

    assert (
        response.status_code
        == 200
    )

    audit_log = get_audit_log(
        "vehicle.update"
    )

    assert audit_log is not None

    assert (
        audit_log.entity_type
        == "vehicle"
    )

    assert (
        audit_log.entity_id
        == vehicle_id
    )

    details = json.loads(
        audit_log.details
    )

    assert (
        details["before"]["model"]
        == "M3"
    )

    assert (
        details["after"]["model"]
        == "M3 Competition"
    )


def test_vehicle_delete_creates_audit_log(
    authenticated_client,
):
    create_response = (
        authenticated_client.post(
            "/vehicle",
            json={
                "registration":
                    "AUDITDEL1",
                "make":
                    "Audi",
                "model":
                    "RS3",
                "year":
                    2024,
            },
        )
    )

    assert (
        create_response.status_code
        == 200
    )

    vehicle_id = (
        create_response.json()[
            "vehicle"
        ]["id"]
    )

    response = authenticated_client.delete(
        "/vehicles/AUDITDEL1"
    )

    assert (
        response.status_code
        == 200
    )

    audit_log = get_audit_log(
        "vehicle.delete"
    )

    assert audit_log is not None

    assert (
        audit_log.entity_id
        == vehicle_id
    )

    details = json.loads(
        audit_log.details
    )

    assert (
        details["registration"]
        == "AUDITDEL1"
    )


def test_damage_image_delete_creates_audit_log(
    authenticated_client,
):
    create_response = (
        authenticated_client.post(
            "/vehicle",
            json={
                "registration":
                    "AUDITIMG1",
                "make":
                    "Mercedes",
                "model":
                    "A35",
                "year":
                    2024,
            },
        )
    )

    assert (
        create_response.status_code
        == 200
    )

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "AUDITIMG1/"
                "damage-image"
            ),
            files={
                "image": (
                    "audit.jpg",
                    b"audit-image-data",
                    "image/jpeg",
                )
            },
        )
    )

    assert (
        upload_response.status_code
        == 200
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    response = authenticated_client.delete(
        (
            f"/damage-images/"
            f"{image_id}"
        )
    )

    assert (
        response.status_code
        == 200
    )

    audit_log = get_audit_log(
        "damage_image.delete"
    )

    assert audit_log is not None

    assert (
        audit_log.entity_type
        == "damage_image"
    )

    assert (
        audit_log.entity_id
        == image_id
    )

    details = json.loads(
        audit_log.details
    )

    assert (
        details["registration"]
        == "AUDITIMG1"
    )


def test_member_add_creates_audit_log(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account_with_id(
        client,
        "auditowner@example.com",
        "Audit Owner",
    )

    (
        member_id,
        _,
    ) = create_account_with_id(
        client,
        "auditmember@example.com",
        "Audit Member",
    )

    db = TestingSessionLocal()

    try:
        owner_membership = (
            db.query(
                OrganisationMembershipDB
            )
            .filter(
                OrganisationMembershipDB.user_id
                == owner_id
            )
            .first()
        )

        assert (
            owner_membership
            is not None
        )

        organisation_id = (
            owner_membership
            .organisation_id
        )

    finally:
        db.close()

    response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "auditmember@example.com",
            "role":
                "member",
        },
    )

    assert (
        response.status_code
        == 201
    )

    membership_id = (
        response.json()[
            "membership_id"
        ]
    )

    audit_log = get_audit_log(
        "membership.add"
    )

    assert audit_log is not None

    assert (
        audit_log.actor_user_id
        == owner_id
    )

    assert (
        audit_log.organisation_id
        == organisation_id
    )

    assert (
        audit_log.entity_id
        == membership_id
    )

    details = json.loads(
        audit_log.details
    )

    assert (
        details["target_user_id"]
        == member_id
    )

    assert (
        details["role"]
        == "member"
    )


def test_member_role_update_creates_audit_log(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account_with_id(
        client,
        "auditroleowner@example.com",
        "Audit Role Owner",
    )

    (
        member_id,
        _,
    ) = create_account_with_id(
        client,
        "auditroleuser@example.com",
        "Audit Role User",
    )

    db = TestingSessionLocal()

    try:
        owner_membership = (
            db.query(
                OrganisationMembershipDB
            )
            .filter(
                OrganisationMembershipDB.user_id
                == owner_id
            )
            .first()
        )

        assert owner_membership is not None

        organisation_id = (
            owner_membership.organisation_id
        )

    finally:
        db.close()

    add_response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "auditroleuser@example.com",
            "role":
                "member",
        },
    )

    assert (
        add_response.status_code
        == 201
    )

    membership_id = (
        add_response.json()[
            "membership_id"
        ]
    )

    response = client.patch(
        (
            f"/organisations/"
            f"{organisation_id}/members/"
            f"{member_id}"
        ),
        headers=owner_headers,
        json={
            "role":
                "admin",
        },
    )

    assert (
        response.status_code
        == 200
    )

    audit_log = get_audit_log(
        "membership.role_update"
    )

    assert audit_log is not None

    assert (
        audit_log.entity_id
        == membership_id
    )

    details = json.loads(
        audit_log.details
    )

    assert (
        details["before_role"]
        == "member"
    )

    assert (
        details["after_role"]
        == "admin"
    )


def test_member_remove_creates_audit_log(
    client,
):
    (
        owner_id,
        owner_headers,
    ) = create_account_with_id(
        client,
        "auditremoveowner@example.com",
        "Audit Remove Owner",
    )

    (
        member_id,
        _,
    ) = create_account_with_id(
        client,
        "auditremoveuser@example.com",
        "Audit Remove User",
    )

    db = TestingSessionLocal()

    try:
        owner_membership = (
            db.query(
                OrganisationMembershipDB
            )
            .filter(
                OrganisationMembershipDB.user_id
                == owner_id
            )
            .first()
        )

        assert owner_membership is not None

        organisation_id = (
            owner_membership.organisation_id
        )

    finally:
        db.close()

    add_response = client.post(
        (
            f"/organisations/"
            f"{organisation_id}/members"
        ),
        headers=owner_headers,
        json={
            "email":
                "auditremoveuser@example.com",
            "role":
                "member",
        },
    )

    assert (
        add_response.status_code
        == 201
    )

    membership_id = (
        add_response.json()[
            "membership_id"
        ]
    )

    response = client.delete(
        (
            f"/organisations/"
            f"{organisation_id}/members/"
            f"{member_id}"
        ),
        headers=owner_headers,
    )

    assert (
        response.status_code
        == 200
    )

    audit_log = get_audit_log(
        "membership.remove"
    )

    assert audit_log is not None

    assert (
        audit_log.entity_id
        == membership_id
    )

    details = json.loads(
        audit_log.details
    )

    assert (
        details["target_user_id"]
        == member_id
    )

    assert (
        details["role"]
        == "member"
    )


def test_empty_dashboard_summary(
    authenticated_client,
):
    response = authenticated_client.get(
        "/dashboard/summary"
    )

    assert (
        response.status_code
        == 200
    )

    data = response.json()

    assert (
        data["total_vehicles"]
        == 0
    )

    assert (
        data["total_inspections"]
        == 0
    )

    assert (
        data["damage_detected"]
        == 0
    )

    assert (
        data["clear_inspections"]
        == 0
    )

    assert (
        data["manual_review_count"]
        == 0
    )

    assert (
        data["recent_inspections"]
        == []
    )


def test_dashboard_recent_inspection_has_report_url(
    authenticated_client,
    monkeypatch,
):
    authenticated_client.post(
        "/vehicle",
        json={
            "registration":
                "DASH12CAR",
            "make":
                "BMW",
            "model":
                "M3",
            "year":
                2024,
        },
    )

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "dash12car/"
                "damage-image"
            ),
            files={
                "image": (
                    "damage.jpg",
                    b"fake-image-data",
                    "image/jpeg",
                )
            },
        )
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    def fake_analyse_damage_image(
        image_id,
        db,
    ):
        return create_mock_inspection(
            image_id=image_id,
            db=db,
        )

    monkeypatch.setattr(
        (
            "app.main."
            "analyse_damage_image"
        ),
        fake_analyse_damage_image,
    )

    analysis_response = (
        authenticated_client.post(
            (
                f"/damage-images/"
                f"{image_id}/analyse"
            )
        )
    )

    inspection_id = (
        analysis_response.json()[
            "inspection"
        ]["id"]
    )

    response = authenticated_client.get(
        "/dashboard/summary"
    )

    assert (
        response.status_code
        == 200
    )

    recent = (
        response.json()[
            "recent_inspections"
        ]
    )

    assert len(recent) == 1

    assert (
        recent[0]["id"]
        == inspection_id
    )

    assert (
        recent[0][
            "registration"
        ]
        == "DASH12CAR"
    )

    assert (
        recent[0][
            "report_url"
        ]
        == (
            f"/app/reports/"
            f"{inspection_id}"
        )
    )


def test_dashboard_recent_inspections_are_newest_first(
    authenticated_client,
    monkeypatch,
):
    authenticated_client.post(
        "/vehicle",
        json={
            "registration":
                "ORDER12",
            "make":
                "Audi",
            "model":
                "RS3",
            "year":
                2024,
        },
    )

    def fake_analyse_damage_image(
        image_id,
        db,
    ):
        return create_mock_inspection(
            image_id=image_id,
            db=db,
        )

    monkeypatch.setattr(
        (
            "app.main."
            "analyse_damage_image"
        ),
        fake_analyse_damage_image,
    )

    first_upload = (
        authenticated_client.post(
            (
                "/vehicles/"
                "order12/"
                "damage-image"
            ),
            files={
                "image": (
                    "first.jpg",
                    b"first-image",
                    "image/jpeg",
                )
            },
        )
    )

    first_image_id = (
        first_upload.json()[
            "image"
        ]["id"]
    )

    first_analysis = (
        authenticated_client.post(
            (
                f"/damage-images/"
                f"{first_image_id}/analyse"
            )
        )
    )

    first_inspection_id = (
        first_analysis.json()[
            "inspection"
        ]["id"]
    )

    second_upload = (
        authenticated_client.post(
            (
                "/vehicles/"
                "order12/"
                "damage-image"
            ),
            files={
                "image": (
                    "second.jpg",
                    b"second-image",
                    "image/jpeg",
                )
            },
        )
    )

    second_image_id = (
        second_upload.json()[
            "image"
        ]["id"]
    )

    second_analysis = (
        authenticated_client.post(
            (
                f"/damage-images/"
                f"{second_image_id}/analyse"
            )
        )
    )

    second_inspection_id = (
        second_analysis.json()[
            "inspection"
        ]["id"]
    )

    response = authenticated_client.get(
        "/dashboard/summary"
    )

    assert (
        response.status_code
        == 200
    )

    recent = (
        response.json()[
            "recent_inspections"
        ]
    )

    assert (
        recent[0]["id"]
        == second_inspection_id
    )

    assert (
        recent[1]["id"]
        == first_inspection_id
    )


def test_vehicle_summary_includes_latest_inspection_metadata(
    authenticated_client,
    monkeypatch,
):
    authenticated_client.post(
        "/vehicle",
        json={
            "registration":
                "META12CAR",
            "make":
                "Mercedes",
            "model":
                "A35",
            "year":
                2024,
        },
    )

    upload_response = (
        authenticated_client.post(
            (
                "/vehicles/"
                "meta12car/"
                "damage-image"
            ),
            files={
                "image": (
                    "damage.jpg",
                    b"fake-image-data",
                    "image/jpeg",
                )
            },
        )
    )

    assert (
        upload_response.status_code
        == 200
    )

    image_id = (
        upload_response.json()[
            "image"
        ]["id"]
    )

    def fake_analyse_damage_image(
        image_id,
        db,
    ):
        return create_mock_inspection(
            image_id=image_id,
            db=db,
        )

    monkeypatch.setattr(
        (
            "app.main."
            "analyse_damage_image"
        ),
        fake_analyse_damage_image,
    )

    analysis_response = (
        authenticated_client.post(
            (
                f"/damage-images/"
                f"{image_id}/analyse"
            )
        )
    )

    assert (
        analysis_response.status_code
        == 200
    )

    inspection_id = (
        analysis_response.json()[
            "inspection"
        ]["id"]
    )

    response = (
        authenticated_client.get(
            (
                "/vehicles/"
                "meta12car/"
                "inspection-summary"
            )
        )
    )

    assert (
        response.status_code
        == 200
    )

    summary = response.json()

    assert (
        summary[
            "latest_inspection_id"
        ]
        == inspection_id
    )

    assert (
        summary[
            "latest_inspection_status"
        ]
        == "completed"
    )

    assert (
        summary[
            "latest_inspection_created_at"
        ]
        is not None
    )


def test_uninspected_vehicle_is_not_marked_clear(
    authenticated_client,
):
    create_response = (
        authenticated_client.post(
            "/vehicle",
            json={
                "registration":
                    "NEW12CAR",
                "make":
                    "BMW",
                "model":
                    "M2",
                "year":
                    2024,
            },
        )
    )

    assert (
        create_response.status_code
        == 200
    )

    response = (
        authenticated_client.get(
            (
                "/vehicles/"
                "new12car/"
                "inspection-summary"
            )
        )
    )

    assert (
        response.status_code
        == 200
    )

    summary = response.json()

    assert (
        summary[
            "total_inspections"
        ]
        == 0
    )

    assert (
        summary[
            "damage_detected"
        ]
        is None
    )

    assert (
        summary[
            "assessment_status"
        ]
        == "not_inspected"
    )

    assert (
        summary[
            "total_damage_detections"
        ]
        == 0
    )

    assert (
        summary[
            "latest_inspection_id"
        ]
        is None
    )

    assert (
        summary[
            "latest_inspection_status"
        ]
        is None
    )

    assert (
        summary[
            "latest_inspection_created_at"
        ]
        is None
    )
