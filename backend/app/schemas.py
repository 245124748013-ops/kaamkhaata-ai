from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime


# Employer Schemas
class EmployerBase(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None


class EmployerCreate(EmployerBase):
    pass


class EmployerUpdate(EmployerBase):
    name: Optional[str] = None


class EmployerResponse(EmployerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Work Entry Schemas
class WorkEntryBase(BaseModel):
    employer_id: Optional[int] = None
    worker_name: str
    work_description: str
    work_date: date
    daily_wage: float = 0.0
    hours_worked: float = 8.0
    wage_type: str = "daily"
    payment_received: float = 0.0
    advance_received: float = 0.0
    notes: Optional[str] = None


class WorkEntryCreate(WorkEntryBase):
    pass


class WorkEntryUpdate(BaseModel):
    employer_id: Optional[int] = None
    worker_name: Optional[str] = None
    work_description: Optional[str] = None
    work_date: Optional[date] = None
    daily_wage: Optional[float] = None
    hours_worked: Optional[float] = None
    wage_type: Optional[str] = None
    payment_received: Optional[float] = None
    advance_received: Optional[float] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class WorkEntryResponse(WorkEntryBase):
    id: int
    total_earned: float
    pending_balance: float
    payment_status: str
    created_at: datetime
    updated_at: datetime
    employer: Optional[EmployerResponse] = None

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentBase(BaseModel):
    work_entry_id: Optional[int] = None
    employer_id: Optional[int] = None
    amount: float
    payment_date: date
    payment_mode: str = "cash"
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Advance Schemas
class AdvanceBase(BaseModel):
    work_entry_id: Optional[int] = None
    employer_id: Optional[int] = None
    worker_name: Optional[str] = None
    amount: float
    advance_date: date
    notes: Optional[str] = None
    is_adjusted: bool = False


class AdvanceCreate(AdvanceBase):
    pass


class AdvanceUpdate(BaseModel):
    amount: Optional[float] = None
    advance_date: Optional[date] = None
    notes: Optional[str] = None
    is_adjusted: Optional[bool] = None


class AdvanceResponse(AdvanceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# Dashboard Stats
class DashboardStats(BaseModel):
    total_earned: float
    total_received: float
    total_pending: float
    total_advances: float
    working_days: int
    this_month_earned: float
    this_month_received: float
    employer_count: int
    recent_entries: List[WorkEntryResponse] = []


# AI Query Schema
class AIQuery(BaseModel):
    question: str
    language: str = "en"


class AIResponse(BaseModel):
    answer: str
    data: Optional[dict] = None
    language: str = "en"
