"""JWT token handling utilities."""

from datetime import UTC, datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from jose.exceptions import JWTError
from pydantic import BaseModel

# To be moved to settings/config
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# OAuth2PasswordBearer for token extraction
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="v1/auth/login")

class Token(BaseModel):
    """Token schema."""

    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None

class TokenPayload(BaseModel):
    """Token payload schema."""

    sub: int  # user id
    exp: datetime
    type: str  # "access" or "refresh"

def create_token(
    subject: int, expires_delta: Optional[timedelta] = None, token_type: str = "access"
) -> str:
    """Create a new token."""
    if expires_delta:
        expire = datetime.now(UTC) + expires_delta
    elif token_type == "access":
        expire = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    else:  # refresh token
        expire = datetime.now(UTC) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {
        "sub": str(subject),  # Convert subject to string for JWT
        "exp": int(expire.timestamp()),
        "type": token_type,
    }
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_access_token(subject: int) -> str:
    """Create access token."""
    return create_token(subject, token_type="access")

def create_refresh_token(subject: int) -> str:
    """Create refresh token."""
    return create_token(subject, token_type="refresh")

def verify_token(
    token: str, expected_type: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Verify token and return payload if valid."""
    try:
        # This will verify exp claim automatically
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if not payload.get("sub") or not isinstance(payload.get("type"), str):
            return None
        # If expected_type is provided, verify token type matches
        if expected_type and payload.get("type") != expected_type:
            return None
        return payload
    except JWTError:
        return None

async def decode_access_token(
    token: str = Depends(oauth2_scheme),
) -> Dict[str, Any]:
    """Decode and verify access token."""
    try:
        payload = verify_token(token, expected_type="access")
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "Could not validate credentials", "code": "INVALID_TOKEN"},
                headers={"WWW-Authenticate": "Bearer"},
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Could not validate credentials", "code": "INVALID_TOKEN"},
            headers={"WWW-Authenticate": "Bearer"},
        )
