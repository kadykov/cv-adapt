"""Repository pattern implementations for CV-related operations."""

from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from ..models.models import DetailedCV, GeneratedCV, JobDescription
from ..schemas.cv import GeneratedCVCreate
from .cv import DetailedCVService, GeneratedCVService, JobDescriptionService


class EntityNotFoundError(Exception):
    """Exception raised when an entity is not found in the database."""

    pass


class CVRepository:
    """Repository for CV-related database operations."""

    def __init__(self, db: Session):
        self.db = db
        self._generated_cv_service = GeneratedCVService(db)
        self._detailed_cv_service = DetailedCVService(db)
        self._job_description_service = JobDescriptionService(db)

    def save_generated_cv(
        self, user_id: int, cv_data: GeneratedCVCreate
    ) -> GeneratedCV:
        """Save a generated CV to the database."""
        return self._generated_cv_service.create_generated_cv(user_id, cv_data)

    def update_status(self, cv_id: int, status: str) -> GeneratedCV:
        """Update CV status."""
        cv = self._generated_cv_service.get(cv_id)
        if not cv:
            raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")
        return self._generated_cv_service.update_generated_cv(cv, status=status)

    def update_parameters(self, cv_id: int, parameters: Dict[str, Any]) -> GeneratedCV:
        """Update generation parameters."""
        cv = self._generated_cv_service.get(cv_id)
        if not cv:
            raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")
        return self._generated_cv_service.update_generated_cv(
            cv, generation_parameters=parameters
        )

    def get_user_generated_cvs(self, user_id: int) -> List[GeneratedCV]:
        """Get all generated CVs for a user."""
        return self._generated_cv_service.get_by_user(user_id)

    def get_generated_cv(self, cv_id: int) -> Optional[GeneratedCV]:
        """Get a specific generated CV."""
        return self._generated_cv_service.get(cv_id)

    def get_detailed_cv(self, cv_id: int) -> Optional[DetailedCV]:
        """Get a specific detailed CV."""
        return self._detailed_cv_service.get(cv_id)

    def get_job_description(self, job_id: int) -> Optional[JobDescription]:
        """Get a specific job description."""
        return self._job_description_service.get(job_id)

    def get_detailed_cv_by_language(
        self, user_id: int, language_code: str
    ) -> Optional[DetailedCV]:
        """Get a detailed CV by user and language."""
        return self._detailed_cv_service.get_by_user_and_language(
            user_id, language_code
        )
