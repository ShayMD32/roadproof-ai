from sqlalchemy.orm import Session
from fastapi import Depends

from app.database import SessionLocal, engine, Base
from app.models import VehicleDB

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

Base.metadata.create_all(bind=engine)
def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

app = FastAPI()



class Vehicle(BaseModel):
    registration: str
    make: str
    model: str
    year: int


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
def get_vehicles(db: Session = Depends(get_db)):
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

    new_registration = normalise_registration(updated_vehicle.registration)

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