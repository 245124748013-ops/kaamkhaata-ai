from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, date, timedelta
from typing import Optional
import re


def parse_question_intent(question: str) -> dict:
    """Parse the user's question to determine intent and extract parameters."""
    q = question.lower().strip()

    intents = {
        "earnings_month": any(w in q for w in ["earn", "income", "kamai", "kamaya", "sabad", "mahine", "this month", "is mahine", "ee nela"]),
        "pending": any(w in q for w in ["pending", "baaki", "udhar", "due", "unpaid", "baki"]),
        "advance": any(w in q for w in ["advance", "peshgi", "advancu"]),
        "employer": any(w in q for w in ["employer", "malik", "owner", "boss", "thekedar", "yajamani"]),
        "week": any(w in q for w in ["week", "hafte", "vaaram", "last week", "this week"]),
        "received": any(w in q for w in ["received", "mila", "paya", "milaya", "andukun"]),
        "total": any(w in q for w in ["total", "kul", "motu", "summary", "sab"]),
        "who_owes": any(w in q for w in ["who", "kaun", "who owes", "pending employer"]),
        "last_work": any(w in q for w in ["last", "recent", "aakhri", "latest", "chaduvvu"]),
        "month": "month" in q or "mahine" in q or "nela" in q,
    }

    # Detect time period
    time_period = "all"
    if "this month" in q or "is mahine" in q or "ee nela" in q:
        time_period = "this_month"
    elif "last month" in q:
        time_period = "last_month"
    elif "this week" in q or "is hafte" in q:
        time_period = "this_week"
    elif "last week" in q or "pichle hafte" in q:
        time_period = "last_week"
    elif "today" in q or "aaj" in q:
        time_period = "today"

    return {"intents": intents, "time_period": time_period, "original": question}


def get_date_range(time_period: str):
    today = date.today()
    if time_period == "today":
        return today, today
    elif time_period == "this_week":
        start = today - timedelta(days=today.weekday())
        return start, today
    elif time_period == "last_week":
        start = today - timedelta(days=today.weekday() + 7)
        end = start + timedelta(days=6)
        return start, end
    elif time_period == "this_month":
        start = today.replace(day=1)
        return start, today
    elif time_period == "last_month":
        first_this = today.replace(day=1)
        last_last = first_this - timedelta(days=1)
        start = last_last.replace(day=1)
        return start, last_last
    else:
        return None, None


