from typing import List

from cv_adapter.models.cv import CV, CoreCompetence, MinimalCV
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

    def generate_cv(self, detailed_cv: CV, job_description: str) -> CV:
        """
        Generate a new CV adapted to the job description.
        
        Args:
            detailed_cv: The original detailed CV
            job_description: The job description to adapt the CV for
            
        Returns:
            A new CV instance adapted to the job description
        """
        # 1. Generate components
        core_competences = self.competence_analyzer.analyze(str(detailed_cv), job_description).items
        experiences = self.experience_generator.generate(detailed_cv, job_description, core_competences)
        education = self.education_generator.generate(detailed_cv, job_description, core_competences)
        skills = self.skills_generator.generate(detailed_cv, job_description, core_competences)

        # 2. Create minimal CV for description generation
        minimal_cv = MinimalCV(
            core_competences=core_competences,
            experiences=experiences,
            education=education,
            skills=skills
        )

        # 3. Generate description
        description = self.description_generator.generate(minimal_cv, job_description)

        # 4. Create final CV
        return CV(
            description=description,
            core_competences=core_competences,
            experiences=experiences,
            education=education,
            skills=skills,
            contact=detailed_cv.contact
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
