from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import date, datetime, timedelta
from typing import Optional, List
from . import database as db_models
from .schemas import WorkEntryCreate, WorkEntryUpdate, EmployerCreate, EmployerUpdate, PaymentCreate, AdvanceCreate, AdvanceUpdate


def calculate_work_entry_fields(entry_data: dict) -> dict:
    wage_type = entry_data.get("wage_type", "daily")
    daily_wage = entry_data.get("daily_wage", 0.0)
    hours_worked = entry_data.get("hours_worked", 8.0)

    if wage_type == "hourly":
        total_earned = daily_wage * hours_worked
    else:
        total_earned = daily_wage

    payment_received = entry_data.get("payment_received", 0.0)
    advance_received = entry_data.get("advance_received", 0.0)
    pending_balance = total_earned - payment_received - advance_received

    if pending_balance <= 0:
        payment_status = "paid"
    elif payment_received > 0 or advance_received > 0:
        payment_status = "partial"
    else:
        payment_status = "pending"

    entry_data["total_earned"] = total_earned
    entry_data["pending_balance"] = max(0, pending_balance)
    entry_data["payment_status"] = payment_status
    return entry_data


# Employer CRUD
def get_employers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(db_models.Employer).offset(skip).limit(limit).all()


def get_employer(db: Session, employer_id: int):
    return db.query(db_models.Employer).filter(db_models.Employer.id == employer_id).first()


def create_employer(db: Session, employer: EmployerCreate):
    db_employer = db_models.Employer(**employer.model_dump())
    db.add(db_employer)
    db.commit()
    db.refresh(db_employer)
    return db_employer


def update_employer(db: Session, employer_id: int, employer: EmployerUpdate):
    db_employer = db.query(db_models.Employer).filter(db_models.Employer.id == employer_id).first()
    if db_employer:
        update_data = employer.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_employer, key, value)
        db.commit()
        db.refresh(db_employer)
    return db_employer


def delete_employer(db: Session, employer_id: int):
    db_employer = db.query(db_models.Employer).filter(db_models.Employer.id == employer_id).first()
    if db_employer:
        db.delete(db_employer)
        db.commit()
    return db_employer


# Work Entry CRUD
def get_work_entries(db: Session, skip: int = 0, limit: int = 100, employer_id: Optional[int] = None,
                      search: Optional[str] = None, start_date: Optional[date] = None,
                      end_date: Optional[date] = None, payment_status: Optional[str] = None):
    query = db.query(db_models.WorkEntry)
    if employer_id:
        query = query.filter(db_models.WorkEntry.employer_id == employer_id)
    if search:
        query = query.filter(
            (db_models.WorkEntry.worker_name.ilike(f"%{search}%")) |
            (db_models.WorkEntry.work_description.ilike(f"%{search}%"))
        )
    if start_date:
        query = query.filter(db_models.WorkEntry.work_date >= start_date)
    if end_date:
        query = query.filter(db_models.WorkEntry.work_date <= end_date)
    if payment_status:
        query = query.filter(db_models.WorkEntry.payment_status == payment_status)
    return query.order_by(db_models.WorkEntry.work_date.desc()).offset(skip).limit(limit).all()


def get_work_entry(db: Session, entry_id: int):
    return db.query(db_models.WorkEntry).filter(db_models.WorkEntry.id == entry_id).first()


def create_work_entry(db: Session, entry: WorkEntryCreate):
    entry_data = entry.model_dump()
    entry_data = calculate_work_entry_fields(entry_data)
    db_entry = db_models.WorkEntry(**entry_data)
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry


def update_work_entry(db: Session, entry_id: int, entry: WorkEntryUpdate):
    db_entry = db.query(db_models.WorkEntry).filter(db_models.WorkEntry.id == entry_id).first()
    if db_entry:
        update_data = entry.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_entry, key, value)
        # Recalculate
        entry_dict = {
            "wage_type": db_entry.wage_type,
            "daily_wage": db_entry.daily_wage,
            "hours_worked": db_entry.hours_worked,
            "payment_received": db_entry.payment_received,
            "advance_received": db_entry.advance_received,
        }
        entry_dict = calculate_work_entry_fields(entry_dict)
        db_entry.total_earned = entry_dict["total_earned"]
        db_entry.pending_balance = entry_dict["pending_balance"]
        db_entry.payment_status = entry_dict["payment_status"]
        db_entry.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_entry)
    return db_entry


