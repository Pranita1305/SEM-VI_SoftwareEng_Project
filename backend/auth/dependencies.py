from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from backend.auth.jwt_handler import decode_access_token

security = HTTPBearer()

def get_current_user(token: HTTPAuthorizationCredentials = Depends(security)):
    payload = decode_access_token(token.credentials)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    return payload
