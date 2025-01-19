from typing import List

from cv_adapter.models.cv import (
    CV,
    CoreCompetence,
    CoreCompetences,
    CVDescription,
    MinimalCV,
)
from cv_adapter.renderers.minimal_markdown_renderer import MinimalMarkdownRenderer
from cv_adapter.services.competence_analyzer import CompetenceAnalyzer
from cv_adapter.services.cv_adapter import CVAdapter
from cv_adapter.services.description_generator import DescriptionGenerator
from cv_adapter.services.education_generator import EducationGenerator
from cv_adapter.services.experience_generator import ExperienceGenerator
from cv_adapter.services.skills_generator import SkillsGenerator

CompetenceList = List[CoreCompetence]


class CVAdapterApplication:
    """Main application class that orchestrates the CV adaptation workflow."""

    def __init__(self) -> None:
        self.competence_analyzer = CompetenceAnalyzer()
        self.cv_adapter = CVAdapter()
        self.experience_generator = ExperienceGenerator()
        self.education_generator = EducationGenerator()
        self.skills_generator = SkillsGenerator()
        self.description_generator = DescriptionGenerator(MinimalMarkdownRenderer())

    def generate_cv(
        self, cv_text: str, job_description: str, notes: str | None = None
    ) -> CV:
        """
        Generate a new CV adapted to the job description.

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            notes: Optional user notes to guide the generation process

        Returns:
            A new CV instance adapted to the job description
        """
        # 1. Generate components
        core_competences_list = self.competence_analyzer.analyze(
            cv_text, job_description, user_notes=notes
        ).items
        core_competences = CoreCompetences(items=core_competences_list)
        experiences = self.experience_generator.generate(
            cv_text, job_description, core_competences.to_list(), notes=notes
        )
        education = self.education_generator.generate(
            cv_text, job_description, core_competences.to_list(), notes=notes
        )
        skills = self.skills_generator.generate(
            cv_text, job_description, core_competences.to_list(), notes=notes
        )

        # 2. Create minimal CV for description generation
        minimal_cv = MinimalCV(
            core_competences=core_competences,
            experiences=experiences,
            education=education,
            skills=skills,
        )

        # 3. Generate description and create final CV
        # Parse the original CV text to get the CV model
        cv_model = CV.model_validate_json(cv_text)

        # Generate description with notes
        description = self.description_generator.generate(
            minimal_cv, job_description, user_notes=notes
        )

        return CV(
            full_name=cv_model.full_name,
            title=cv_model.title,
            description=CVDescription(text=str(description)),
            core_competences=core_competences,
            experiences=experiences,
            education=education,
            skills=skills,
            contacts=cv_model.contacts,
        )

    def suggest_core_competences(self, cv: CV, job_description: str) -> CompetenceList:
        """
        Analyze the CV and suggest potential core competences.
        """
        return self.competence_analyzer.analyze(str(cv), job_description).items

    def validate_competences(self, competences: CompetenceList) -> List[str]:
        """
        Validate selected core competences and return any warnings.
        """
        # For now, no validation is performed
        return []

    def adapt_cv(self, cv: CV, core_competences: CompetenceList) -> CV:
        """
        Adapt the CV based on selected core competences.
        """
        return self.cv_adapter.adapt_cv(cv, core_competences)
