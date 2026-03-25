from fastapi import APIRouter

from backend.api.chatbot_service import chatbot_service
from backend.api.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/query", response_model=ChatResponse)
def query_chatbot(payload: ChatRequest) -> ChatResponse:
    return chatbot_service.answer(payload.message, payload.model_name)