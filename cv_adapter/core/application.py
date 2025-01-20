from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import CV, MinimalCV
from cv_adapter.models.personal_info import PersonalInfo
from cv_adapter.renderers.core_competences_renderer import CoreCompetencesRenderer
from cv_adapter.renderers.minimal_markdown_renderer import MinimalMarkdownRenderer
from cv_adapter.services.competence_analyzer import CompetenceAnalyzer
from cv_adapter.services.description_generator import DescriptionGenerator
from cv_adapter.services.education_generator import EducationGenerator
from cv_adapter.services.experience_generator import ExperienceGenerator
from cv_adapter.services.skills_generator import SkillsGenerator
from cv_adapter.services.title_generator import TitleGenerator


class CVAdapterApplication:
    """Main application class that orchestrates the CV adaptation workflow."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the application with an AI model.

        Args:
            ai_model: AI model to use for all generators. Defaults to OpenAI GPT-4o.
        """
        self.competence_analyzer = CompetenceAnalyzer(ai_model=ai_model)
        self.experience_generator = ExperienceGenerator(ai_model=ai_model)
        self.education_generator = EducationGenerator(ai_model=ai_model)
        self.skills_generator = SkillsGenerator(ai_model=ai_model)
        self.description_generator = DescriptionGenerator(
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
        core_competences = self.competence_analyzer.analyze(
            cv_text, job_description, user_notes=notes
        )
        core_competences_md = CoreCompetencesRenderer.render_to_markdown(
            core_competences
        )
        experiences = self.experience_generator.generate(
            cv_text, job_description, core_competences_md, notes=notes
        )
        education = self.education_generator.generate(
            cv_text, job_description, core_competences_md, notes=notes
        )
        skills = self.skills_generator.generate(
            cv_text, job_description, core_competences_md, notes=notes
        )

        # 2. Create minimal CV for description generation
        title = self.title_generator.generate(
            cv_text,
            job_description,
            core_competences_md,
            notes=notes,
        )
        minimal_cv = MinimalCV(
            title=title,
            core_competences=core_competences,
            experiences=experiences,
            education=education,
            skills=skills,
        )

        # 3. Generate description and create final CV
        description = self.description_generator.generate(
            minimal_cv, job_description, user_notes=notes
        )

        return CV(
            personal_info=personal_info,
            title=title,
            description=description,
            core_competences=core_competences,
            experiences=experiences,
            education=education,
            skills=skills,
        )
