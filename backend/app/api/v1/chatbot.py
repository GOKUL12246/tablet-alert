from typing import Any, List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.chatbot import ChatbotConversation
from app.models.user import User
from app.schemas.chatbot import (
    ChatHistoryResponse,
    ChatMessageRequest,
    ChatMessageResponse,
)
from app.services.chatbot_service import generate_response

router = APIRouter(prefix="/chatbot", tags=["Chatbot"])


@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Send question to MEDISAKHI AI bot and receive safe, verified medication guidance."""
    lang = payload.language or (current_user.language.value if current_user.language else "en")
    session_id = payload.session_id or "default"

    res = generate_response(
        db=db,
        patient_id=current_user.id,
        message=payload.message,
        language=lang,
        session_id=session_id
    )
    return res


@router.get("/history", response_model=ChatHistoryResponse)
def get_chat_history(
    session_id: str = Query("default"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Retrieve chat history for a session."""
    conv = db.query(ChatbotConversation).filter(
        ChatbotConversation.patient_id == current_user.id,
        ChatbotConversation.session_id == session_id
    ).first()

    messages = conv.messages if conv and conv.messages else []
    return {
        "session_id": session_id,
        "messages": messages
    }


@router.delete("/history")
def clear_chat_history(
    session_id: str = Query("default"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """Clear chat messages for a session."""
    conv = db.query(ChatbotConversation).filter(
        ChatbotConversation.patient_id == current_user.id,
        ChatbotConversation.session_id == session_id
    ).first()

    if conv:
        conv.messages = []
        db.commit()

    return {"success": True, "message": "Chat history cleared"}
