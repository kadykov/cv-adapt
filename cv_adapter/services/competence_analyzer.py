from typing import List, Optional

from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import CV, CoreCompetence


class CompetenceResponse(BaseModel):
    response: List[CoreCompetence]


class CompetenceAnalyzer:
    """Analyzes CV and job description to generate relevant core competences."""

    def __init__(self, ai_model: Optional[TestModel] = None) -> None:
        """Initialize the analyzer with an optional AI model.

        Args:
            ai_model: Optional AI model to use. If not provided, uses OpenAI GPT-4.
        """
        self.agent = Agent(
            ai_model or "openai:gpt-4",
            system_prompt=(
                "An expert CV analyst that helps identify and describe core competences"
            ),
        )

    def analyze(
        self,
        cv: CV,
        job_description: str,
        user_notes: Optional[str] = None,
    ) -> List[CoreCompetence]:
        """Analyze CV and job description to generate relevant core competences.

        Args:
            cv: The detailed CV to analyze
            job_description: The job description to match against
            user_notes: Optional notes from the user to guide the analysis

        Returns:
            List of core competences relevant for the job

        Raises:
            ValueError: If required inputs are missing or invalid
        """
        if not cv:
            raise ValueError("CV is required")
        if not job_description.strip():
            raise ValueError("Job description is required")

        # Prepare context for the AI
        context = (
            f"Based on the CV and job description below, identify 3-4 core competences "
            f"that best match the requirements.\n"
            f"Include a name, description, and keywords for each competence.\n\n"
            f"CV Details:\n"
            f"- Name: {cv.full_name}\n"
            f"- Current Title: {cv.title}\n"
            f"- Experience:\n"
            f"{self._format_experiences(cv)}\n"
            f"Job Description:\n"
            f"{job_description}\n"
        )
        if user_notes:
            context += f"\nUser Notes for Consideration:\n{user_notes}"

        # Use the agent to generate competences
        result = self.agent.run_sync(
            context,
            result_type=CompetenceResponse,
        )
        return result.data.response

    def _format_experiences(self, cv: CV) -> str:
        """Format CV experiences for the prompt."""
        experiences = []
        for exp in cv.experiences:
            date_range = (
                f"{exp.start_date.strftime('%Y-%m')} to "
                f"{exp.end_date.strftime('%Y-%m') if exp.end_date else 'Present'}"
            )
            exp_text = (
                f"  * {exp.position} at {exp.company} ({date_range})\n"
                f"    - {exp.description}\n"
                f"    - Technologies: {', '.join(exp.technologies)}\n"
                f"    - Achievements:\n"
                "".join(f"      - {a}\n" for a in exp.achievements)
            )
            experiences.append(exp_text)
        return "\n".join(experiences)
