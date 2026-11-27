
import os
import random
from datetime import date, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import create_tables
from .routers import (
    work_entries,
    employers,
    payments,
    advances,
    dashboard,
    reports,
    ai,
)

app = FastAPI(
    title="KaamKhaata AI API",
    description="Multilingual work and payment ledger for daily-wage workers",
    version="1.0.0"
)

# CORS configuration
frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")

allowed_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
]

if frontend_url:
    allowed_origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all API routers
app.include_router(dashboard.router)
app.include_router(work_entries.router)
app.include_router(employers.router)
app.include_router(payments.router)
app.include_router(advances.router)
app.include_router(reports.router)
app.include_router(ai.router)


# Demo data generation
def seed_demo_data(db):
    """Seed the database with realistic demo data."""

    from .database import Employer, WorkEntry

    employers_data = [
        {
            "name": "Ramesh Constructions",
            "phone": "9876543210",
            "address": "Hyderabad, Telangana"
        },
        {
            "name": "Suresh Building Works",
            "phone": "9123456789",
            "address": "Secunderabad, Telangana"
        },
        {
            "name": "Priya Textiles",
            "phone": "9988776655",
            "address": "Warangal, Telangana"
        },
        {
            "name": "Kumar Enterprises",
            "phone": "9871234560",
            "address": "Vijayawada, Andhra Pradesh"
        },
    ]

    created_employers = []

    for emp_data in employers_data:
        emp = Employer(**emp_data)
        db.add(emp)
        db.flush()
        created_employers.append(emp)

    work_descriptions = [
        "Mason work - laying bricks and cement",
        "Plumbing work - pipe fitting",
        "Electrical wiring work",
        "Painting - exterior walls",
        "Plastering work",
        "Tile fitting work",
        "Carpentry - door/window fitting",
        "Excavation and foundation work",
        "Roof work - cement and waterproofing",
        "Flooring work",
    ]

    today = date.today()
    worker_name = "Raju Kumar"

    for i in range(60):
        work_date = today - timedelta(days=i)

        if work_date.weekday() == 6:
            continue

        employer = random.choice(created_employers)
        description = random.choice(work_descriptions)
        daily_wage = random.choice([500, 600, 650, 700, 750, 800])

        payment_received = 0
        advance_received = 0

        rand = random.random()

        if rand < 0.4:
            payment_received = daily_wage
        elif rand < 0.65:
            payment_received = daily_wage // 2
        elif rand < 0.75:
            advance_received = random.choice([200, 300, 500])

        pending_balance = max(
            0,
            daily_wage - payment_received - advance_received
        )

        if payment_received >= daily_wage:
            payment_status = "paid"
        elif payment_received > 0 or advance_received > 0:
            payment_status = "partial"
        else:
            payment_status = "pending"

        entry = WorkEntry(
            employer_id=employer.id,
            worker_name=worker_name,
            work_description=description,
            work_date=work_date,
            daily_wage=daily_wage,
            hours_worked=8,
            wage_type="daily",
            total_earned=daily_wage,
            payment_received=payment_received,
            advance_received=advance_received,
            pending_balance=pending_balance,
            payment_status=payment_status,
            notes="[DEMO DATA]"
        )

        db.add(entry)

    db.commit()


# Startup event
@app.on_event("startup")
def startup():
    create_tables()

    from .database import SessionLocal, Employer

    db = SessionLocal()

    try:
        if db.query(Employer).count() == 0:
            seed_demo_data(db)
    finally:
        db.close()


# Root endpoint
@app.get("/")
def root():
    return {
        "message": "KaamKhaata AI API is running",
        "version": "1.0.0"
    }


# Health endpoint
@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "KaamKhaata AI"
    }


# Reset demo data
@app.delete("/api/demo/reset")
def reset_demo_data():
    """Reset and re-seed demo data."""

    from .database import (
        SessionLocal,
        Employer,
        WorkEntry,
        Payment,
        Advance
    )

    db = SessionLocal()

    try:
        db.query(Advance).delete()
        db.query(Payment).delete()
        db.query(WorkEntry).delete()
        db.query(Employer).delete()

        db.commit()

        seed_demo_data(db)

        return {
            "message": "Demo data has been reset successfully"
        }

    finally:
        db.close()
