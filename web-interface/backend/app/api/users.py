from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.models import User
from ..schemas.user import UserResponse, UserUpdate
from ..services.user import UserService

router = APIRouter(prefix="/user", tags=["users"])

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Get current user's profile."""
    return UserResponse(
        id=int(current_user.id),
        email=str(current_user.email),
        personal_info=dict(current_user.personal_info)
        if current_user.personal_info
        else None,
        created_at=datetime.fromtimestamp(current_user.created_at.timestamp()),
    )

@router.put("/profile", response_model=UserResponse)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserResponse:
    """Update current user's profile."""
    user_service = UserService(db)
    updated_user = user_service.update_personal_info(current_user, user_data)
    return UserResponse(
        id=int(updated_user.id),
        email=str(updated_user.email),
        personal_info=dict(updated_user.personal_info)
        if updated_user.personal_info
        else None,
        created_at=datetime.fromtimestamp(updated_user.created_at.timestamp()),
    )
