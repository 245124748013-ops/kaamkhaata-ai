from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/api/employers", tags=["employers"])


@router.get("/", response_model=List[schemas.EmployerResponse])
def list_employers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_employers(db, skip, limit)


@router.post("/", response_model=schemas.EmployerResponse, status_code=201)
def create_employer(employer: schemas.EmployerCreate, db: Session = Depends(get_db)):
    return crud.create_employer(db, employer)


@router.get("/{employer_id}", response_model=schemas.EmployerResponse)
def get_employer(employer_id: int, db: Session = Depends(get_db)):
    emp = crud.get_employer(db, employer_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employer not found")
    return emp


@router.put("/{employer_id}", response_model=schemas.EmployerResponse)
def update_employer(employer_id: int, employer: schemas.EmployerUpdate, db: Session = Depends(get_db)):
    updated = crud.update_employer(db, employer_id, employer)
    if not updated:
        raise HTTPException(status_code=404, detail="Employer not found")
    return updated


@router.delete("/{employer_id}")
def delete_employer(employer_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_employer(db, employer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Employer not found")
    return {"message": "Deleted successfully"}
