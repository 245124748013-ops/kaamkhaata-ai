from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta
import csv
import io
from .. import database as db_models


def get_monthly_report(db: Session, year: int, month: int) -> dict:
    entries = db.query(db_models.WorkEntry).filter(
        extract('year', db_models.WorkEntry.work_date) == year,
        extract('month', db_models.WorkEntry.work_date) == month
    ).order_by(db_models.WorkEntry.work_date).all()

    total_earned = sum(e.total_earned for e in entries)
    total_received = sum(e.payment_received for e in entries)
    total_advances = sum(e.advance_received for e in entries)
    total_pending = sum(e.pending_balance for e in entries)

    employer_summary = {}
    for e in entries:
        emp_name = e.employer.name if e.employer else "Unknown"
        if emp_name not in employer_summary:
            employer_summary[emp_name] = {
                "earned": 0, "received": 0, "advances": 0,
                "pending": 0, "days": 0
            }
        employer_summary[emp_name]["earned"] += e.total_earned
        employer_summary[emp_name]["received"] += e.payment_received
        employer_summary[emp_name]["advances"] += e.advance_received
        employer_summary[emp_name]["pending"] += e.pending_balance
        employer_summary[emp_name]["days"] += 1

    return {
        "year": year,
        "month": month,
        "entries": entries,
        "total_earned": round(total_earned, 2),
        "total_received": round(total_received, 2),
        "total_advances": round(total_advances, 2),
        "total_pending": round(total_pending, 2),
        "working_days": len(entries),
        "employer_summary": employer_summary
    }


def get_weekly_report(db: Session, week_start: date) -> dict:
    week_end = week_start + timedelta(days=6)
    entries = db.query(db_models.WorkEntry).filter(
        db_models.WorkEntry.work_date >= week_start,
        db_models.WorkEntry.work_date <= week_end
    ).order_by(db_models.WorkEntry.work_date).all()

    total_earned = sum(e.total_earned for e in entries)
    total_received = sum(e.payment_received for e in entries)
    total_pending = sum(e.pending_balance for e in entries)

    return {
        "week_start": week_start,
        "week_end": week_end,
        "entries": entries,
        "total_earned": round(total_earned, 2),
        "total_received": round(total_received, 2),
        "total_pending": round(total_pending, 2),
        "working_days": len(entries)
    }


def export_to_csv(db: Session, start_date=None, end_date=None) -> str:
    query = db.query(db_models.WorkEntry)
    if start_date:
        query = query.filter(db_models.WorkEntry.work_date >= start_date)
    if end_date:
        query = query.filter(db_models.WorkEntry.work_date <= end_date)
    entries = query.order_by(db_models.WorkEntry.work_date.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Date", "Worker Name", "Employer", "Work Description",
        "Wage Type", "Daily Wage", "Hours Worked", "Total Earned",
        "Payment Received", "Advance Received", "Pending Balance",
        "Payment Status", "Notes"
    ])

    for e in entries:
        writer.writerow([
            e.work_date, e.worker_name,
            e.employer.name if e.employer else "",
            e.work_description, e.wage_type, e.daily_wage,
            e.hours_worked, e.total_earned, e.payment_received,
            e.advance_received, e.pending_balance, e.payment_status,
            e.notes or ""
        ])

    return output.getvalue()


def get_employer_report(db: Session) -> list:
    employers = db.query(db_models.Employer).all()
    result = []
    for emp in employers:
        entries = db.query(db_models.WorkEntry).filter(
            db_models.WorkEntry.employer_id == emp.id
        ).all()
        total_earned = sum(e.total_earned for e in entries)
        total_received = sum(e.payment_received for e in entries)
        total_pending = sum(e.pending_balance for e in entries)
        total_advances = sum(e.advance_received for e in entries)
        result.append({
            "employer_id": emp.id,
            "employer_name": emp.name,
            "total_earned": round(total_earned, 2),
            "total_received": round(total_received, 2),
            "total_pending": round(total_pending, 2),
            "total_advances": round(total_advances, 2),
            "working_days": len(entries)
        })
    return result


def get_monthly_chart_data(db: Session, year: int) -> list:
    result = []
    for month in range(1, 13):
        entries = db.query(db_models.WorkEntry).filter(
            extract('year', db_models.WorkEntry.work_date) == year,
            extract('month', db_models.WorkEntry.work_date) == month
        ).all()
        earned = sum(e.total_earned for e in entries)
        received = sum(e.payment_received for e in entries)
        result.append({
            "month": month,
            "earned": round(earned, 2),
            "received": round(received, 2),
            "days": len(entries)
        })
    return result
