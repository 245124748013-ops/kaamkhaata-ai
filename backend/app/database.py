
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import sessionmaker, relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{os.path.join(BASE_DIR, 'data', 'kaamkhaata.db')}"
)

# Support PostgreSQL cloud database URLs
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


class Employer(Base):
    __tablename__ = "employers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    work_entries = relationship("WorkEntry", back_populates="employer")


class WorkEntry(Base):
    __tablename__ = "work_entries"
    id = Column(Integer, primary_key=True, index=True)
    employer_id = Column(Integer, ForeignKey("employers.id"), nullable=True)
    worker_name = Column(String(200), nullable=False)
    work_description = Column(Text, nullable=False)
    work_date = Column(Date, nullable=False)
    daily_wage = Column(Float, default=0.0)
    hours_worked = Column(Float, default=8.0)
    wage_type = Column(String(20), default="daily")
    total_earned = Column(Float, default=0.0)
    payment_received = Column(Float, default=0.0)
    advance_received = Column(Float, default=0.0)
    pending_balance = Column(Float, default=0.0)
    payment_status = Column(String(20), default="pending")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employer = relationship("Employer", back_populates="work_entries")
    payments = relationship("Payment", back_populates="work_entry")
    advances = relationship("Advance", back_populates="work_entry")


class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    work_entry_id = Column(Integer, ForeignKey("work_entries.id"), nullable=True)
    employer_id = Column(Integer, ForeignKey("employers.id"), nullable=True)
    amount = Column(Float, nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_mode = Column(String(50), default="cash")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    work_entry = relationship("WorkEntry", back_populates="payments")


class Advance(Base):
    __tablename__ = "advances"
    id = Column(Integer, primary_key=True, index=True)
    work_entry_id = Column(Integer, ForeignKey("work_entries.id"), nullable=True)
    employer_id = Column(Integer, ForeignKey("employers.id"), nullable=True)
    worker_name = Column(String(200), nullable=True)
    amount = Column(Float, nullable=False)
    advance_date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)
    is_adjusted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    work_entry = relationship("WorkEntry", back_populates="advances")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    if DATABASE_URL.startswith("sqlite"):
        os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
    Base.metadata.create_all(bind=engine)
