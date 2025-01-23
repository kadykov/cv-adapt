from typing import Optional

from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import (
    CV,
    Company,
    Education,
    Experience,
    MinimalCV,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)
from cv_adapter.models.cv import CoreCompetence as CVCoreCompetence
from cv_adapter.models.cv import CoreCompetences as CVCoreCompetences
from cv_adapter.models.language import Language
from cv_adapter.models.language_context_models import (
    Education as LanguageContextEducation,
)
from cv_adapter.models.language_context_models import (
    Experience as LanguageContextExperience,
)
from cv_adapter.models.language_context_models import (
    Skills as LanguageContextSkills,
)
from cv_adapter.models.language_context_models import (
    Title as LanguageContextTitle,
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

    def __init__(
        self,
        ai_model: KnownModelName = "openai:gpt-4o",
        language: Language = Language.ENGLISH,
    ) -> None:
        """Initialize the application with an AI model and language.

        Args:
            ai_model: AI model to use for all generators. Defaults to OpenAI GPT-4o.
            language: Language for CV generation. Defaults to English.
        """
        self.competence_generator = CompetenceGenerator(ai_model=ai_model)
        self.experience_generator = ExperienceGenerator(ai_model=ai_model)
        self.education_generator = EducationGenerator(ai_model=ai_model)
        self.skills_generator = SkillsGenerator(ai_model=ai_model)
        self.summary_generator = SummaryGenerator(
            MinimalMarkdownRenderer(), ai_model=ai_model
        )
        self.title_generator = TitleGenerator(ai_model=ai_model)
        self.language = language

    def generate_cv(
        self,
        cv_text: str,
        job_description: str,
        personal_info: PersonalInfo,
        notes: Optional[str] = None,
        language: Optional[Language] = None,
    ) -> CV:
        """
        Generate a new CV adapted to the job description.

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            personal_info: Personal information to include in the CV
            notes: Optional user notes to guide the generation process
            language: Optional language override for this specific CV generation

        Returns:
            A new CV instance adapted to the job description
        """
        # Use method-level language if provided, otherwise use class-level language
        current_language = language or self.language

        # 1. Generate core competences
        core_competences = self.competence_generator.generate(
            cv=cv_text,
            job_description=job_description,
            notes=notes,
            language=current_language,
        )
        core_competences_md = CoreCompetencesRenderer.render_to_markdown(
            CVCoreCompetences(
                items=[
                    CVCoreCompetence(text=comp.text, language=current_language)
                    for comp in core_competences.items
                ],
                language=current_language,
            )
        )

        # 2. Generate other components
        experiences_lc: list[LanguageContextExperience] = (
            self.experience_generator.generate(
                cv=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
                language=current_language,
            )
        )
        experiences: list[Experience] = [
            Experience(
                position=exp.position,
                company=Company(
                    name=exp.company.name,
                    description=None,
                    location=None,
                    language=current_language,
                ),
                start_date=exp.start_date,
                end_date=exp.end_date,
                description=exp.description,
                technologies=[],  # Add empty list as technologies is required
                language=current_language,
            )
            for exp in experiences_lc
        ]

        education_lc: list[LanguageContextEducation] = (
            self.education_generator.generate(
                cv=cv_text,
                job_description=job_description,
                core_competences=core_competences_md,
                notes=notes,
                language=current_language,
            )
        )
        education: list[Education] = [
            Education(
                degree=edu.degree,
                university=University(
                    name=edu.university.name,
                    description=None,
                    location=None,
                    language=current_language,
                ),
                start_date=edu.start_date,
                end_date=edu.end_date,
                description=edu.description,
                language=current_language,
            )
            for edu in education_lc
        ]

        skills_lc: LanguageContextSkills = self.skills_generator.generate(
            cv=cv_text,
            job_description=job_description,
            core_competences=core_competences_md,
            notes=notes,
            language=current_language,
        )
        skills: Skills = Skills(
            groups=[
                SkillGroup(
                    name="Technical Skills",
                    skills=[
                        Skill(text=skill.text, language=current_language)
                        for skill in skills_lc.groups[0].skills
                    ],
                    language=current_language,
                ),
                SkillGroup(
                    name="Soft Skills",
                    skills=[
                        Skill(text=skill.text, language=current_language)
                        for skill in skills_lc.groups[1].skills
                    ],
                    language=current_language,
                ),
            ],
            language=current_language,
        )

        title_lc: LanguageContextTitle = self.title_generator.generate(
            cv=cv_text,
            job_description=job_description,
            core_competences=core_competences_md,
            notes=notes,
            language=current_language,
        )
        title: Title = Title(text=title_lc.text, language=current_language)

        # 3. Create minimal CV for summary generation
        minimal_cv = MinimalCV(
            title=title,
            core_competences=CVCoreCompetences(
                items=[
                    CVCoreCompetence(text=comp.text, language=current_language)
                    for comp in core_competences.items
                ],
                language=current_language,
            ),
            experiences=experiences,
            education=education,
            skills=skills,
            language=current_language,
        )

        # 4. Generate summary
        cv_text_for_summary = MinimalMarkdownRenderer().render_to_string(minimal_cv)
        summary = self.summary_generator.generate(
            cv=cv_text_for_summary,
            job_description=job_description,
            core_competences=core_competences_md,
            notes=notes,
            language=current_language,
        )

        # 5. Create final CV
        return CV(
            personal_info=personal_info,
            title=title,
            summary=summary,
            core_competences=CVCoreCompetences(
                items=[
                    CVCoreCompetence(text=comp.text, language=current_language)
                    for comp in core_competences.items
                ],
                language=current_language,
            ),
            experiences=experiences,
            education=education,
            skills=skills,
            language=current_language,
        )
