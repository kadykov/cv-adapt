from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import CV, MinimalCV
from cv_adapter.models.generators import (
    CompetenceGeneratorInput,
    EducationGeneratorInput,
    ExperienceGeneratorInput,
    SkillsGeneratorInput,
    SummaryGeneratorInput,
    TitleGeneratorInput,
)
from cv_adapter.models.personal_info import PersonalInfo
from cv_adapter.renderers.markdown.core_competences_renderer import (
    CoreCompetencesRenderer,
)
from cv_adapter.renderers.markdown.minimal_markdown_renderer import (
    MinimalMarkdownRenderer,
)
from cv_adapter.services.generators.competence_generator import CompetenceGenerator
from cv_adapter.services.generators.education_generator import EducationGenerator
from cv_adapter.services.generators.experience_generator import ExperienceGenerator
from cv_adapter.services.generators.skills_generator import SkillsGenerator
from cv_adapter.services.generators.summary_generator import SummaryGenerator
from cv_adapter.services.generators.title_generator import TitleGenerator


class CVAdapterApplication:
    """Main application class that orchestrates the CV adaptation workflow."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the application with an AI model.

        Args:
            ai_model: AI model to use for all generators. Defaults to OpenAI GPT-4o.
        """
        self.competence_generator = CompetenceGenerator(ai_model=ai_model)
        self.experience_generator = ExperienceGenerator(ai_model=ai_model)
        self.education_generator = EducationGenerator(ai_model=ai_model)
        self.skills_generator = SkillsGenerator(ai_model=ai_model)
        self.summary_generator = SummaryGenerator(
            MinimalMarkdownRenderer(), ai_model=ai_model
        )
        self.title_generator = TitleGenerator(ai_model=ai_model)

    def generate_cv(
        self,
        cv_text: str,
        job_description: str,
        personal_info: PersonalInfo,
        notes: str | None = None,
    ) -> CV:
        """
        Generate a new CV adapted to the job description.

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            personal_info: Personal information to include in the CV
            notes: Optional user notes to guide the generation process

        Returns:
            A new CV instance adapted to the job description
        """
        # 1. Generate components
        core_competences = self.competence_generator.generate(
            CompetenceGeneratorInput(
                cv_text=cv_text,
                job_description=job_description,
                notes=notes,
            )
        )
        core_competences_md = CoreCompetencesRenderer.render_to_markdown(
            core_competences
        )

        # Generate components
        experiences = self.experience_generator.generate(
            ExperienceGeneratorInput(
                cv_text=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )
        )
        education = self.education_generator.generate(
            EducationGeneratorInput(
                cv_text=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )
        )
        skills = self.skills_generator.generate(
            SkillsGeneratorInput(
                cv_text=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )
        )
        title = self.title_generator.generate(
            TitleGeneratorInput(
                cv_text=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )
        )

        # 2. Create minimal CV for description generation
        minimal_cv = MinimalCV(
            title=title,
            core_competences=core_competences,
            experiences=experiences,
            education=education,
            skills=skills,
        )

        # 3. Generate summary and create final CV
        cv_text = MinimalMarkdownRenderer().render_to_string(minimal_cv)
        summary = self.summary_generator.generate(
            SummaryGeneratorInput(
                cv_text=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
            )
        )

        return CV(
            personal_info=personal_info,
            title=title,
            summary=summary,
            core_competences=core_competences,
            experiences=experiences,
            education=education,
            skills=skills,
        )
