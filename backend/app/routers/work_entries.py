from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/api/work-entries", tags=["work-entries"])


@router.get("/", response_model=List[schemas.WorkEntryResponse])
def list_work_entries(
    skip: int = 0, limit: int = 100,
    employer_id: Optional[int] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from datetime import date
    sd = date.fromisoformat(start_date) if start_date else None
    ed = date.fromisoformat(end_date) if end_date else None
    return crud.get_work_entries(db, skip, limit, employer_id, search, sd, ed, payment_status)


@router.post("/", response_model=schemas.WorkEntryResponse, status_code=201)
def create_work_entry(entry: schemas.WorkEntryCreate, db: Session = Depends(get_db)):
    return crud.create_work_entry(db, entry)


@router.get("/{entry_id}", response_model=schemas.WorkEntryResponse)
def get_work_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = crud.get_work_entry(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Work entry not found")
    return entry


@router.put("/{entry_id}", response_model=schemas.WorkEntryResponse)
def update_work_entry(entry_id: int, entry: schemas.WorkEntryUpdate, db: Session = Depends(get_db)):
    updated = crud.update_work_entry(db, entry_id, entry)
    if not updated:
        raise HTTPException(status_code=404, detail="Work entry not found")
    return updated


@router.delete("/{entry_id}")
def delete_work_entry(entry_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_work_entry(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Work entry not found")
    return {"message": "Deleted successfully"}
