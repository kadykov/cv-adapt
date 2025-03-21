"""Dependency injection utilities."""

from typing import Annotated

from fastapi import Depends, HTTPException, Query, status
from jose import JWTError
from sqlmodel import Session

from cv_adapter.dto.language import ENGLISH, Language, LanguageCode

from ..core.database import get_db
from ..core.security import decode_access_token
from ..logger import auth_logger, logger
from ..models.sqlmodels import User
from ..services.user import UserService


async def get_current_user(
    db: Annotated[Session, Depends(get_db)], token: dict = Depends(decode_access_token)
) -> User:
    """Get current user from JWT token."""
    try:
        user_service = UserService(db)
        user = user_service.get(int(token["sub"]))
        if not user:
            auth_logger.warning(f"User not found for sub: {token['sub']}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={"message": "User not found", "code": "USER_NOT_FOUND"},
            )
        return user
    except JWTError as e:
        auth_logger.warning(f"Invalid token: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Invalid token", "code": "INVALID_TOKEN"},
        )


async def get_language(language_code: str = Query(default="en")) -> Language:
    """Dependency to get language from request, defaulting to English."""
    try:
        if not language_code:
            logger.debug("No language code provided, defaulting to English")
            return ENGLISH
        # Validate language code and get registered language instance
        lang_code = LanguageCode(language_code)
        language = Language.get(lang_code)
        logger.debug(f"Using language: {language.code}")
        return language
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail=[
                {
                    "loc": ["query", "language_code"],
                    "msg": f"Invalid language code: {language_code}",
                    "type": "value_error",
                }
            ],
        )
