from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

EMISSION_FACTORS = {
    "petrol": 0.21,
    "diesel": 0.25,
    "hybrid": 0.11,
    "electric": 0.05
}

AVERAGE_CAR = 0.21

class CarbonRequest(BaseModel):
    distance_km: float
    vehicle_type: str = "petrol"
    passengers: int = 1

@router.post("/carbon")
def calculate_carbon(req: CarbonRequest):
    factor = EMISSION_FACTORS.get(req.vehicle_type, EMISSION_FACTORS["petrol"])
    
    total_emission = req.distance_km * factor
    per_passenger = total_emission / (req.passengers + 1)
    
    individual = req.distance_km * AVERAGE_CAR
    saved = max(0, individual - per_passenger)
    
    trees = saved / 21
    eco_points = round(saved * 10)
    
    return {
        "total_emission_kg": round(total_emission, 3),
        "emission_per_passenger_kg": round(per_passenger, 3),
        "carbon_saved_kg": round(saved, 3),
        "trees_equivalent": round(trees, 4),
        "eco_points_earned": eco_points,
        "vehicle_type": req.vehicle_type,
        "distance_km": req.distance_km
    }