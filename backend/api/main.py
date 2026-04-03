"""
SRDAPO API — Main application entry point
==========================================
Start with:  uvicorn backend.api.main:app --reload
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.api.config import get_settings

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("srdapo")


# ---------------------------------------------------------------------------
# Lifespan — startup / shutdown hooks
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):  # noqa: ARG001
    settings = get_settings()

    # 1. Warm up ML models (trains from CSV on first call)
    from backend.api.inference import warm_up

    warm_up()

    # 2. Generate initial predictions so the API has data immediately
    from backend.api.scheduler import refresh_predictions

    refresh_predictions()
    logger.info("Initial predictions generated.")

    # 3. Start APScheduler for periodic refresh
    from apscheduler.schedulers.background import BackgroundScheduler

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        refresh_predictions,
        "interval",
        minutes=settings.scheduler_interval_minutes,
        id="refresh_predictions",
        replace_existing=True,
    )
    scheduler.start()
    logger.info(
        "APScheduler started — refreshing predictions every %d min.",
        settings.scheduler_interval_minutes,
    )

    yield  # ← app is running

    # Shutdown
    scheduler.shutdown(wait=False)
    logger.info("APScheduler stopped.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------
settings = get_settings()

app = FastAPI(
    title="SRDAPO API",
    description=(
        "Smart Ride Demand Anticipation & Pricing Optimizer – "
        "Backend API with JWT authentication, demand forecasting, "
        "dynamic pricing, zone intelligence, and chatbot."
    ),
    version="1.0.0",
    lifespan=lifespan,
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
# Global exception handler
# ---------------------------------------------------------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from backend.api.routes.predictions import router as predictions_router  # noqa: E402
from backend.api.routes.chatbot import router as chatbot_router  # noqa: E402
from backend.api.routes.pricing import router as pricing_router  # noqa: E402
from backend.api.routes.zones import router as zones_router  # noqa: E402
from backend.auth.routes import router as auth_router  # noqa: E402

app.include_router(auth_router)          # /auth/signup  /auth/login  /auth/me
app.include_router(predictions_router)   # /predictions
app.include_router(chatbot_router)       # /chatbot/query
app.include_router(pricing_router)       # /pricing/estimate
app.include_router(zones_router)         # /zones  /zones/{zone_id}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """Simple health-check endpoint."""
    return {"status": "ok", "service": "SRDAPO API"}

