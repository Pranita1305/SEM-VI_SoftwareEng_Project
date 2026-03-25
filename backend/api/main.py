from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.config import get_settings
from backend.api.routes.predictions import router as predictions_router
from backend.api.routes.chatbot import router as chatbot_router
from backend.auth.routes import router as auth_router

settings = get_settings()

app = FastAPI(
    title="SRDAPO API",
    description=(
        "Smart Ride Demand Anticipation & Pricing Optimizer – "
        "Backend API with JWT authentication, demand forecasting, and dynamic pricing."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)          # /auth/signup  /auth/login  /auth/me
app.include_router(predictions_router)   # /predictions
app.include_router(chatbot_router)       # /chatbot/query


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """Simple health-check endpoint."""
    return {"status": "ok", "service": "SRDAPO API"}
