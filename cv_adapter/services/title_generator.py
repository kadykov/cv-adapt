from typing import List, Optional

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import Title


class TitleGenerator:
    """Generates a professional title tailored to a job description."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the generator with an AI model.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "A professional CV writer that helps create impactful professional "
                "titles that match job requirements and highlight core competences."
            ),
        )

    def generate(
        self,
        cv_text: str,
        job_description: str,
        core_competences: str,
        notes: Optional[str] = None,
    ) -> Title:
        """Generate a professional title tailored to a job description.

        Args:
            cv_text: CV in Markdown format containing professional background
            job_description: Job description in Markdown format
            core_competences: Core competences that should be highlighted (in Markdown format)
            notes: Optional user notes about how to adapt the title

        Returns:
            A Title model instance containing the generated title

        Raises:
            ValueError: If required inputs are missing or invalid
        """
        if not cv_text.strip():
            raise ValueError("CV text is required")
        if not job_description.strip():
            raise ValueError("Job description is required")
        if not core_competences:
            raise ValueError("Core competences are required")

        # Prepare context for the AI
        context = (
            "Generate a professional title that effectively represents the candidate "
            "for the target job position. The title should be concise, impactful, "
            "and aligned with both the job requirements and core competences.\n\n"
            "Guidelines for generating the title:\n"
            "1. Keep it under 2 lines and within 50 characters per line\n"
            "2. Focus on the most relevant professional identity\n"
            "3. Incorporate key expertise areas that match job requirements\n"
            "4. Ensure it reflects the seniority level appropriately\n"
            "5. Make it memorable but professional\n\n"
            f"CV:\n{cv_text}\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Core Competences to Highlight:\n"
            + core_competences
            + "\n"
        )
        if notes:
            context += f"\nUser Notes for Consideration:\n{notes}"

        # Use the agent to generate title
        result = self.agent.run_sync(
            context,
            result_type=Title,
        )
        return result.data
