from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

vehicles = []


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
def create_vehicle(vehicle: Vehicle):
    for existing_vehicle in vehicles:
        if normalise_registration(existing_vehicle.registration) == normalise_registration(vehicle.registration):
            raise HTTPException(
                status_code=409,
                detail="Vehicle already exists"
            )

    vehicles.append(vehicle)

    return {
        "message": "Vehicle received successfully!",
        "vehicle": vehicle
    }


@app.get("/vehicles")
def get_vehicles():
    return vehicles


@app.get("/vehicles/{registration}")
def get_vehicle(registration: str):
    for vehicle in vehicles:
        if normalise_registration(vehicle.registration) == normalise_registration(registration):
            return vehicle

    raise HTTPException(
        status_code=404,
        detail="Vehicle not found"
    )


@app.put("/vehicles/{registration}")
def update_vehicle(registration: str, updated_vehicle: Vehicle):
    for index, vehicle in enumerate(vehicles):
        if normalise_registration(vehicle.registration) == normalise_registration(registration):
            vehicles[index] = updated_vehicle

            return {
                "message": "Vehicle updated successfully!",
                "vehicle": updated_vehicle
            }

    raise HTTPException(
        status_code=404,
        detail="Vehicle not found"
    )


@app.delete("/vehicles/{registration}")
def delete_vehicle(registration: str):
    for index, vehicle in enumerate(vehicles):
        if normalise_registration(vehicle.registration) == normalise_registration(registration):
            deleted_vehicle = vehicles.pop(index)

            return {
                "message": "Vehicle deleted successfully!",
                "vehicle": deleted_vehicle
            }

    raise HTTPException(
        status_code=404,
        detail="Vehicle not found"
    )