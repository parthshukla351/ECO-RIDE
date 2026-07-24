from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class DemandRequest(BaseModel):
    origin_city: str
    destination_city: str
    departure_date: str
    departure_hour: int

@router.post("/demand")
def predict_demand(req: DemandRequest):
    hour = req.departure_hour
    
    try:
        date = datetime.strptime(req.departure_date, "%Y-%m-%d")
        day_of_week = date.weekday()
    except:
        day_of_week = 0

    # Peak hours logic
    morning_peak = 7 <= hour <= 9
    evening_peak = 17 <= hour <= 20
    weekend = day_of_week >= 5

    score = 50.0

    if morning_peak or evening_peak:
        score += 30
    elif 10 <= hour <= 16:
        score += 10
    else:
        score -= 10

    if weekend:
        score += 20

    score = max(0, min(100, score))

    if score >= 80:
        level = "Very High"
        recommendation = "Book immediately! High demand expected."
    elif score >= 60:
        level = "High"
        recommendation = "Good time to travel. Book soon."
    elif score >= 40:
        level = "Moderate"
        recommendation = "Normal demand. Good availability."
    else:
        level = "Low"
        recommendation = "Low demand. Good deals available!"

    return {
        "demand_score": round(score, 1),
        "demand_level": level,
        "recommendation": recommendation,
        "is_peak_hour": morning_peak or evening_peak,
        "is_weekend": weekend
    }