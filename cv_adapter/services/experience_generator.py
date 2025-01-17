from typing import List, Optional

from pydantic import BaseModel, Field
from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import Experience


class ExperienceGenerator:
    """Generates a list of professional experiences tailored to a job description."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the generator with an AI model.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "A professional CV writer that helps adapt professional experiences "
                "to match job requirements and prove core competences."
            ),
        )

    def generate(
        self,
        cv_markdown: str,
        job_description_markdown: str,
        core_competences: List[str],
        notes: Optional[str] = None,
    ) -> List[Experience]:
        """Generate a list of professional experiences tailored to a job description.

        Args:
            cv_markdown: CV in Markdown format containing all professional experiences
            job_description_markdown: Job description in Markdown format
            core_competences: List of core competences that should be proven
            notes: Optional user notes about how to adapt experiences

        Returns:
            List of experiences tailored to the job description

        Raises:
            ValueError: If required inputs are missing or invalid
        """
        if not cv_markdown.strip():
            raise ValueError("CV text is required")
        if not job_description_markdown.strip():
            raise ValueError("Job description is required")
        if not core_competences:
            raise ValueError("Core competences are required")

        # Prepare context for the AI
        context = (
            "Generate a list of professional experiences tailored to the job description. "
            "The experiences should be selected and adapted from the provided CV to match "
            "the job requirements and prove the core competences.\n\n"
            "Guidelines for generating experiences:\n"
            "1. Select only relevant experiences that demonstrate skills and competences required for the job\n"
            "2. For each experience, write a description that:\n"
            "   - Focuses on achievements and responsibilities that align with the job requirements\n"
            "   - Demonstrates the core competences provided\n"
            "   - Uses action verbs and quantifies results where possible\n"
            "   - Is clear and concise\n"
            "3. Keep descriptions focused and relevant, avoiding unnecessary details\n"
            "4. Ensure all dates, company names and positions are preserved as in the original CV\n"
            "5. Include only technologies that were actually used in each role and are relevant to the job\n\n"
            f"CV:\n{cv_markdown}\n\n"
            f"Job Description:\n{job_description_markdown}\n\n"
            f"Core Competences to Prove:\n"
            + "\n".join(f"- {comp}" for comp in core_competences)
            + "\n"
        )
        if notes:
            context += f"\nUser Notes for Consideration:\n{notes}"

        # Use the agent to generate experiences
        result = self.agent.run_sync(
            context,
            result_type=List[Experience],
        )
        experiences = result.data
        if not experiences:
            raise ValueError("At least one experience must be generated")
        return experiences
