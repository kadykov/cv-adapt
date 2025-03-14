"""Implementation of CV generation service."""

from typing import Any, Dict, List, Optional, Set, cast

from sqlalchemy.orm import Session

from cv_adapter.core.async_application import AsyncCVAdapterApplication
from cv_adapter.dto.cv import CVDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import Language
from cv_adapter.models.context import language_context
from cv_adapter.renderers.markdown import MarkdownRenderer

from ...core.exceptions import GenerationError, ValidationError
from ...logger import logger
from ...models.models import DetailedCV, JobDescription
from ...schemas.cv import GeneratedCVCreate, GeneratedCVResponse
from ..repositories import CVRepository, EntityNotFoundError


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
        detailed_cv = self.repository.get_detailed_cv(cast(int, detailed_cv_id))
        if not detailed_cv:
            raise EntityNotFoundError(f"Detailed CV with id {detailed_cv_id} not found")

        job = self.repository.get_job_description(cast(int, job_description_id))
        if not job:
            raise EntityNotFoundError(
                f"Job description with id {job_description_id} not found"
            )

        try:
            # Generate CV content
            generated_cv = await self._generate_cv_content(
                detailed_cv=detailed_cv,
                job=job,
                language_code=cast(str, language_code),
                notes=notes,
            )

            # Convert CV DTO to markdown
            cv_content = self.renderer.render_to_string(generated_cv)

            # Prepare data for storage
            cv_data = GeneratedCVCreate(
                detailed_cv_id=cast(int, detailed_cv_id),
                job_description_id=cast(int, job_description_id),
                language_code=cast(str, language_code),
                content=cv_content,
                status="draft",
                generation_parameters=generation_parameters or {},
                version=1,  # Initial version
            )

            # Store the generated CV
            stored_cv = self.repository.save_generated_cv(cast(int, user_id), cv_data)
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

    async def regenerate_cv(
        self,
        cv_id: int,
        generation_parameters: Optional[Dict[str, Any]] = None,
        keep_content: bool = False,
        sections_to_keep: Optional[List[str]] = None,
        notes: Optional[str] = None,
    ) -> GeneratedCVResponse:
        """Regenerate a CV based on an existing one with optional modifications."""
        try:
            # Get the original CV
            original_cv = self.repository.get_generated_cv(cv_id)
            if not original_cv:
                raise EntityNotFoundError(f"Generated CV with id {cv_id} not found")

            # Get required related data
            detailed_cv = self.repository.get_detailed_cv(
                cast(int, original_cv.detailed_cv_id)
            )
            job = self.repository.get_job_description(
                cast(int, original_cv.job_description_id)
            )

            if not detailed_cv or not job:
                raise EntityNotFoundError("Required CV data not found")

            # Generate new CV content
            new_cv_dto = await self._generate_cv_content(
                detailed_cv=detailed_cv,
                job=job,
                language_code=cast(str, original_cv.language_code),
                notes=notes,
            )

            # If keeping sections, merge with original content
            if keep_content and sections_to_keep:
                # Validate sections before proceeding
                self._validate_sections_to_keep(sections_to_keep)

                # Generate CVDTO from the original content
                original_cv_dto = await self._generate_cv_content(
                    detailed_cv=detailed_cv,
                    job=job,
                    language_code=cast(str, original_cv.language_code),
                    notes=None,
                )

                # Merge sections
                new_cv_dto = await self._merge_cv_sections(
                    original_cv_dto, new_cv_dto, set(sections_to_keep)
                )

            # Convert CV DTO to markdown
            cv_content = self.renderer.render_to_string(new_cv_dto)

            # Prepare data for storage
            if original_cv.generation_parameters is not None:
                base_params = cast(Dict[str, Any], original_cv.generation_parameters)
            else:
                base_params = {}
            new_params = generation_parameters or base_params or {}
            if notes:
                new_params["regeneration_notes"] = notes

            cv_data = GeneratedCVCreate(
                detailed_cv_id=cast(int, original_cv.detailed_cv_id),
                job_description_id=cast(int, original_cv.job_description_id),
                language_code=cast(str, original_cv.language_code),
                content=cv_content,
                status="draft",  # Always start as draft
                generation_parameters=new_params,
                version=cast(int, original_cv.version) + 1,  # Increment version
            )

            # Store the regenerated CV
            stored_cv = self.repository.save_generated_cv(
                cast(int, original_cv.user_id), cv_data
            )
            return GeneratedCVResponse.model_validate(stored_cv)

        except (EntityNotFoundError, ValidationError):
            raise
        except Exception as e:
            logger.error(f"Error regenerating CV: {str(e)}", exc_info=True)
            raise GenerationError(str(e))

    async def _merge_cv_sections(
        self, original_cv: CVDTO, new_cv: CVDTO, sections_to_keep: Set[str]
    ) -> CVDTO:
        """Merge sections from original CV into new CV."""
        try:
            # Create mapping of section names to attributes
            section_map = {
                "summary": "summary",
                "experiences": "experiences",
                "education": "education",
                "skills": "skills",
                "core_competences": "core_competences",
            }

            # Copy specified sections from original to new CV
            for section_name, attr_name in section_map.items():
                if section_name in sections_to_keep:
                    try:
                        setattr(new_cv, attr_name, getattr(original_cv, attr_name))
                    except AttributeError as attr_error:
                        logger.error(
                            f"Failed to copy section {section_name}: {str(attr_error)}"
                        )
                        raise ValidationError(f"Failed to copy section {section_name}")

            return new_cv

        except ValidationError:
            raise
        except Exception as e:
            logger.error(f"Error merging CV sections: {str(e)}", exc_info=True)
            raise GenerationError(f"Failed to merge CV sections: {str(e)}")

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

    def _validate_sections_to_keep(self, sections: List[str]) -> None:
        """Validate that the sections to keep are valid section names."""
        valid_sections = {
            "summary",
            "experiences",
            "education",
            "skills",
            "core_competences",
        }
        invalid_sections = set(sections) - valid_sections
        if invalid_sections:
            raise ValidationError(
                f"Invalid section names: {', '.join(invalid_sections)}. "
                f"Valid sections are: {', '.join(valid_sections)}"
            )

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
