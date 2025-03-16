"""User profile endpoints."""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import Session

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.sqlmodels import User
from ..schemas.user import UserResponse, UserUpdate
from ..services.user import UserService

router = APIRouter(prefix="/v1/api/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Get current user's profile."""
    assert current_user.id is not None, "User ID must be set"
    assert current_user.created_at is not None, "Created at must be set"

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        personal_info=dict(current_user.personal_info)
        if current_user.personal_info
        else None,
        created_at=current_user.created_at,
    )


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserResponse:
    """Update current user's profile."""
    user_service = UserService(db)
    updated_user = user_service.update_personal_info(current_user, user_data)
    assert updated_user.id is not None, "User ID must be set"
    assert updated_user.created_at is not None, "Created at must be set"

    return UserResponse(
        id=updated_user.id,
        email=updated_user.email,
        personal_info=dict(updated_user.personal_info)
        if updated_user.personal_info
        else None,
        created_at=updated_user.created_at,
    )
