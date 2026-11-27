from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/api/advances", tags=["advances"])


@router.get("/", response_model=List[schemas.AdvanceResponse])
def list_advances(
    employer_id: Optional[int] = None,
    work_entry_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return crud.get_advances(db, employer_id, work_entry_id)


@router.post("/", response_model=schemas.AdvanceResponse, status_code=201)
def create_advance(advance: schemas.AdvanceCreate, db: Session = Depends(get_db)):
    return crud.create_advance(db, advance)


@router.put("/{advance_id}", response_model=schemas.AdvanceResponse)
def update_advance(advance_id: int, advance: schemas.AdvanceUpdate, db: Session = Depends(get_db)):
    updated = crud.update_advance(db, advance_id, advance)
    if not updated:
        raise HTTPException(status_code=404, detail="Advance not found")
    return updated


@router.delete("/{advance_id}")
def delete_advance(advance_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_advance(db, advance_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Advance not found")
    return {"message": "Deleted successfully"}
