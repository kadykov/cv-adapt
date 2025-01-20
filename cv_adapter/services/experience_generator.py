from typing import List

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import Experience
from cv_adapter.models.generators import ExperienceGeneratorInput


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

    def generate(self, input_data: ExperienceGeneratorInput) -> List[Experience]:
        """Generate a list of professional experiences tailored to a job description.

        Args:
            input_data: Validated input data containing CV text, job description,
                       core competences and optional notes

        Returns:
            List of experiences tailored to the job description

        Raises:
            ValueError: If LLM generates empty list of experiences
        """
        # Prepare context for the AI
        context = (
            "Generate a list of professional experiences tailored to the job. "
            "The experiences should be selected from the CV and adapted to match "
            "the job requirements and prove the core competences.\n\n"
            "Guidelines for generating experiences:\n"
            "1. Select only relevant experiences that demonstrate required skills\n"
            "2. For each experience, write a description that:\n"
            "   - Focuses on achievements and responsibilities matching requirements\n"
            "   - Demonstrates the core competences provided\n"
            "   - Uses action verbs and quantifies results where possible\n"
            "   - Is clear and concise\n"
            "3. Keep descriptions focused and relevant, avoiding unnecessary details\n"
            "4. Ensure all dates, company names and positions match the original CV\n"
            "5. Include only technologies actually used and relevant to the job\n\n"
            f"CV:\n{input_data.cv_text}\n\n"
            f"Job Description:\n{input_data.job_description}\n\n"
            f"Core Competences to Prove:\n{input_data.core_competences}\n"
        )
        if input_data.notes:
            context += f"\nUser Notes for Consideration:\n{input_data.notes}"

        # Use the agent to generate experiences
        result = self.agent.run_sync(
            context,
            result_type=List[Experience],
        )
        experiences = result.data
        if not experiences:
            raise ValueError("At least one experience must be generated")
        return experiences
