from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from ..core.security import oauth2_scheme, decode_access_token
from ..core.database import get_db
from ..core.deps import get_language
from ..models.models import User
from ..services.user import UserService
from cv_adapter.dto.language import Language
from ..schemas.cv import (
    JobDescriptionResponse,
    JobDescriptionCreate,
    JobDescriptionUpdate,
)
from ..services.cv import JobDescriptionService

router = APIRouter(prefix="/v1/api/jobs", tags=["jobs"])

@router.get(
    "",
    response_model=list[JobDescriptionResponse],
    responses={
        401: {
            "description": "Unauthorized - Invalid or missing token",
            "content": {
                "application/json": {
                    "example": {"detail": {"message": "Could not validate credentials"}}
                }
            }
        }
    }
)
async def get_jobs(
    language: Language = Depends(get_language),
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> list[JobDescriptionResponse]:
    """Get all job descriptions for a language."""
    # Verify token and get user ID
    payload = await decode_access_token(token)
    user_id = int(payload["sub"])

    # Get user from database to verify they exist
    user_service = UserService(db)
    user = user_service.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    job_service = JobDescriptionService(db)
    jobs = job_service.get_by_language(language.code)
    return [JobDescriptionResponse.model_validate(job) for job in jobs]

@router.get(
    "/{job_id}",
    response_model=JobDescriptionResponse,
    responses={
        401: {
            "description": "Unauthorized - Invalid or missing token",
            "content": {
                "application/json": {
                    "example": {"detail": {"message": "Could not validate credentials"}}
                }
            }
        },
        404: {
            "description": "Job not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Job description not found"}
                }
            }
        }
    }
)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> JobDescriptionResponse:
    """Get job description by ID."""
    # Verify token and get user ID
    payload = await decode_access_token(token)
    user_id = int(payload["sub"])

    # Get user from database to verify they exist
    user_service = UserService(db)
    user = user_service.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    job_service = JobDescriptionService(db)
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )
    return JobDescriptionResponse.model_validate(job)

@router.post(
    "",
    response_model=JobDescriptionResponse,
    responses={
        401: {
            "description": "Unauthorized - Invalid or missing token",
            "content": {
                "application/json": {
                    "example": {"detail": {"message": "Could not validate credentials"}}
                }
            }
        }
    }
)
async def create_job(
    job_data: JobDescriptionCreate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> JobDescriptionResponse:
    """Create new job description."""
    # Verify token and get user ID
    payload = await decode_access_token(token)
    user_id = int(payload["sub"])

    # Get user from database to verify they exist
    user_service = UserService(db)
    user = user_service.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    job_service = JobDescriptionService(db)
    job = job_service.create_job_description(job_data)
    return JobDescriptionResponse.model_validate(job)

@router.put(
    "/{job_id}",
    response_model=JobDescriptionResponse,
    responses={
        401: {
            "description": "Unauthorized - Invalid or missing token",
            "content": {
                "application/json": {
                    "example": {"detail": {"message": "Could not validate credentials"}}
                }
            }
        },
        404: {
            "description": "Job not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Job description not found"}
                }
            }
        }
    }
)
async def update_job(
    job_id: int,
    job_data: JobDescriptionUpdate,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> JobDescriptionResponse:
    """Update job description."""
    # Verify token and get user ID
    payload = await decode_access_token(token)
    user_id = int(payload["sub"])

    # Get user from database to verify they exist
    user_service = UserService(db)
    user = user_service.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    job_service = JobDescriptionService(db)
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )
    job = job_service.update_job_description(job, job_data)
    return JobDescriptionResponse.model_validate(job)

@router.delete(
    "/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={
        401: {
            "description": "Unauthorized - Invalid or missing token",
            "content": {
                "application/json": {
                    "example": {"detail": {"message": "Could not validate credentials"}}
                }
            }
        },
        404: {
            "description": "Job not found",
            "content": {
                "application/json": {
                    "example": {"detail": "Job description not found"}
                }
            }
        }
    }
)
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> None:
    """Delete job description."""
    # Verify token and get user ID
    payload = await decode_access_token(token)
    user_id = int(payload["sub"])

    # Get user from database to verify they exist
    user_service = UserService(db)
    user = user_service.get(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    job_service = JobDescriptionService(db)
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )
    job_service.delete(int(job.id))
