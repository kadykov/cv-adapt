from typing import Optional

from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import (
    CVDTO,
    MinimalCVDTO,
    PersonalInfoDTO,
    TitleDTO,
)
from cv_adapter.dto.language import ENGLISH, Language
from cv_adapter.models.language_context import language_context
from cv_adapter.renderers.markdown import (
    CoreCompetencesRenderer,
    MinimalMarkdownRenderer,
)
from cv_adapter.services.generators.competence_generator import create_core_competence_generator
from cv_adapter.services.generators.education_generator import create_education_generator
from cv_adapter.services.generators.experience_generator import create_experience_generator
from cv_adapter.services.generators.skills_generator import create_skills_generator
from cv_adapter.services.generators.summary_generator import create_summary_generator
from cv_adapter.services.generators.title_generator import create_title_generator


class CVAdapterApplication:
    """Main application class that orchestrates the CV adaptation workflow."""

    def __init__(
        self,
        ai_model: KnownModelName = "openai:gpt-4o",
    ) -> None:
        """Initialize the application with an AI model.

        Args:
            ai_model: AI model to use for all generators. Defaults to OpenAI GPT-4o.
        """
        self.competence_generator = create_core_competence_generator(ai_model=ai_model)
        self.experience_generator = create_experience_generator(ai_model=ai_model)
        self.education_generator = create_education_generator(ai_model=ai_model)
        self.skills_generator = create_skills_generator(ai_model=ai_model)
        self.summary_generator = create_summary_generator(
            MinimalMarkdownRenderer(), ai_model=ai_model
        )
        self.title_generator = create_title_generator(ai_model=ai_model)

    def generate_cv(
        self,
        cv_text: str,
        job_description: str,
        personal_info: PersonalInfoDTO,
        notes: Optional[str] = None,
        language: Language = ENGLISH,
    ) -> CVDTO:
        """
        Generate a new CV adapted to the job description.

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            personal_info: Personal information to include in the CV
            notes: Optional user notes to guide the generation process
            language: Language for CV generation. Defaults to English.

        Returns:
            A new CV DTO adapted to the job description
        """
        # Use language context to ensure generators are called in the right context
        with language_context(language):
            # 1. Generate core competences
            core_competences_dto = self.competence_generator.generate(
                cv=cv_text,
                job_description=job_description,
                notes=notes,
            )
            core_competences_md = CoreCompetencesRenderer.render_to_markdown(
                core_competences_dto
            )

            # 2. Generate other components
            experiences_dto = self.experience_generator.generate(
                cv=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )

            education_dto = self.education_generator.generate(
                cv=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )

            skills_dto = self.skills_generator.generate(
                cv=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )

            title_dto: TitleDTO = self.title_generator.generate(
                cv=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )

            # 3. Create minimal CV for summary generation
            minimal_cv_dto = MinimalMarkdownRenderer().render_to_string(
                MinimalCVDTO(
                    title=title_dto,
                    core_competences=core_competences_dto,
                    experiences=experiences_dto,
                    education=education_dto,
                    skills=skills_dto,
                    language=language,
                )
            )

            # 4. Generate summary
            summary_dto = self.summary_generator.generate(
                cv=minimal_cv_dto,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )

        # 5. Create final CV
        return CVDTO(
            personal_info=personal_info,
            title=title_dto,
            summary=summary_dto,
            core_competences=core_competences_dto,
            experiences=experiences_dto,
            education=education_dto,
            skills=skills_dto,
            language=language,
        )
