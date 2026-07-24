from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import math

router = APIRouter()

class RideOption(BaseModel):
    ride_id: str
    driver_rating: float
    distance_km: float
    price_per_seat: float
    departure_hour: int
    vehicle_type: str
    available_seats: int
    carbon_saved: float
    cancellation_rate: float = 0.0

class MatchRequest(BaseModel):
    passenger_preferred_time: int
    passenger_budget: float
    passenger_eco_preference: bool = True
    ride_options: List[RideOption]

def score_ride(ride: RideOption, req: MatchRequest) -> float:
    score = 0.0

    # Rating (30%)
    score += (ride.driver_rating / 5.0) * 30

    # Price match (25%)
    if ride.price_per_seat <= req.passenger_budget:
        price_score = (1 - ride.price_per_seat / req.passenger_budget) * 25
        score += price_score

    # Time match (20%)
    time_diff = abs(ride.departure_hour - req.passenger_preferred_time)
    if time_diff == 0:
        score += 20
    elif time_diff <= 1:
        score += 15
    elif time_diff <= 2:
        score += 10

    # Eco preference (15%)
    if req.passenger_eco_preference:
        eco_score = (ride.carbon_saved / 10.0) * 15
        eco_score += {"electric": 15, "hybrid": 10, "petrol": 5, "diesel": 0}.get(ride.vehicle_type, 5)
        score += min(15, eco_score)

    # Reliability (10%)
    reliability = (1 - ride.cancellation_rate) * 10
    score += reliability

    return round(score, 2)

@router.post("/ride-match")
def match_rides(req: MatchRequest):
    scored = []
    for ride in req.ride_options:
        s = score_ride(ride, req)
        scored.append({
            "ride_id": ride.ride_id,
            "match_score": s,
            "match_percentage": round((s / 100) * 100, 1),
            "recommendation": "Best Match" if s >= 75 else "Good Match" if s >= 50 else "Available"
        })

    scored.sort(key=lambda x: x["match_score"], reverse=True)

    return {
        "matches": scored,
        "top_match": scored[0] if scored else None,
        "total_options": len(scored)
    }