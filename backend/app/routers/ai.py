from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AIQuery, AIResponse
from ..services.ai_service import answer_question

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/query", response_model=AIResponse)
def ai_query(query: AIQuery, db: Session = Depends(get_db)):
    result = answer_question(db, query.question, query.language)
    return AIResponse(**result)


@router.get("/suggestions")
def get_suggestions(language: str = "en"):
    suggestions = {
        "en": [
            "How much did I earn this month?",
            "Who owes me money?",
            "How much advance have I received?",
            "Show my last week's work",
            "Which employer has pending payments?",
            "How much money have I received this month?",
            "What is my total pending balance?",
            "Show my recent work records"
        ],
        "hi": [
            "इस महीने मैंने कितना कमाया?",
            "मुझे किसका पैसा मिलना बाकी है?",
            "मुझे कितना एडवांस मिला?",
            "पिछले हफ्ते का काम दिखाओ",
            "किस मालिक का भुगतान बाकी है?",
            "इस महीने कितना पैसा मिला?",
            "कुल बकाया कितना है?",
            "हाल के काम के रिकॉर्ड दिखाओ"
        ],
        "te": [
            "ఈ నెల నేను ఎంత సంపాదించాను?",
            "నాకు ఎవరు డబ్బు ఇవ్వాలి?",
            "నాకు ఎంత అడ్వాన్స్ వచ్చింది?",
            "గత వారం పని చూపించు",
            "ఏ యజమాని పేమెంట్ పెండింగ్‌లో ఉంది?",
            "ఈ నెల ఎంత డబ్బు వచ్చింది?",
            "మొత్తం బాకీ ఎంత?",
            "ఇటీవలి పని రికార్డులు చూపించు"
        ]
    }
    return {"suggestions": suggestions.get(language, suggestions["en"])}