def answer_question(db: Session, question: str, language: str = "en") -> dict:
    """Generate a database-backed answer to the user's question."""
    from .. import database as db_models

    parsed = parse_question_intent(question)
    intents = parsed["intents"]
    time_period = parsed["time_period"]

    start_date, end_date = get_date_range(time_period)

    # Query work entries for the period
    query = db.query(db_models.WorkEntry)
    if start_date:
        query = query.filter(db_models.WorkEntry.work_date >= start_date)
    if end_date:
        query = query.filter(db_models.WorkEntry.work_date <= end_date)

    entries = query.order_by(db_models.WorkEntry.work_date.desc()).all()

    total_earned = sum(e.total_earned for e in entries)
    total_received = sum(e.payment_received for e in entries)
    total_advances = sum(e.advance_received for e in entries)
    total_pending = sum(e.pending_balance for e in entries)
    working_days = len(entries)

    answer = ""
    data = {}

    period_label = {
        "today": {"en": "today", "hi": "आज", "te": "ఈరోజు"},
        "this_week": {"en": "this week", "hi": "इस हफ्ते", "te": "ఈ వారం"},
        "last_week": {"en": "last week", "hi": "पिछले हफ्ते", "te": "గత వారం"},
        "this_month": {"en": "this month", "hi": "इस महीने", "te": "ఈ నెల"},
        "last_month": {"en": "last month", "hi": "पिछले महीने", "te": "గత నెల"},
        "all": {"en": "overall", "hi": "कुल मिलाकर", "te": "మొత్తం"},
    }.get(time_period, {}).get(language, "in this period")

    if working_days == 0 and time_period != "all":
        if language == "hi":
            answer = f"{period_label} कोई काम का रिकॉर्ड नहीं मिला।"
        elif language == "te":
            answer = f"{period_label} ఏ పని రికార్డు కనుగొనబడలేదు."
        else:
            answer = f"No work records found for {period_label}."

        # Fall back to overall stats
        all_entries = db.query(db_models.WorkEntry).all()
        if all_entries:
            total_overall = sum(e.total_earned for e in all_entries)
            if language == "hi":
                answer += f" कुल कमाई: ₹{total_overall:,.0f}"
            elif language == "te":
                answer += f" మొత్తం సంపాదన: ₹{total_overall:,.0f}"
            else:
                answer += f" Your overall total earned is ₹{total_overall:,.0f}."

        return {"answer": answer, "data": {}, "language": language}

    if intents["who_owes"] or intents["pending"]:
        pending_entries = [e for e in entries if e.pending_balance > 0]
        # Employer-wise pending
        employer_pending = {}
        for e in pending_entries:
            emp_name = e.employer.name if e.employer else "Unknown Employer"
            employer_pending[emp_name] = employer_pending.get(emp_name, 0) + e.pending_balance

        if employer_pending:
            if language == "hi":
                answer = f"💰 {period_label} बकाया भुगतान:\n\n"
                for emp, amt in employer_pending.items():
                    answer += f"• {emp}: ₹{amt:,.0f} बाकी\n"
                answer += f"\nकुल बकाया: ₹{total_pending:,.0f}"
            elif language == "te":
                answer = f"💰 {period_label} పెండింగ్ చెల్లింపులు:\n\n"
                for emp, amt in employer_pending.items():
                    answer += f"• {emp}: ₹{amt:,.0f} బాకీ\n"
                answer += f"\nమొత్తం బాకీ: ₹{total_pending:,.0f}"
            else:
                answer = f"💰 Pending payments {period_label}:\n\n"
                for emp, amt in employer_pending.items():
                    answer += f"• {emp}: ₹{amt:,.0f} pending\n"
                answer += f"\nTotal pending: ₹{total_pending:,.0f}"
        else:
            if language == "hi":
                answer = f"✅ {period_label} सभी भुगतान प्राप्त हो गए हैं! कोई बकाया नहीं।"
            elif language == "te":
                answer = f"✅ {period_label} అన్ని చెల్లింపులు అందాయి! ఎటువంటి బాకీ లేదు."
            else:
                answer = f"✅ All payments received {period_label}! No pending dues."
        data = {"pending_total": total_pending, "employer_pending": employer_pending}

    elif intents["advance"]:
        if language == "hi":
            answer = f"📋 {period_label} एडवांस की जानकारी:\n\nकुल एडवांस: ₹{total_advances:,.0f}\nकाम के दिन: {working_days}"
        elif language == "te":
            answer = f"📋 {period_label} అడ్వాన్స్ వివరాలు:\n\nమొత్తం అడ్వాన్స్: ₹{total_advances:,.0f}\nపని రోజులు: {working_days}"
        else:
            answer = f"📋 Advance details {period_label}:\n\nTotal advances received: ₹{total_advances:,.0f}\nWorking days: {working_days}"
        data = {"total_advances": total_advances}

    elif intents["received"]:
        if language == "hi":
            answer = f"💵 {period_label} प्राप्त भुगतान:\n\nकुल प्राप्त: ₹{total_received:,.0f}\nएडवांस: ₹{total_advances:,.0f}\nबकाया: ₹{total_pending:,.0f}"
        elif language == "te":
            answer = f"💵 {period_label} అందిన చెల్లింపులు:\n\nమొత్తం అందినది: ₹{total_received:,.0f}\nఅడ్వాన్స్: ₹{total_advances:,.0f}\nబాకీ: ₹{total_pending:,.0f}"
        else:
            answer = f"💵 Payment received {period_label}:\n\nTotal received: ₹{total_received:,.0f}\nAdvances: ₹{total_advances:,.0f}\nStill pending: ₹{total_pending:,.0f}"
        data = {"received": total_received, "advances": total_advances}

    elif intents["last_work"] and not intents["week"]:
        recent = db.query(db_models.WorkEntry).order_by(db_models.WorkEntry.work_date.desc()).first()
        if recent:
            emp_name = recent.employer.name if recent.employer else "N/A"
            if language == "hi":
                answer = f"📅 आखिरी काम का रिकॉर्ड:\n\nतारीख: {recent.work_date}\nकाम: {recent.work_description}\nमालिक: {emp_name}\nकमाई: ₹{recent.total_earned:,.0f}\nस्थिति: {recent.payment_status}"
            elif language == "te":
                answer = f"📅 చివరి పని రికార్డు:\n\nతేదీ: {recent.work_date}\nపని: {recent.work_description}\nయజమాని: {emp_name}\nసంపాదన: ₹{recent.total_earned:,.0f}\nస్థితి: {recent.payment_status}"
            else:
                answer = f"📅 Your last work record:\n\nDate: {recent.work_date}\nWork: {recent.work_description}\nEmployer: {emp_name}\nEarned: ₹{recent.total_earned:,.0f}\nStatus: {recent.payment_status}"
        else:
            if language == "hi":
                answer = "कोई काम का रिकॉर्ड नहीं मिला।"
            elif language == "te":
                answer = "ఏ పని రికార్డు కనుగొనబడలేదు."
            else:
                answer = "No work records found yet."
        data = {}

    else:
        # Default: earnings summary
        if language == "hi":
            answer = (
                f"📊 {period_label} कमाई की सारांश:\n\n"
                f"कुल कमाई: ₹{total_earned:,.0f}\n"
                f"प्राप्त हुआ: ₹{total_received:,.0f}\n"
                f"एडवांस: ₹{total_advances:,.0f}\n"
                f"बकाया: ₹{total_pending:,.0f}\n"
                f"काम के दिन: {working_days}"
            )
        elif language == "te":
            answer = (
                f"📊 {period_label} సంపాదన సారాంశం:\n\n"
                f"మొత్తం సంపాదన: ₹{total_earned:,.0f}\n"
                f"అందినది: ₹{total_received:,.0f}\n"
                f"అడ్వాన్స్: ₹{total_advances:,.0f}\n"
                f"బాకీ: ₹{total_pending:,.0f}\n"
                f"పని రోజులు: {working_days}"
            )
        else:
            answer = (
                f"📊 Earnings summary {period_label}:\n\n"
                f"Total earned: ₹{total_earned:,.0f}\n"
                f"Received: ₹{total_received:,.0f}\n"
                f"Advances: ₹{total_advances:,.0f}\n"
                f"Pending: ₹{total_pending:,.0f}\n"
                f"Working days: {working_days}"
            )
        data = {
            "total_earned": total_earned,
            "total_received": total_received,
            "total_advances": total_advances,
            "total_pending": total_pending,
            "working_days": working_days
        }

    return {"answer": answer, "data": data, "language": language}
