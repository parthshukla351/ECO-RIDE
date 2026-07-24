from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import math

router = APIRouter()

class PricingRequest(BaseModel):
    distance_km: float
    duration_min: float
    vehicle_type: str = "petrol"
    total_seats: int = 4
    departure_hour: int = 9
    departure_day: int = 1

FUEL_COST = {
    "petrol": 102.0,
    "diesel": 88.0,
    "hybrid": 60.0,
    "electric": 15.0
}

MILEAGE = {
    "petrol": 15.0,
    "diesel": 18.0,
    "hybrid": 22.0,
    "electric": 100.0
}

@router.post("/pricing")
def suggest_price(req: PricingRequest):
    fuel_per_km = FUEL_COST[req.vehicle_type] / MILEAGE[req.vehicle_type]
    fuel_cost = req.distance_km * fuel_per_km
    base_price = fuel_cost / req.total_seats

    # Demand factor based on time
    peak_hours = [7, 8, 9, 17, 18, 19]
    demand_factor = 1.3 if req.departure_hour in peak_hours else 1.0
    
    # Weekend factor
    if req.departure_day in [5, 6]:
        demand_factor *= 1.1

    # Distance factor (slight discount for longer distances)
    distance_factor = 1.0 if req.distance_km < 100 else 0.9

    suggested = base_price * demand_factor * distance_factor
    min_price = max(base_price * 0.8, 30)
    max_price = base_price * 1.5

    return {
        "suggested_price": round(suggested, 2),
        "min_price": round(min_price, 2),
        "max_price": round(max_price, 2),
        "fuel_cost": round(fuel_cost, 2),
        "demand_factor": demand_factor,
        "currency": "INR"
    }