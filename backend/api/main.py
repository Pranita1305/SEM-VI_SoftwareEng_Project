from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.auth.routes import router as auth_router

app = FastAPI(
    title="SRDAPO API",
    description=(
        "Smart Ride Demand Anticipation & Pricing Optimizer – "
        "Backend API with JWT authentication, demand forecasting, and dynamic pricing."
    ),
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS – allow all origins in development; restrict in production
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------
@app.get("/", tags=["Health"])
async def root():
    """Simple health-check endpoint."""
    return {"status": "ok", "service": "SRDAPO API"}
