from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..core.database import get_db
from ..core.deps import get_language
from cv_adapter.dto.language import Language
from ..schemas.cv import (
    JobDescriptionResponse,
    JobDescriptionCreate,
    JobDescriptionUpdate,
)
from ..services.cv import JobDescriptionService

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.get("", response_model=list[JobDescriptionResponse])
async def get_jobs(
    language: Language = Depends(get_language),
    db: Session = Depends(get_db),
) -> list[JobDescriptionResponse]:
    """Get all job descriptions for a language."""
    job_service = JobDescriptionService(db)
    jobs = job_service.get_by_language(language.code)
    return [JobDescriptionResponse.model_validate(job) for job in jobs]

@router.get("/{job_id}", response_model=JobDescriptionResponse)
async def get_job(
    job_id: int,
    db: Session = Depends(get_db),
) -> JobDescriptionResponse:
    """Get job description by ID."""
    job_service = JobDescriptionService(db)
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )
    return JobDescriptionResponse.model_validate(job)

@router.post("", response_model=JobDescriptionResponse)
async def create_job(
    job_data: JobDescriptionCreate,
    db: Session = Depends(get_db),
) -> JobDescriptionResponse:
    """Create new job description."""
    job_service = JobDescriptionService(db)
    job = job_service.create_job_description(job_data)
    return JobDescriptionResponse.model_validate(job)

@router.put("/{job_id}", response_model=JobDescriptionResponse)
async def update_job(
    job_id: int,
    job_data: JobDescriptionUpdate,
    db: Session = Depends(get_db),
) -> JobDescriptionResponse:
    """Update job description."""
    job_service = JobDescriptionService(db)
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )
    job = job_service.update_job_description(job, job_data)
    return JobDescriptionResponse.model_validate(job)

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete job description."""
    job_service = JobDescriptionService(db)
    job = job_service.get(job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job description not found",
        )
    job_service.delete(int(job.id))
