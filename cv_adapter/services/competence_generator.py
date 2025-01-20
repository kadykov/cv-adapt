"""Service for generating core competences based on CV and job description."""

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import CoreCompetences
from cv_adapter.models.generators import CompetenceGeneratorInput


class CompetenceGenerator:
    """Generates relevant core competences based on CV and job description."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the generator with an AI model.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "An expert CV analyst that helps identify and describe core"
                " competences. Each competence should be a concise phrase (1-5 words)"
                " that represents a key skill or area of expertise."
            ),
        )

    def generate(self, input_data: CompetenceGeneratorInput) -> CoreCompetences:
        """Generate core competences based on CV and job description.

        Args:
            input_data: Input data with CV text, job description, and optional notes

        Returns:
            List of core competences relevant for the job
        """
        # Prepare context for the AI
        context = (
            f"Based on the CV and job description below, identify 4-6 core competences "
            f"that best match the requirements. Each competence should be a concise "
            f"phrase (1-5 words) that represents a key skill or area of expertise.\n\n"
            f"CV:\n{input_data.cv_text}\n\n"
            f"Job Description:\n{input_data.job_description}\n"
        )
        if input_data.notes:
            context += f"\nUser Notes for Consideration:\n{input_data.notes}"

        # Use the agent to generate competences
        result = self.agent.run_sync(
            context,
            result_type=CoreCompetences,
        )
        return result.data