def delete_work_entry(db: Session, entry_id: int):
    db_entry = db.query(db_models.WorkEntry).filter(db_models.WorkEntry.id == entry_id).first()
    if db_entry:
        db.delete(db_entry)
        db.commit()
    return db_entry


# Payment CRUD
def get_payments(db: Session, work_entry_id: Optional[int] = None, employer_id: Optional[int] = None):
    query = db.query(db_models.Payment)
    if work_entry_id:
        query = query.filter(db_models.Payment.work_entry_id == work_entry_id)
    if employer_id:
        query = query.filter(db_models.Payment.employer_id == employer_id)
    return query.order_by(db_models.Payment.payment_date.desc()).all()


def create_payment(db: Session, payment: PaymentCreate):
    db_payment = db_models.Payment(**payment.model_dump())
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    # Update work entry payment status if linked
    if payment.work_entry_id:
        entry = db.query(db_models.WorkEntry).filter(db_models.WorkEntry.id == payment.work_entry_id).first()
        if entry:
            entry.payment_received += payment.amount
            entry_dict = {
                "wage_type": entry.wage_type,
                "daily_wage": entry.daily_wage,
                "hours_worked": entry.hours_worked,
                "payment_received": entry.payment_received,
                "advance_received": entry.advance_received,
            }
            entry_dict = calculate_work_entry_fields(entry_dict)
            entry.total_earned = entry_dict["total_earned"]
            entry.pending_balance = entry_dict["pending_balance"]
            entry.payment_status = entry_dict["payment_status"]
            db.commit()
    return db_payment


def delete_payment(db: Session, payment_id: int):
    db_payment = db.query(db_models.Payment).filter(db_models.Payment.id == payment_id).first()
    if db_payment:
        db.delete(db_payment)
        db.commit()
    return db_payment


# Advance CRUD
def get_advances(db: Session, employer_id: Optional[int] = None, work_entry_id: Optional[int] = None):
    query = db.query(db_models.Advance)
    if employer_id:
        query = query.filter(db_models.Advance.employer_id == employer_id)
    if work_entry_id:
        query = query.filter(db_models.Advance.work_entry_id == work_entry_id)
    return query.order_by(db_models.Advance.advance_date.desc()).all()


def create_advance(db: Session, advance: AdvanceCreate):
    db_advance = db_models.Advance(**advance.model_dump())
    db.add(db_advance)
    db.commit()
    db.refresh(db_advance)
    return db_advance


def update_advance(db: Session, advance_id: int, advance: AdvanceUpdate):
    db_advance = db.query(db_models.Advance).filter(db_models.Advance.id == advance_id).first()
    if db_advance:
        update_data = advance.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_advance, key, value)
        db.commit()
        db.refresh(db_advance)
    return db_advance


def delete_advance(db: Session, advance_id: int):
    db_advance = db.query(db_models.Advance).filter(db_models.Advance.id == advance_id).first()
    if db_advance:
        db.delete(db_advance)
        db.commit()
    return db_advance


# Dashboard Stats
def get_dashboard_stats(db: Session):
    now = datetime.now()
    current_month = now.month
    current_year = now.year

    total_earned = db.query(func.sum(db_models.WorkEntry.total_earned)).scalar() or 0.0
    total_received = db.query(func.sum(db_models.WorkEntry.payment_received)).scalar() or 0.0
    total_pending = db.query(func.sum(db_models.WorkEntry.pending_balance)).scalar() or 0.0
    total_advances = db.query(func.sum(db_models.WorkEntry.advance_received)).scalar() or 0.0
    working_days = db.query(func.count(db_models.WorkEntry.id)).scalar() or 0
    employer_count = db.query(func.count(db_models.Employer.id)).scalar() or 0

    this_month_entries = db.query(db_models.WorkEntry).filter(
        extract('month', db_models.WorkEntry.work_date) == current_month,
        extract('year', db_models.WorkEntry.work_date) == current_year
    ).all()

    this_month_earned = sum(e.total_earned for e in this_month_entries)
    this_month_received = sum(e.payment_received for e in this_month_entries)

    recent_entries = db.query(db_models.WorkEntry).order_by(
        db_models.WorkEntry.work_date.desc()
    ).limit(5).all()

    return {
        "total_earned": round(total_earned, 2),
        "total_received": round(total_received, 2),
        "total_pending": round(total_pending, 2),
        "total_advances": round(total_advances, 2),
        "working_days": working_days,
        "this_month_earned": round(this_month_earned, 2),
        "this_month_received": round(this_month_received, 2),
        "employer_count": employer_count,
        "recent_entries": recent_entries
    }
