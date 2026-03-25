from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.config import get_settings
from backend.api.routes.chatbot import router as chatbot_router
from backend.api.routes.predictions import router as predictions_router

settings = get_settings()
app = FastAPI(title="SRDAPO API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(predictions_router, prefix="/api")
app.include_router(chatbot_router, prefix="/api")