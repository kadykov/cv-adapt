"""Job-related database services using SQLModel."""

from typing import Any, Dict, Sequence

from sqlmodel import Session, select

from ..models.sqlmodels import JobDescription
from ..schemas.cv import JobDescriptionCreate, JobDescriptionUpdate
from .sqlmodel_base import SQLModelService


class JobDescriptionSQLModelService(SQLModelService[JobDescription]):
    """Service for handling job description operations using SQLModel."""

    def __init__(self, db: Session):
        """Initialize service with database session."""
        super().__init__(db, JobDescription)

    def get_by_language(self, language_code: str) -> Sequence[JobDescription]:
        """Get job descriptions by language."""
        statement = select(JobDescription).where(
            JobDescription.language_code == language_code
        )
        return self.db.exec(statement).all()

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
