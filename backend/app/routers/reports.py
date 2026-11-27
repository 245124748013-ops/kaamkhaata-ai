from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from ..database import get_db
from ..services import report_service

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/monthly")
def monthly_report(
    year: int = Query(default=None),
    month: int = Query(default=None),
    db: Session = Depends(get_db)
):
    now = datetime.now()
    y = year or now.year
    m = month or now.month
    report = report_service.get_monthly_report(db, y, m)
    # Convert entries to serializable format
    entries_data = []
    for e in report["entries"]:
        entries_data.append({
            "id": e.id,
            "work_date": str(e.work_date),
            "worker_name": e.worker_name,
            "employer": e.employer.name if e.employer else None,
            "work_description": e.work_description,
            "total_earned": e.total_earned,
            "payment_received": e.payment_received,
            "pending_balance": e.pending_balance,
            "payment_status": e.payment_status,
        })
    return {
        "year": report["year"],
        "month": report["month"],
        "entries": entries_data,
        "total_earned": report["total_earned"],
        "total_received": report["total_received"],
        "total_advances": report["total_advances"],
        "total_pending": report["total_pending"],
        "working_days": report["working_days"],
        "employer_summary": report["employer_summary"]
    }


@router.get("/weekly")
def weekly_report(week_start: Optional[str] = None, db: Session = Depends(get_db)):
    if week_start:
        ws = date.fromisoformat(week_start)
    else:
        today = date.today()
        ws = today - __import__('datetime').timedelta(days=today.weekday())
    report = report_service.get_weekly_report(db, ws)
    entries_data = []
    for e in report["entries"]:
        entries_data.append({
            "id": e.id,
            "work_date": str(e.work_date),
            "worker_name": e.worker_name,
            "employer": e.employer.name if e.employer else None,
            "work_description": e.work_description,
            "total_earned": e.total_earned,
            "payment_received": e.payment_received,
            "pending_balance": e.pending_balance,
            "payment_status": e.payment_status,
        })
    return {
        "week_start": str(report["week_start"]),
        "week_end": str(report["week_end"]),
        "entries": entries_data,
        "total_earned": report["total_earned"],
        "total_received": report["total_received"],
        "total_pending": report["total_pending"],
        "working_days": report["working_days"]
    }


@router.get("/export-csv")
def export_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    sd = date.fromisoformat(start_date) if start_date else None
    ed = date.fromisoformat(end_date) if end_date else None
    csv_data = report_service.export_to_csv(db, sd, ed)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=kaamkhaata_report.csv"}
    )


@router.get("/employer-summary")
def employer_summary(db: Session = Depends(get_db)):
    return report_service.get_employer_report(db)


@router.get("/chart-data")
def chart_data(year: Optional[int] = None, db: Session = Depends(get_db)):
    y = year or datetime.now().year
    return report_service.get_monthly_chart_data(db, y)
