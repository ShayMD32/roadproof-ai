from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
class Vehicle(BaseModel):
    registration: str
    make: str
    model: str
    year: int


@app.get("/")
def home():
    return {
        "message": "Welcome to RoadProof AI! 🚗 "
    }
@app.get("/health")
def health():
    return {
        "status": "Server Running",
        "version": "1.0"
    }

@app.post("/vehicle")
def create_vehicle(vehicle: Vehicle):
    return {
        "message": "Vehicle received successfully!",
        "vehicle": vehicle
    }