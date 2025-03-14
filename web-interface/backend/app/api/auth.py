"""Authentication API endpoints."""

from datetime import datetime

from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import auth_logger
from ..core.database import get_db
from ..core.errors import (
    handle_authentication_error,
    handle_http_error,
)
from ..core.security import create_access_token, create_refresh_token, verify_token
from ..schemas.auth import AuthResponse
from ..schemas.user import UserCreate, UserResponse
from ..services.user import UserService

router = APIRouter(prefix="/v1/api/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=AuthResponse,
    responses={
        400: {
            "description": "Bad Request - Email already registered",
            "content": {
                "application/json": {
                    "example": {
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "Email already registered",
                            "field": "email",
                        }
                    }
                }
            },
        }
    },
)
async def register(
    user_data: UserCreate, db: Session = Depends(get_db)
) -> AuthResponse:
    """Register a new user."""
    auth_logger.debug(f"Registration attempt for email: {user_data.email}")

    user_service = UserService(db)
    existing_user = user_service.get_by_email(user_data.email)

    if existing_user:
        auth_logger.warning(
            f"Registration failed - email already exists: {user_data.email}"
        )
        error_response = handle_http_error(
            status.HTTP_400_BAD_REQUEST,
            "Email already registered",
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.error.model_dump(),
        )

    try:
        user = user_service.create_user(user_data)
        auth_logger.info(f"User registered successfully: {user.email}")
    except Exception as e:
        auth_logger.error(
            f"Registration failed for {user_data.email}: {str(e)}", exc_info=True
        )
        error_response = handle_http_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Registration failed",
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.error.model_dump(),
        )

    # Create tokens
    access_token = create_access_token(int(user.id))
    refresh_token = create_refresh_token(int(user.id))

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=int(user.id),
            email=str(user.email),
            personal_info=dict(user.personal_info) if user.personal_info else None,
            created_at=datetime.fromtimestamp(
                user.created_at.timestamp()
            ),  # created_at should never be None for a valid user
        ),
    )


@router.post("/login", response_model=AuthResponse)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> AuthResponse:
    """Login user."""
    auth_logger.debug(f"Login attempt for username: {form_data.username}")

    user_service = UserService(db)
    try:
        user = user_service.authenticate(form_data.username, form_data.password)
        if not user:
            auth_logger.warning(
                f"Login failed - invalid credentials for: {form_data.username}"
            )
            error_response = handle_authentication_error(
                message="Incorrect email or password",
                field="password",
            )
            raise HTTPException(
                status_code=error_response.status_code,
                detail=error_response.error.model_dump(),
                headers={"WWW-Authenticate": "Bearer"},
            )

        auth_logger.debug(f"Creating tokens for user: {user.email}")
        # Create tokens
        access_token = create_access_token(int(user.id))
        refresh_token = create_refresh_token(int(user.id))
        auth_logger.info(f"User logged in successfully: {user.email}")
    except HTTPException:
        raise
    except Exception as e:
        auth_logger.error(
            f"Login failed for {form_data.username}: {str(e)}", exc_info=True
        )
        error_response = handle_http_error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "Login failed",
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.error.model_dump(),
        )

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=int(user.id),
            email=str(user.email),
            personal_info=dict(user.personal_info) if user.personal_info else None,
            created_at=datetime.fromtimestamp(
                user.created_at.timestamp()
            ),  # created_at should never be None for a valid user
        ),
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout() -> None:
    """
    Logout user.
    Since we're using JWT, we don't need to do anything server-side.
    The client should clear the tokens from local storage.
    Returns 204 No Content to indicate successful logout without a response body.
    """
    return None


@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    token: str = Body(..., embed=True), db: Session = Depends(get_db)
) -> AuthResponse:
    """Refresh access token using refresh token."""
    payload = verify_token(token, expected_type="refresh")
    if not payload:
        error_response = handle_authentication_error(
            message="Invalid refresh token",
            field="token",
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.error.model_dump(),
        )

    user_service = UserService(db)
    user = user_service.get(payload["sub"])
    if not user:
        error_response = handle_authentication_error(
            message="User not found",
            field="token",
        )
        raise HTTPException(
            status_code=error_response.status_code,
            detail=error_response.error.model_dump(),
        )

    # Create new tokens
    access_token = create_access_token(int(user.id))
    refresh_token = create_refresh_token(int(user.id))

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserResponse(
            id=int(user.id),
            email=str(user.email),
            personal_info=dict(user.personal_info) if user.personal_info else None,
            created_at=datetime.fromtimestamp(
                user.created_at.timestamp()
            ),  # created_at should never be None for a valid user
        ),
    )
