from typing import List

from cv_adapter.models.cv import CV, CoreCompetence
from cv_adapter.services.competence_analyzer import CompetenceAnalyzer
from cv_adapter.services.cv_adapter import CVAdapter


class CVAdapterApplication:
    """Main application class that orchestrates the CV adaptation workflow."""

    def __init__(self) -> None:
        self.competence_analyzer = CompetenceAnalyzer()
        self.cv_adapter = CVAdapter()

    def suggest_core_competences(self, cv: CV) -> List[CoreCompetence]:
        """
        Analyze the CV and suggest potential core competences.
        """
        return self.competence_analyzer.extract_potential_competences(cv.experiences)

    def validate_competences(self, competences: List[CoreCompetence]) -> List[str]:
        """
        Validate selected core competences and return any warnings.
        """
        return self.competence_analyzer.validate_competences(competences)

    def adapt_cv(self, cv: CV, core_competences: List[CoreCompetence]) -> CV:
        """
        Adapt the CV based on selected core competences.
        """
        return self.cv_adapter.adapt_cv(cv, core_competences)
