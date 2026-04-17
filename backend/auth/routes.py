"""
Auth routes — in-memory user store (no database required).

Users are stored in a plain Python dict keyed by email.
Data lives only for the lifetime of the server process — perfect for testing.
"""
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth.jwt_handler import (
    hash_password,
    verify_password,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from ..auth.models import UserCreate, UserLogin, Token, UserResponse
from ..auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

# ---------------------------------------------------------------------------
# In-memory user store  { email -> {email, hashed_password, role} }
# ---------------------------------------------------------------------------
_USERS: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# POST /auth/signup
# ---------------------------------------------------------------------------
@router.post(
    "/signup",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
async def signup(user: UserCreate):
    """
    Register a new user account (in-memory, no database needed).

    - Validates email uniqueness
    - Hashes password with bcrypt
    - Stores user in server memory
    - Returns a JWT access token immediately
    """
    if user.email in _USERS:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    _USERS[user.email] = {
        "email":           user.email,
        "hashed_password": hash_password(user.password),
        "role":            "user",
    }

    access_token = create_access_token(
        data={"sub": user.email, "role": "user"},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token)


# ---------------------------------------------------------------------------
# POST /auth/login
# ---------------------------------------------------------------------------
@router.post(
    "/login",
    response_model=Token,
    summary="Log in with email & password",
)
async def login(credentials: UserLogin):
    """
    Authenticate with email and password (checks in-memory store).
    Returns a JWT access token on success.
    """
    db_user = _USERS.get(credentials.email)

    if not db_user or not verify_password(credentials.password, db_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": db_user["email"], "role": db_user.get("role", "user")},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return Token(access_token=access_token)


# ---------------------------------------------------------------------------
# GET /auth/me  (protected)
# ---------------------------------------------------------------------------
@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current authenticated user",
)
async def get_me(payload: dict = Depends(get_current_user)):
    """Returns the profile of the currently authenticated user."""
    return UserResponse(
        email=payload.get("sub", ""),
        role=payload.get("role", "user"),
    )
