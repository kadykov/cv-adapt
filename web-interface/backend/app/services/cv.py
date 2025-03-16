"""CV-related database services."""

from typing import Any, Dict, List, Optional

from sqlmodel import Session, select

from ..models.sqlmodels import DetailedCV, GeneratedCV
from ..schemas.cv import (
    DetailedCVCreate,
    DetailedCVUpdate,
    GeneratedCVCreate,
)
from .sqlmodel_base import SQLModelService


class DetailedCVService(SQLModelService[DetailedCV]):
    """Service for handling detailed CV operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        super().__init__(db, DetailedCV)

    def get_by_user_and_language(
        self, user_id: int, language_code: str
    ) -> Optional[DetailedCV]:
        """Get user's CV by language."""
        statement = select(DetailedCV).where(
            DetailedCV.user_id == user_id,
            DetailedCV.language_code == language_code,
        )
        return self.db.exec(statement).first()

    def get_user_cvs(self, user_id: int) -> List[DetailedCV]:
        """Get all CVs for a user."""
        statement = select(DetailedCV).where(DetailedCV.user_id == user_id)
        return list(self.db.exec(statement).all())

    def create_cv(self, user_id: int, cv_data: DetailedCVCreate) -> DetailedCV:
        """Create new detailed CV."""
        if cv_data.is_primary:
            # Set all other CVs to non-primary
            # Find currently primary CV
            primary_cv_statement = select(DetailedCV).where(
                DetailedCV.user_id == user_id,
                DetailedCV.is_primary,
            )
            primary_cv = self.db.exec(primary_cv_statement).first()
            if primary_cv:
                primary_cv.is_primary = False
                self.db.add(primary_cv)

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
            statement = select(DetailedCV).where(
                DetailedCV.user_id == cv.user_id,
                DetailedCV.id != cv.id,
                DetailedCV.is_primary,
            )
            for other_cv in self.db.exec(statement):
                other_cv.is_primary = False
                self.db.add(other_cv)
            update_data["is_primary"] = cv_data.is_primary

        if update_data:
            return self.update(cv, **update_data)
        return cv


class GeneratedCVService(SQLModelService[GeneratedCV]):
    """Service for handling generated CV operations."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        super().__init__(db, GeneratedCV)

    def get_by_user(self, user_id: int) -> List[GeneratedCV]:
        """Get all generated CVs for a user."""
        statement = select(GeneratedCV).where(GeneratedCV.user_id == user_id)
        return list(self.db.exec(statement).all())

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
