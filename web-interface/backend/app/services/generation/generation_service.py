"""Implementation of CV generation service using SQLModel."""

from typing import Any, Dict, List, Optional, Tuple

from sqlmodel import Session

from cv_adapter.core.async_application import AsyncCVAdapterApplication
from cv_adapter.dto.cv import CVDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import Language
from cv_adapter.models.context import language_context
from cv_adapter.renderers.json_renderer import JSONRenderer
from cv_adapter.renderers.markdown import MarkdownRenderer

from ...logger import logger
from ...models.sqlmodels import DetailedCV, GeneratedCV, JobDescription
from ...schemas.cv import GeneratedCVCreate, GeneratedCVResponse, GenerationStatus
from ..repositories import CVRepository, EntityNotFoundError
from .protocols import GenerationError, ValidationError


class CVGenerationServiceImpl:
    """Concrete implementation of CV generation service."""

    def __init__(
        self, db: Session, adapter: Optional[AsyncCVAdapterApplication] = None
    ):
        self.db = db
        self.repository = CVRepository(db)
        self.adapter = adapter
        self.json_renderer = JSONRenderer()
        self.markdown_renderer = MarkdownRenderer()

    async def generate_competences(
        self,
        cv_text: str,
        job_description: str,
        notes: Optional[str] = None,
        language: Language = Language(code="en"),
    ) -> List[CoreCompetenceDTO]:
        """Generate core competences from CV and job description."""
        if not self.adapter:
            raise GenerationError("CV adapter not initialized")

        try:
            with language_context(language):
                return await self.adapter.generate_core_competences(
                    cv_text=cv_text, job_description=job_description, notes=notes
                )
        except Exception as e:
            logger.error(f"Error generating competences: {str(e)}", exc_info=True)
            raise GenerationError(str(e))

    async def generate_cv(
        self,
        cv_text: str,
        job_description: str,
        personal_info: PersonalInfoDTO,
        competences: List[CoreCompetenceDTO],
        notes: Optional[str] = None,
        language: Language = Language(code="en"),
    ) -> CVDTO:
        """Generate a complete CV using core competences."""
        if not self.adapter:
            raise GenerationError("CV adapter not initialized")

        try:
            with language_context(language):
                return await self.adapter.generate_cv_with_competences(
                    cv_text=cv_text,
                    job_description=job_description,
                    personal_info=personal_info,
                    core_competences=competences,
                    notes=notes,
                )
        except Exception as e:
            logger.error(f"Error generating CV: {str(e)}", exc_info=True)
            raise GenerationError(str(e))

    async def get_generation_status(
        self, cv_id: int
    ) -> Tuple[GenerationStatus, Optional[str]]:
        """Get the generation status of a CV."""
        cv = self.repository.get_generated_cv(cv_id)
        if not cv:
            raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

        # Convert to Python types to avoid SQLModel type issues
        gen_status = str(cv.generation_status or "completed")
        err_msg = str(cv.error_message) if cv.error_message else None

        return GenerationStatus(gen_status), err_msg

    async def update_generation_status(
        self,
        cv_id: int,
        status: GenerationStatus,
        error_message: Optional[str] = None,
    ) -> None:
        """Update the generation status of a CV."""
        cv = self.repository.get_generated_cv(cv_id)
        if not cv:
            raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

        cv.generation_status = status.value
        cv.error_message = error_message
        self.db.commit()

    async def generate_and_store_cv(
        self,
        user_id: int,
        detailed_cv_id: int,
        job_description_id: int,
        language_code: str,
        generation_parameters: Optional[Dict[str, Any]] = None,
        notes: Optional[str] = None,
        initial_cv_id: Optional[int] = None,
    ) -> GeneratedCV:
        """Generate and save a CV to the database."""
        # Fetch required data
        detailed_cv = self.repository.get_detailed_cv(detailed_cv_id)
        if not detailed_cv:
            raise EntityNotFoundError(f"Detailed CV with id {detailed_cv_id} not found")

        job = self.repository.get_job_description(job_description_id)
        if not job:
            raise EntityNotFoundError(
                f"Job description with id {job_description_id} not found"
            )

        # Get existing CV or create new one
        if initial_cv_id:
            stored_cv = self.repository.get_generated_cv(initial_cv_id)
            if not stored_cv:
                raise EntityNotFoundError(
                    f"Generated CV with id {initial_cv_id} not found"
                )
            cv_id = initial_cv_id
        else:
            # Create CV record with generating status
            cv_data = GeneratedCVCreate(
                detailed_cv_id=detailed_cv_id,
                job_description_id=job_description_id,
                language_code=language_code,
                content={},  # Empty dict, will be filled after generation
                status="draft",
                generation_parameters=generation_parameters or {},
            )
            # Create and validate CV
            stored_cv = self.create_generated_cv(user_id, cv_data)
            if not stored_cv or stored_cv.id is None:
                raise GenerationError("Failed to create CV record")
            cv_id = stored_cv.id
        await self.update_generation_status(cv_id, GenerationStatus.GENERATING)

        try:
            # Generate CV content
            generated_cv = await self._generate_cv_content(
                detailed_cv=detailed_cv,
                job=job,
                language_code=language_code,
                notes=notes,
            )

            # Get fresh instance after generation
            refreshed_cv = self.repository.get_generated_cv(cv_id)
            if not refreshed_cv:
                raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

            # Store JSON-serializable version in database
            refreshed_cv.content = generated_cv.model_dump(mode="json")
            await self.update_generation_status(cv_id, GenerationStatus.COMPLETED)
            self.db.commit()

            return refreshed_cv

        except Exception as e:
            logger.error(f"Error in generate_and_store_cv: {str(e)}", exc_info=True)
            await self.update_generation_status(cv_id, GenerationStatus.FAILED, str(e))
            raise GenerationError(str(e))

    async def update_cv_status(
        self,
        cv_id: int,
        status: str,
    ) -> GeneratedCVResponse:
        """Update the status of a generated CV."""
        try:
            if status not in ["draft", "approved", "rejected"]:
                raise ValidationError(f"Invalid status: {status}")

            cv = self.repository.get_generated_cv(cv_id)
            if not cv:
                raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

            cv.status = status
            self.db.commit()
            self.db.refresh(cv)

            return GeneratedCVResponse.model_validate(cv)

        except EntityNotFoundError:
            raise
        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error updating CV status: {str(e)}", exc_info=True)
            raise GenerationError(str(e))

    async def update_generation_parameters(
        self,
        cv_id: int,
        parameters: Dict[str, Any],
    ) -> GeneratedCVResponse:
        """Update generation parameters for a CV."""
        try:
            # Validate parameters structure if needed
            if not isinstance(parameters, dict):
                raise ValidationError("Generation parameters must be a dictionary")

            cv = self.repository.get_generated_cv(cv_id)
            if not cv:
                raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

            cv.generation_parameters = parameters
            self.db.commit()
            self.db.refresh(cv)

            return GeneratedCVResponse.model_validate(cv)

        except EntityNotFoundError:
            raise
        except ValidationError:
            raise
        except Exception as e:
            logger.error(
                f"Error updating generation parameters: {str(e)}", exc_info=True
            )
            raise GenerationError(str(e))

    async def _generate_cv_content(
        self,
        detailed_cv: DetailedCV,
        job: JobDescription,
        language_code: str,
        notes: Optional[str] = None,
    ) -> CVDTO:
        """Helper method to generate CV content from detailed CV and job description."""
        try:
            cv_text = str(detailed_cv.content or "").strip()
            description = str(job.description or "").strip()

            # Create basic personal info
            personal_info = PersonalInfoDTO(full_name="")

            # Generate competences first
            competences = await self.generate_competences(
                cv_text=cv_text,
                job_description=description,
                notes=notes,
                language=Language(code=language_code),
            )

            # Generate complete CV
            return await self.generate_cv(
                cv_text=cv_text,
                job_description=description,
                personal_info=personal_info,
                competences=competences,
                notes=notes,
                language=Language(code=language_code),
            )

        except Exception as e:
            logger.error(f"Error in _generate_cv_content: {str(e)}", exc_info=True)
            raise GenerationError(str(e))

    def create_generated_cv(
        self, user_id: int, cv_data: GeneratedCVCreate
    ) -> GeneratedCV:
        """Create a new generated CV."""
        cv = GeneratedCV(user_id=user_id, **cv_data.model_dump())
        self.db.add(cv)
        self.db.commit()
        self.db.refresh(cv)
        return cv

    def get(self, cv_id: int) -> Optional[GeneratedCV]:
        """Get a generated CV by ID."""
        return self.repository.get_generated_cv(cv_id)
