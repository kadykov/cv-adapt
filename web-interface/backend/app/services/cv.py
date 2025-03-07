"""CV-related database services."""

from typing import Any, Dict, List, Optional

from sqlalchemy import and_
from sqlalchemy.orm import Session

from ..models.models import DetailedCV, GeneratedCV, JobDescription
from ..schemas.cv import (
    DetailedCVCreate,
    DetailedCVUpdate,
    GeneratedCVCreate,
    JobDescriptionCreate,
    JobDescriptionUpdate,
)
from .base import BaseDBService


class DetailedCVService(BaseDBService[DetailedCV]):
    """Service for handling detailed CV operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        super().__init__(db, DetailedCV)

    def get_by_user_and_language(
        self, user_id: int, language_code: str
    ) -> Optional[DetailedCV]:
        """Get user's CV by language."""
        return (
            self.db.query(DetailedCV)
            .filter(
                and_(
                    DetailedCV.user_id == user_id,
                    DetailedCV.language_code == language_code,
                )
            )
            .first()
        )

    def get_user_cvs(self, user_id: int) -> List[DetailedCV]:
        """Get all CVs for a user."""
        return self.db.query(DetailedCV).filter(DetailedCV.user_id == user_id).all()

    def create_cv(self, user_id: int, cv_data: DetailedCVCreate) -> DetailedCV:
        """Create new detailed CV."""
        if cv_data.is_primary:
            # Set all other CVs to non-primary
            self.db.query(DetailedCV).filter(
                and_(DetailedCV.user_id == user_id, DetailedCV.is_primary.is_(True))
            ).update({"is_primary": False})

        data: Dict[str, Any] = {
            "user_id": user_id,
            "language_code": cv_data.language_code,
            "content": cv_data.content,
            "is_primary": cv_data.is_primary,
        }
        return self.create(**data)

    def update_cv(self, cv: DetailedCV, cv_data: DetailedCVUpdate) -> DetailedCV:
        """Update detailed CV."""
        update_data: Dict[str, Any] = {}
        if cv_data.content is not None:
            update_data["content"] = cv_data.content
        if cv_data.is_primary is not None and cv_data.is_primary:
            # Set all other CVs to non-primary
            self.db.query(DetailedCV).filter(
                and_(
                    DetailedCV.user_id == cv.user_id,
                    DetailedCV.id != cv.id,
                    DetailedCV.is_primary.is_(True),
                )
            ).update({"is_primary": False})
            update_data["is_primary"] = cv_data.is_primary

        if update_data:
            return self.update(cv, **update_data)
        return cv


class JobDescriptionService(BaseDBService[JobDescription]):
    """Service for handling job description operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        super().__init__(db, JobDescription)

    def get_by_language(self, language_code: str) -> List[JobDescription]:
        """Get job descriptions by language."""
        return (
            self.db.query(JobDescription)
            .filter(JobDescription.language_code == language_code)
            .all()
        )

    def create_job_description(self, job_data: JobDescriptionCreate) -> JobDescription:
        """Create new job description."""
        return self.create(**job_data.model_dump())

    def update_job_description(
        self, job: JobDescription, job_data: JobDescriptionUpdate
    ) -> JobDescription:
        """Update job description."""
        update_data: Dict[str, Any] = {}
        if job_data.title is not None:
            update_data["title"] = job_data.title
        if job_data.description is not None:
            update_data["description"] = job_data.description
        if update_data:
            return self.update(job, **update_data)
        return job


class GeneratedCVService(BaseDBService[GeneratedCV]):
    """Service for handling generated CV operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        super().__init__(db, GeneratedCV)

    def get_by_user(self, user_id: int) -> List[GeneratedCV]:
        """Get all generated CVs for a user."""
        return self.db.query(GeneratedCV).filter(GeneratedCV.user_id == user_id).all()

    def create_generated_cv(
        self, user_id: int, cv_data: GeneratedCVCreate
    ) -> GeneratedCV:
        """Create new generated CV."""
        data: Dict[str, Any] = {
            "user_id": user_id,
            "detailed_cv_id": cv_data.detailed_cv_id,
            "job_description_id": cv_data.job_description_id,
            "language_code": cv_data.language_code,
            "content": cv_data.content,
            "status": cv_data.status,
            "generation_parameters": cv_data.generation_parameters,
            "version": cv_data.version,
        }
        return self.create(**data)

    def update_generated_cv(
        self,
        cv: GeneratedCV,
        status: str | None = None,
        generation_parameters: Dict[str, Any] | None = None,
    ) -> GeneratedCV:
        """Update generated CV status or parameters."""
        update_data: Dict[str, Any] = {}
        if status is not None:
            update_data["status"] = status
        if generation_parameters is not None:
            update_data["generation_parameters"] = generation_parameters
        if update_data:
            return self.update(cv, **update_data)
        return cv
