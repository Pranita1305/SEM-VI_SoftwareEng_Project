from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from ..database import get_user_collection
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
    Register a new user account.

    - Validates email uniqueness
    - Hashes the password with bcrypt
    - Stores the user in MongoDB
    - Returns a JWT access token immediately (so the user is logged in right after signup)
    """
    users = get_user_collection()

    # Check for duplicate email
    existing = await users.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Persist the new user
    new_user = {
        "email": user.email,
        "hashed_password": hash_password(user.password),
        "role": "user",
    }
    await users.insert_one(new_user)

    # Issue a token so the frontend can authenticate immediately
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
    Authenticate with email and password.

    Returns a JWT access token on success.
    """
    users = get_user_collection()

    # Look up the user
    db_user = await users.find_one({"email": credentials.email})

    # Verify existence and password (same error message to prevent email enumeration)
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
    """
    Returns the profile of the currently authenticated user.

    Requires a valid Bearer token in the Authorization header.
    """
    return UserResponse(
        email=payload.get("sub", ""),
        role=payload.get("role", "user"),
    )
