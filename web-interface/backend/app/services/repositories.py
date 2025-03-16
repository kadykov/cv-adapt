"""Repository pattern implementations for CV-related operations."""

from typing import List, Optional, Tuple

from sqlmodel import Session, and_, desc, func, select

from ..models.sqlmodels import DetailedCV, GeneratedCV, JobDescription
from ..schemas.common import GeneratedCVFilters, PaginationParams
from ..schemas.cv import GeneratedCVCreate
from .cv import DetailedCVService
from .job import JobDescriptionSQLModelService


class EntityNotFoundError(Exception):
    """Exception raised when an entity is not found in the database."""

    pass


class CVRepository:
    """Repository for accessing CV-related data in the database."""

    def __init__(self, db: Session):
        self.db = db
        self._detailed_cv_service = DetailedCVService(db)
        self._job_description_service = JobDescriptionSQLModelService(db)

    def get_user_generated_cvs(
        self,
        user_id: int,
        filters: Optional[GeneratedCVFilters] = None,
        pagination: Optional[PaginationParams] = None,
    ) -> Tuple[List[GeneratedCV], int]:
        """Get all generated CVs for a user with filtering and pagination."""
        # Start with base query
        query = select(GeneratedCV).where(GeneratedCV.user_id == user_id)
        count_query = (
            select(func.count())
            .select_from(GeneratedCV)
            .where(GeneratedCV.user_id == user_id)
        )

        # Apply filters if provided
        if filters:
            filter_conditions = []

            if filters.status:
                filter_conditions.append(GeneratedCV.status == filters.status)

            if filters.language_code:
                filter_conditions.append(
                    GeneratedCV.language_code == filters.language_code
                )

            if filters.created_at:
                if filters.created_at.start:
                    filter_conditions.append(
                        GeneratedCV.created_at >= filters.created_at.start
                    )
                if filters.created_at.end:
                    filter_conditions.append(
                        GeneratedCV.created_at <= filters.created_at.end
                    )

            if filter_conditions:
                combined_filter = and_(*filter_conditions)
                query = query.where(combined_filter)
                count_query = count_query.where(combined_filter)

        # Get total count before pagination
        total = self.db.scalar(count_query) or 0

        # Apply pagination if provided
        if pagination:
            query = query.offset(pagination.offset).limit(pagination.limit)

        # Order by most recent first
        query = query.order_by(desc(GeneratedCV.created_at))

        # Execute query and convert results to list
        results = list(self.db.exec(query).all())
        return results, total

    def get_generated_cv(self, cv_id: int) -> Optional[GeneratedCV]:
        """Get a specific generated CV."""
        stmt = select(GeneratedCV).where(GeneratedCV.id == cv_id)
        return self.db.exec(stmt).first()

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
        stmt = select(DetailedCV).where(
            and_(
                DetailedCV.user_id == user_id, DetailedCV.language_code == language_code
            )
        )
        return self.db.exec(stmt).first()

    def save_generated_cv(
        self, user_id: int, cv_data: GeneratedCVCreate
    ) -> GeneratedCV:
        """Save a new generated CV."""
        generated_cv = GeneratedCV(
            user_id=user_id,
            detailed_cv_id=cv_data.detailed_cv_id,
            job_description_id=cv_data.job_description_id,
            language_code=cv_data.language_code,
            content=cv_data.content,
            status=cv_data.status or "draft",
            generation_status="completed",
            generation_parameters=cv_data.generation_parameters or {},
        )
        self.db.add(generated_cv)
        self.db.commit()
        self.db.refresh(generated_cv)
        return generated_cv

    def update_status(self, cv_id: int, status: str) -> GeneratedCV:
        """Update the status of a generated CV."""
        cv = self.get_generated_cv(cv_id)
        if not cv:
            raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

        cv.status = status
        self.db.add(cv)
        self.db.commit()
        self.db.refresh(cv)
        return cv

    def update_parameters(self, cv_id: int, parameters: dict) -> GeneratedCV:
        """Update generation parameters of a generated CV."""
        cv = self.get_generated_cv(cv_id)
        if not cv:
            raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

        cv.generation_parameters = parameters
        self.db.add(cv)
        self.db.commit()
        self.db.refresh(cv)
        return cv
