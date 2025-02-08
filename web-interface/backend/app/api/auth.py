from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.security import create_access_token, create_refresh_token, verify_token
from ..schemas.auth import AuthResponse
from ..schemas.user import UserCreate, UserResponse
from ..services.user import UserService
from .. import auth_logger

router = APIRouter(prefix="/v1/auth", tags=["auth"])

@router.post("/register", response_model=AuthResponse)
async def register(
    user_data: UserCreate, db: Session = Depends(get_db)
) -> AuthResponse:
    """Register a new user."""
    auth_logger.debug(f"Registration attempt for email: {user_data.email}")

    user_service = UserService(db)
    existing_user = user_service.get_by_email(user_data.email)

    if existing_user:
        auth_logger.warning(f"Registration failed - email already exists: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Email already registered",
                "code": "EMAIL_EXISTS",
                "field": "email"
            }
        )

    try:
        user = user_service.create_user(user_data)
        auth_logger.info(f"User registered successfully: {user.email}")
    except Exception as e:
        auth_logger.error(f"Registration failed for {user_data.email}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Registration failed", "code": "REGISTRATION_ERROR"}
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
            auth_logger.warning(f"Login failed - invalid credentials for: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "message": "Incorrect email or password",
                    "code": "INVALID_CREDENTIALS",
                    "field": "password"
                },
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
        auth_logger.error(f"Login failed for {form_data.username}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Login failed", "code": "LOGIN_ERROR"}
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

@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout() -> dict[str, str]:
    """Logout user."""
    # Since we're using JWT, we don't need to do anything server-side
    # The client should clear the tokens from local storage
    return {"status": "success"}

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(
    token: str = Body(..., embed=True), db: Session = Depends(get_db)
) -> AuthResponse:
    """Refresh access token using refresh token."""
    payload = verify_token(token, expected_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "Invalid refresh token",
                "code": "INVALID_REFRESH_TOKEN",
                "field": "token"
            }
        )

    user_service = UserService(db)
    user = user_service.get(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "message": "User not found",
                "code": "USER_NOT_FOUND",
                "field": "token"
            }
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
