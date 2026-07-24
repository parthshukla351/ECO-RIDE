from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class SafetyRequest(BaseModel):
    average_rating: float = 0
    total_ratings: int = 0
    cancellation_rate: float = 0
    completed_rides: int = 0
    is_verified: bool = False
    license_verified: bool = False

@router.post("/safety")
def calculate_safety(req: SafetyRequest):
    score = 100.0
    reasons = []

    # Rating penalty
    if req.total_ratings > 5 and req.average_rating < 3.5:
        penalty = (3.5 - req.average_rating) * 10
        score -= penalty
        reasons.append(f"Low rating ({req.average_rating}): -{penalty:.1f}")

    # Cancellation penalty
    if req.cancellation_rate > 0.3:
        penalty = min(30, (req.cancellation_rate - 0.3) * 50)
        score -= penalty
        reasons.append(f"High cancellations: -{penalty:.1f}")

    # Bonuses
    if req.completed_rides >= 50:
        score = min(100, score + 5)
    if req.completed_rides >= 100:
        score = min(100, score + 5)
    if req.is_verified:
        score = min(100, score + 5)
    if req.license_verified:
        score = min(100, score + 5)

    # New user default
    if req.completed_rides == 0:
        score = 75
        reasons = ["New user - building trust score"]

    score = max(0, round(score))

    if score >= 90:
        level = "Excellent"
        color = "green"
    elif score >= 75:
        level = "Good"
        color = "blue"
    elif score >= 60:
        level = "Average"
        color = "yellow"
    elif score >= 40:
        level = "Poor"
        color = "orange"
    else:
        level = "Risky"
        color = "red"

    return {
        "safety_score": score,
        "level": level,
        "color": color,
        "reasons": reasons
    }
