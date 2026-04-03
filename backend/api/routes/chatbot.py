from fastapi import APIRouter, Depends

from backend.api.chatbot_service import chatbot_service
from backend.api.schemas import ChatRequest, ChatResponse
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/query", response_model=ChatResponse)
def query_chatbot(
    payload: ChatRequest,
    _user: dict = Depends(get_current_user),
) -> ChatResponse:
    return chatbot_service.answer(payload.message, payload.model_name)