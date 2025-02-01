from typing import List, Optional
import asyncio

from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import (
    CVDTO,
    CoreCompetenceDTO,
    MinimalCVDTO,
    PersonalInfoDTO,
    TitleDTO,
)
from cv_adapter.models.context import get_current_language
from cv_adapter.renderers.markdown import (
    CoreCompetencesRenderer,
    MinimalMarkdownRenderer,
)
from cv_adapter.services.generators import (
    ComponentGenerationContext,
    CoreCompetenceGenerationContext,
    create_core_competence_generator,
    create_education_generator,
    create_experience_generator,
    create_skills_generator,
    create_summary_generator,
    create_title_generator,
)

class AsyncCVAdapterApplication:
    """Asynchronous main application class that orchestrates the CV adaptation workflow.

    This class provides two ways to generate a CV:

    1. Single-step generation using `generate_cv`:
       ```python
       cv = await app.generate_cv(cv_text, job_description, personal_info)
       ```

    2. Two-step generation with core competences review:
       ```python
       # First generate core competences for review
       core_competences = await app.generate_core_competences(cv_text, job_description)

       # After reviewing/modifying core competences, generate complete CV
       cv = await app.generate_cv_with_competences(
           cv_text, job_description, personal_info, core_competences
       )
       ```

    The two-step approach allows users to review and potentially modify the generated
    core competences before they are used to generate the rest of the CV components.
    This can be particularly useful when you want to ensure the core competences
    accurately reflect the candidate's strengths in relation to the job requirements.
    """

    def __init__(
        self,
        ai_model: KnownModelName = "openai:gpt-4o",
    ) -> None:
        """Initialize the application with an AI model.

        Args:
            ai_model: AI model to use for all generators. Defaults to OpenAI GPT-4o.
        """
        self.competence_generator = asyncio.create_task(create_core_competence_generator(ai_model=ai_model))
        self.experience_generator = asyncio.create_task(create_experience_generator(ai_model=ai_model))
        self.education_generator = asyncio.create_task(create_education_generator(ai_model=ai_model))
        self.skills_generator = asyncio.create_task(create_skills_generator(ai_model=ai_model))
        self.summary_generator = asyncio.create_task(create_summary_generator(
            MinimalMarkdownRenderer(), ai_model=ai_model
        ))
        self.title_generator = asyncio.create_task(create_title_generator(ai_model=ai_model))

    async def generate_core_competences(
        self,
        cv_text: str,
        job_description: str,
        notes: Optional[str] = None,
    ) -> List[CoreCompetenceDTO]:
        """Generate core competences for review.

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            notes: Optional user notes to guide the generation process

        Returns:
            List of generated core competences for review

        Raises:
            RuntimeError: If language context is not set
        """
        generator = await self.competence_generator
        return await generator(
            CoreCompetenceGenerationContext(
                cv=cv_text,
                job_description=job_description,
                notes=notes,
            )
        )

    async def generate_cv_with_competences(
        self,
        cv_text: str,
        job_description: str,
        personal_info: PersonalInfoDTO,
        core_competences: List[CoreCompetenceDTO],
        notes: Optional[str] = None,
    ) -> CVDTO:
        """Generate a complete CV using provided core competences.

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            personal_info: Personal information to include in the CV
            core_competences: Pre-generated and confirmed core competences
            notes: Optional user notes to guide the generation process

        Returns:
            A new CV DTO adapted to the job description

        Raises:
            RuntimeError: If language context is not set
        """
        # Get current language from context
        language = get_current_language()
        # Convert competences to markdown for other generators
        core_competences_md = CoreCompetencesRenderer.render_to_markdown(
            core_competences
        )

        # Create context once for all generators
        generation_context = ComponentGenerationContext(
            cv=cv_text,
            job_description=job_description,
            core_competences=core_competences_md,
            notes=notes,
        )

        # Generate independent components concurrently
        generators = await asyncio.gather(
            self.experience_generator,
            self.education_generator,
            self.skills_generator,
            self.title_generator,
        )

        experience_gen, education_gen, skills_gen, title_gen = generators

        # Run generators concurrently
        experiences_dto, education_dto, skills_dto, title_dto = await asyncio.gather(
            experience_gen(generation_context),
            education_gen(generation_context),
            skills_gen(generation_context),
            title_gen(generation_context),
        )

        # Create minimal CV for summary generation
        minimal_cv_dto = MinimalMarkdownRenderer().render_to_string(
            MinimalCVDTO(
                title=title_dto,
                core_competences=core_competences,
                experiences=experiences_dto,
                education=education_dto,
                skills=skills_dto,
                language=language,
            )
        )

        # Generate summary using minimal CV
        summary_gen = await self.summary_generator
        summary_dto = await summary_gen(
            ComponentGenerationContext(
                cv=minimal_cv_dto,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )
        )

        # Create final CV
        return CVDTO(
            personal_info=personal_info,
            title=title_dto,
            summary=summary_dto,
            core_competences=core_competences,
            experiences=experiences_dto,
            education=education_dto,
            skills=skills_dto,
            language=language,
        )

    async def generate_cv(
        self,
        cv_text: str,
        job_description: str,
        personal_info: PersonalInfoDTO,
        notes: Optional[str] = None,
    ) -> CVDTO:
        """Generate a new CV adapted to the job description in a single step.

        This method generates the complete CV in one step without the opportunity to
        review core competences. If you need to review and potentially modify the
        core competences before generating the complete CV, use the two-step process:
        1. `generate_core_competences()`
        2. `generate_cv_with_competences()`

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            personal_info: Personal information to include in the CV
            notes: Optional user notes to guide the generation process

        Returns:
            A new CV DTO adapted to the job description
        """
        # 1. Generate core competences
        core_competences = await self.generate_core_competences(
            cv_text=cv_text,
            job_description=job_description,
            notes=notes,
        )

        # 2. Generate complete CV using the generated competences
        return await self.generate_cv_with_competences(
            cv_text=cv_text,
            job_description=job_description,
            personal_info=personal_info,
            core_competences=core_competences,
            notes=notes,
        )
