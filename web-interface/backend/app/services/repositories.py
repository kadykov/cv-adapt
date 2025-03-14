"""Repository pattern implementations for CV-related operations."""

from typing import Any, Dict, List, Optional, Tuple, Union

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.sql.elements import BooleanClauseList, ColumnElement

from ..models.models import DetailedCV, GeneratedCV, JobDescription
from ..schemas.common import GeneratedCVFilters, PaginationParams
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

    def _build_filter_conditions(
        self, filters: GeneratedCVFilters
    ) -> List[Union[ColumnElement[bool], BooleanClauseList]]:
        """Build SQLAlchemy filter conditions from filter parameters."""
        conditions: List[Union[ColumnElement[bool], BooleanClauseList]] = []

        if filters.status:
            conditions.append(GeneratedCV.status.in_(filters.status))

        if filters.language_code:
            conditions.append(GeneratedCV.language_code == filters.language_code)

        if filters.job_description_id:
            conditions.append(
                GeneratedCV.job_description_id == filters.job_description_id
            )

        if filters.detailed_cv_id:
            conditions.append(GeneratedCV.detailed_cv_id == filters.detailed_cv_id)

        if filters.created_at:
            if filters.created_at.start:
                conditions.append(GeneratedCV.created_at >= filters.created_at.start)
            if filters.created_at.end:
                conditions.append(GeneratedCV.created_at <= filters.created_at.end)

        if filters.updated_at:
            if filters.updated_at.start:
                conditions.append(GeneratedCV.updated_at >= filters.updated_at.start)
            if filters.updated_at.end:
                conditions.append(GeneratedCV.updated_at <= filters.updated_at.end)

        if filters.search_query:
            # Search in CV content and metadata using case-insensitive search
            search_query = f"%{filters.search_query}%"
            conditions.append(
                or_(
                    GeneratedCV.content.ilike(search_query),
                    func.json_extract(
                        GeneratedCV.generation_parameters, "$.notes"
                    ).ilike(search_query),
                    GeneratedCV.status.ilike(search_query),
                )
            )

        return conditions

    def get_user_generated_cvs(
        self,
        user_id: int,
        filters: Optional[GeneratedCVFilters] = None,
        pagination: Optional[PaginationParams] = None,
    ) -> Tuple[List[GeneratedCV], int]:
        """Get all generated CVs for a user with filtering and pagination."""
        # Start with base query with eager loading of related entities
        query = (
            select(GeneratedCV)
            .where(GeneratedCV.user_id == user_id)
            .options(
                joinedload(GeneratedCV.detailed_cv),
                joinedload(GeneratedCV.job_description),
            )
        )

        # Initialize count query
        count_query = (
            select(func.count())
            .select_from(GeneratedCV)
            .where(GeneratedCV.user_id == user_id)
        )

        # Apply filters if provided
        if filters:
            conditions = self._build_filter_conditions(filters)
            if conditions:
                combined_filter = and_(*conditions)
                query = query.where(combined_filter)
                count_query = count_query.where(combined_filter)

        # Get total count before pagination
        total = self.db.scalar(count_query) or 0

        # Apply pagination if provided
        if pagination:
            query = query.offset(pagination.offset).limit(pagination.limit)

        # Order by most recent first
        query = query.order_by(GeneratedCV.created_at.desc())

        # Execute query and convert results to list
        results = list(self.db.execute(query).unique().scalars().all())
        return results, total

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
