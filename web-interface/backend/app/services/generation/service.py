"""Implementation of CV generation service."""

from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from cv_adapter.core.async_application import AsyncCVAdapterApplication
from cv_adapter.dto.cv import CVDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import Language
from cv_adapter.models.context import language_context
from cv_adapter.renderers.markdown import MarkdownRenderer

from ...logger import logger
from ...models.models import DetailedCV, JobDescription
from ...schemas.cv import GeneratedCVCreate, GeneratedCVResponse
from ..repositories import CVRepository, EntityNotFoundError
from .protocols import GenerationError, ValidationError


class CVGenerationServiceImpl:
    """Concrete implementation of CV generation service."""

    def __init__(self, db: Session, adapter: AsyncCVAdapterApplication):
        self.repository = CVRepository(db)
        self.adapter = adapter
        self.renderer = MarkdownRenderer()

    async def generate_competences(
        self,
        cv_text: str,
        job_description: str,
        notes: Optional[str] = None,
        language: Language = Language(code="en"),
    ) -> List[CoreCompetenceDTO]:
        """Generate core competences from CV and job description."""
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

    async def generate_and_store_cv(
        self,
        user_id: int,
        detailed_cv_id: int,
        job_description_id: int,
        language_code: str,
        generation_parameters: Optional[Dict] = None,
        notes: Optional[str] = None,
    ) -> GeneratedCVResponse:
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

        try:
            # Generate CV content
            generated_cv = await self._generate_cv_content(
                detailed_cv=detailed_cv,
                job=job,
                language_code=language_code,
                notes=notes,
            )

            # Convert CV DTO to markdown
            cv_content = self.renderer.render_to_string(generated_cv)

            # Prepare data for storage
            cv_data = GeneratedCVCreate(
                detailed_cv_id=detailed_cv_id,
                job_description_id=job_description_id,
                language_code=language_code,
                content=cv_content,
                status="draft",
                generation_parameters=generation_parameters or {},
                version=1,  # Initial version
            )

            # Store the generated CV
            stored_cv = self.repository.save_generated_cv(user_id, cv_data)
            return GeneratedCVResponse.model_validate(stored_cv)

        except Exception as e:
            logger.error(f"Error in generate_and_store_cv: {str(e)}", exc_info=True)
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

            updated_cv = self.repository.update_status(cv_id, status)
            if not updated_cv:
                raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

            return GeneratedCVResponse.model_validate(updated_cv)

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
        parameters: Dict,
    ) -> GeneratedCVResponse:
        """Update generation parameters for a CV."""
        try:
            # Validate parameters structure if needed
            if not isinstance(parameters, dict):
                raise ValidationError("Generation parameters must be a dictionary")

            updated_cv = self.repository.update_parameters(cv_id, parameters)
            if not updated_cv:
                raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

            return GeneratedCVResponse.model_validate(updated_cv)

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
            # The content is markdown text
            cv_text = str(detailed_cv.content)
            description = str(job.description) if job.description is not None else ""

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
