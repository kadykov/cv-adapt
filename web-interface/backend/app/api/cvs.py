from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_current_user
from ..models.models import User
from ..schemas.cv import (
    DetailedCVCreate,
    DetailedCVResponse,
    DetailedCVUpdate,
)
from ..services.cv import DetailedCVService

router = APIRouter(prefix="/user/detailed-cvs", tags=["detailed-cvs"])

@router.get("", response_model=list[DetailedCVResponse])
async def get_user_detailed_cvs(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> List[DetailedCVResponse]:
    """Get all user's detailed CVs."""
    cv_service = DetailedCVService(db)
    cvs = cv_service.get_user_cvs(int(current_user.id))
    return [DetailedCVResponse.model_validate(cv) for cv in cvs]

@router.get("/{language_code}", response_model=DetailedCVResponse)
async def get_user_detailed_cv(
    language_code: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> DetailedCVResponse:
    """Get user's detailed CV by language."""
    cv_service = DetailedCVService(db)
    cv = cv_service.get_by_user_and_language(int(current_user.id), language_code)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No CV found for language: {language_code}",
        )
    return DetailedCVResponse.model_validate(cv)

@router.put("/{language_code}", response_model=DetailedCVResponse)
async def upsert_user_detailed_cv(
    language_code: str,
    cv_data: DetailedCVCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> DetailedCVResponse:
    """Create or update user's detailed CV for a language."""
    if cv_data.language_code != language_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Language code in URL must match CV language",
        )

    cv_service = DetailedCVService(db)
    existing_cv = cv_service.get_by_user_and_language(
        int(current_user.id), language_code
    )

    if existing_cv:
        # Update existing CV
        update_data = DetailedCVUpdate(
            content=cv_data.content, is_primary=cv_data.is_primary
        )
        cv = cv_service.update_cv(existing_cv, update_data)
        return DetailedCVResponse.model_validate(cv)

    # Create new CV
    cv = cv_service.create_cv(int(current_user.id), cv_data)
    return DetailedCVResponse.model_validate(cv)

@router.delete("/{language_code}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_detailed_cv(
    language_code: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> None:
    """Delete user's detailed CV by language."""
    cv_service = DetailedCVService(db)
    cv = cv_service.get_by_user_and_language(int(current_user.id), language_code)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No CV found for language: {language_code}",
        )
    cv_service.delete(int(cv.id))

@router.put("/{language_code}/primary", response_model=DetailedCVResponse)
async def set_primary_cv(
    language_code: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> DetailedCVResponse:
    """Set a CV as primary."""
    cv_service = DetailedCVService(db)
    cv = cv_service.get_by_user_and_language(int(current_user.id), language_code)
    if not cv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No CV found for language: {language_code}",
        )

    update_data = DetailedCVUpdate(is_primary=True)
    cv = cv_service.update_cv(cv, update_data)
    return DetailedCVResponse.model_validate(cv)
