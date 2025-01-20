from typing import List, Optional

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import Education


class EducationGenerator:
    """Generates a list of educational experiences tailored to a job description."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the generator with an AI model.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "A professional CV writer that helps adapt educational experiences "
                "to match job requirements and prove core competences."
            ),
        )

    def generate(
        self,
        cv_text: str,
        job_description: str,
        core_competences: str,
        notes: Optional[str] = None,
    ) -> List[Education]:
        """Generate a list of educational experiences tailored to a job description.

        Args:
            cv_text: CV in Markdown format containing all educational experiences
            job_description: Job description in Markdown format
            core_competences: Core competences that should be proven (in Markdown format)
            notes: Optional user notes about how to adapt education section

        Returns:
            List of educational experiences tailored to the job description

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
            "Generate a list of educational experiences tailored to the job. "
            "The experiences should be selected from the CV and adapted to match "
            "the job requirements and prove the core competences.\n\n"
            "Guidelines for generating education section:\n"
            "1. Select relevant educational experiences that match job requirements\n"
            "2. For each education entry, write a description that:\n"
            "   - Focuses on relevant coursework, research, and projects\n"
            "   - Demonstrates the core competences provided\n"
            "   - Highlights academic achievements and specializations\n"
            "   - Is clear and concise\n"
            "3. Keep descriptions focused and relevant, avoiding unnecessary details\n"
            "4. Ensure all dates, university names and degrees match the original CV\n"
            "5. Do not modify the official degree titles\n\n"
            f"CV:\n{cv_text}\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Core Competences to Prove:\n"
            + core_competences
            + "\n"
        )
        if notes:
            context += f"\nUser Notes for Consideration:\n{notes}"

        # Use the agent to generate education entries
        result = self.agent.run_sync(
            context,
            result_type=List[Education],
        )
        education = result.data
        if not education:
            raise ValueError("At least one education entry must be generated")
        return education
