from typing import Optional

from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import CoreCompetences


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
                "An expert CV analyst that helps identify and describe core"
                " competences. Each competence should be a concise phrase (1-5 words)"
                " that represents a key skill or area of expertise."
            ),
        )

    def analyze(
        self,
        cv_text: str,
        job_description: str,
        user_notes: Optional[str] = None,
    ) -> CoreCompetences:
        """Analyze CV and job description to generate relevant core competences.

        Args:
            cv_text: The CV text in Markdown format
            job_description: The job description to match against
            user_notes: Optional notes from the user to guide the analysis

        Returns:
            List of core competences relevant for the job

        Raises:
            ValueError: If required inputs are missing or invalid
        """
        if not cv_text.strip():
            raise ValueError("CV text is required")
        if not job_description.strip():
            raise ValueError("Job description is required")

        # Prepare context for the AI
        context = (
            f"Based on the CV and job description below, identify 4-6 core competences "
            f"that best match the requirements. Each competence should be a concise "
            f"phrase (1-5 words) that represents a key skill or area of expertise.\n\n"
            f"CV:\n{cv_text}\n\n"
            f"Job Description:\n{job_description}\n"
        )
        if user_notes:
            context += f"\nUser Notes for Consideration:\n{user_notes}"

        # Use the agent to generate competences
        result = self.agent.run_sync(
            context,
            result_type=CoreCompetences,
        )
        return result.data
