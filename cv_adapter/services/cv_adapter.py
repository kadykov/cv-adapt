from typing import List
from cv_adapter.models.cv import CV, CoreCompetence, Experience


class CVAdapter:
    """Service for adapting CV based on selected core competences."""
    
    def generate_summary(self, core_competences: List[CoreCompetence]) -> str:
        """
        Generate a professional summary based on selected core competences.
        """
        # TODO: Implement summary generation logic
        raise NotImplementedError()
    
    def adapt_experience(self, experience: Experience, core_competences: List[CoreCompetence]) -> Experience:
        """
        Adapt a single experience description to highlight aspects relevant to core competences.
        """
        # TODO: Implement experience adaptation logic
        raise NotImplementedError()
    
    def adapt_cv(self, cv: CV, core_competences: List[CoreCompetence]) -> CV:
        """
        Adapt the entire CV based on selected core competences.
        This includes generating a new summary and adapting all experiences.
        """
        adapted_cv = cv.model_copy()
        adapted_cv.summary = self.generate_summary(core_competences)
        adapted_cv.core_competences = core_competences
        adapted_cv.experiences = [
            self.adapt_experience(exp, core_competences)
            for exp in cv.experiences
        ]
        return adapted_cv