from typing import List

from cv_adapter.models.cv import CV, CoreCompetence
from cv_adapter.services.competence_analyzer import CompetenceAnalyzer
from cv_adapter.services.cv_adapter import CVAdapter

CompetenceList = List[CoreCompetence]


class CVAdapterApplication:
    """Main application class that orchestrates the CV adaptation workflow."""

    def __init__(self) -> None:
        self.competence_analyzer = CompetenceAnalyzer()
        self.cv_adapter = CVAdapter()

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
