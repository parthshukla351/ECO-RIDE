from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(
    title="EcoRide AI Service",
    description="ML-powered ride matching, pricing, and analytics",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import matching, pricing, demand, carbon, safety

app.include_router(matching.router, prefix="/predict", tags=["Ride Matching"])
app.include_router(pricing.router, prefix="/predict", tags=["Pricing"])
app.include_router(demand.router, prefix="/predict", tags=["Demand"])
app.include_router(carbon.router, prefix="/calculate", tags=["Carbon"])
app.include_router(safety.router, prefix="/score", tags=["Safety"])

@app.get("/")
def root():
    return {
        "service": "EcoRide AI",
        "status": "running",
        "version": "1.0.0",
        "endpoints": [
            "/predict/ride-match",
            "/predict/pricing",
            "/predict/demand",
            "/calculate/carbon",
            "/score/safety"
        ]
    }

@app.get("/health")
def health():
    return {"status": "healthy", "service": "EcoRide AI"}