"""Dependencies for FastAPI routes."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from ..models.models import User
from ..services.user import UserService
from .database import get_db
from .security import TokenPayload, verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


async def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    """Get current authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = verify_token(token)
    if not payload:
        raise credentials_exception

    try:
        token_data = TokenPayload(**payload)
        if token_data.type != "access":
            raise credentials_exception
    except (JWTError, ValueError):
        raise credentials_exception

    user_service = UserService(db)
    user = user_service.get(token_data.sub)
    if user is None:
        raise credentials_exception

    return user
