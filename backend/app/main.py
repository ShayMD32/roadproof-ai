import os
import json
from uuid import uuid4

from fastapi import FastAPI, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine, Base
from app.models import (
    VehicleDB,
    DamageImageDB,
    InspectionDB
)

from app.services.inspection_service import (
    analyse_damage_image
)


Base.metadata.create_all(bind=engine)

app = FastAPI()


class Vehicle(BaseModel):
    registration: str
    make: str
    model: str
    year: int


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


def normalise_registration(registration: str):
    return registration.replace(" ", "").upper()


@app.get("/")
def home():
    return {
        "message": "Welcome to RoadProof AI! 🚗"
    }


@app.get("/health")
def health():
    return {
        "status": "Server Running",
        "version": "1.0"
    }


@app.post("/vehicle")
def create_vehicle(
    vehicle: Vehicle,
    db: Session = Depends(get_db)
):
    normalised_registration = normalise_registration(vehicle.registration)

    existing_vehicle = db.query(VehicleDB).filter(
        VehicleDB.registration == normalised_registration
    ).first()

    if existing_vehicle:
        raise HTTPException(
            status_code=409,
            detail="Vehicle already exists"
        )

    new_vehicle = VehicleDB(
        registration=normalised_registration,
        make=vehicle.make,
        model=vehicle.model,
        year=vehicle.year
    )

    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)

    return {
        "message": "Vehicle received successfully!",
        "vehicle": new_vehicle
    }


@app.get("/vehicles")
def get_vehicles(
    db: Session = Depends(get_db)
):
    return db.query(VehicleDB).all()


@app.get("/vehicles/{registration}")
def get_vehicle(
    registration: str,
    db: Session = Depends(get_db)
):
    normalised_registration = normalise_registration(registration)

    vehicle = db.query(VehicleDB).filter(
        VehicleDB.registration == normalised_registration
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    return vehicle


@app.put("/vehicles/{registration}")
def update_vehicle(
    registration: str,
    updated_vehicle: Vehicle,
    db: Session = Depends(get_db)
):
    normalised_registration = normalise_registration(registration)

    vehicle = db.query(VehicleDB).filter(
        VehicleDB.registration == normalised_registration
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    new_registration = normalise_registration(
        updated_vehicle.registration
    )

    duplicate_vehicle = db.query(VehicleDB).filter(
        VehicleDB.registration == new_registration,
        VehicleDB.id != vehicle.id
    ).first()

    if duplicate_vehicle:
        raise HTTPException(
            status_code=409,
            detail="Vehicle already exists"
        )

    vehicle.registration = new_registration
    vehicle.make = updated_vehicle.make
    vehicle.model = updated_vehicle.model
    vehicle.year = updated_vehicle.year

    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle updated successfully!",
        "vehicle": vehicle
    }


@app.delete("/vehicles/{registration}")
def delete_vehicle(
    registration: str,
    db: Session = Depends(get_db)
):
    normalised_registration = normalise_registration(registration)

    vehicle = db.query(VehicleDB).filter(
        VehicleDB.registration == normalised_registration
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    db.delete(vehicle)
    db.commit()

    return {
        "message": "Vehicle deleted successfully!",
        "vehicle": vehicle
    }


@app.post("/vehicles/{registration}/damage-image")
async def upload_damage_image(
    registration: str,
    image: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    normalised_registration = normalise_registration(registration)

    vehicle = db.query(VehicleDB).filter(
        VehicleDB.registration == normalised_registration
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    allowed_types = [
        "image/jpeg",
        "image/png"
    ]

    if image.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG and PNG images are allowed"
        )

    contents = await image.read()

    max_file_size = 5 * 1024 * 1024

    if len(contents) > max_file_size:
        raise HTTPException(
            status_code=413,
            detail="Image file is too large. Maximum size is 5MB."
        )

    upload_directory = "uploads"

    os.makedirs(
        upload_directory,
        exist_ok=True
    )

    unique_filename = f"{uuid4()}_{image.filename}"

    file_path = os.path.join(
        upload_directory,
        f"{normalised_registration}_{unique_filename}"
    )

    with open(file_path, "wb") as file:
        file.write(contents)

    damage_image = DamageImageDB(
        filename=unique_filename,
        file_path=file_path,
        vehicle_id=vehicle.id
    )

    db.add(damage_image)
    db.commit()
    db.refresh(damage_image)

    return {
        "message": "Damage image uploaded successfully!",
        "registration": normalised_registration,
        "image": {
            "id": damage_image.id,
            "filename": damage_image.filename,
            "file_path": damage_image.file_path
        }
    }


@app.get("/vehicles/{registration}/damage-images")
def get_damage_images(
    registration: str,
    db: Session = Depends(get_db)
):
    normalised_registration = normalise_registration(registration)

    vehicle = db.query(VehicleDB).filter(
        VehicleDB.registration == normalised_registration
    ).first()

    if not vehicle:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found"
        )

    damage_images = db.query(DamageImageDB).filter(
        DamageImageDB.vehicle_id == vehicle.id
    ).all()

    return {
        "registration": normalised_registration,
        "images": damage_images
    }
@app.post("/damage-images/{image_id}/analyse")
def analyse_image(
    image_id: int,
    db: Session = Depends(get_db)
):
    damage_image = db.query(DamageImageDB).filter(
        DamageImageDB.id == image_id
    ).first()

    if not damage_image:
        raise HTTPException(
            status_code=404,
            detail="Damage image not found"
        )

    try:
        inspection = analyse_damage_image(
            image_id=image_id,
            db=db
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Damage analysis failed"
        )

    return {
        "message": "Damage analysis completed successfully!",
        "inspection": {
            "id": inspection.id,
            "image_id": inspection.damage_image_id,
            "status": inspection.status,
            "damage_detected": inspection.damage_detected,
            "damage_count": inspection.damage_count,
            "highest_confidence": inspection.highest_confidence,
            "model": {
                "repository": inspection.model_repository,
                "checkpoint": inspection.model_checkpoint,
                "confidence_threshold": (
                    inspection.confidence_threshold
                )
            },
            "detections": [
                {
                    "id": detection.id,
                    "damage_type": detection.damage_type,
                    "confidence": detection.confidence,
                    "bounding_box": {
                        "x1": detection.x1,
                        "y1": detection.y1,
                        "x2": detection.x2,
                        "y2": detection.y2
                    },
                    "segmentation": json.loads(
                        detection.segmentation
                    )
                    if detection.segmentation
                    else []
                }
                for detection in inspection.detections
            ]
        }
    }