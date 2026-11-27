from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import crud, schemas

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("/", response_model=List[schemas.PaymentResponse])
def list_payments(
    work_entry_id: Optional[int] = None,
    employer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return crud.get_payments(db, work_entry_id, employer_id)


@router.post("/", response_model=schemas.PaymentResponse, status_code=201)
def create_payment(payment: schemas.PaymentCreate, db: Session = Depends(get_db)):
    return crud.create_payment(db, payment)


@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_payment(db, payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Deleted successfully"}
