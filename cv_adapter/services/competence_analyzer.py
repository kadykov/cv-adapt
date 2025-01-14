from typing import List

from cv_adapter.models.cv import CoreCompetence, Experience


class CompetenceAnalyzer:
    """Service for analyzing and extracting core competences from experiences."""

    def extract_potential_competences(
        self, experiences: List[Experience]
    ) -> List[CoreCompetence]:
        """
        Analyze experiences and suggest potential core competences.
        This would use NLP/pattern matching to identify recurring themes and skills.
        """
        # TODO: Implement the actual analysis logic
        raise NotImplementedError()

    def validate_competences(self, competences: List[CoreCompetence]) -> List[str]:
        """
        Validate the selected core competences against experiences.
        Returns a list of warnings if competences don't align well with experiences.
        """
        # TODO: Implement validation logic
        raise NotImplementedError()
