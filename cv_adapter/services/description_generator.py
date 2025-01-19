from typing import Optional

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import CVDescription, MinimalCV
from cv_adapter.renderers.minimal_markdown_renderer import MinimalMarkdownRenderer


class DescriptionGenerator:
    """Generates a concise CV description based on CV content and job description."""

    def __init__(
        self,
        renderer: MinimalMarkdownRenderer,
        ai_model: KnownModelName = "openai:gpt-4o",
    ) -> None:
        """Initialize the generator with a renderer and AI model.

        Args:
            renderer: MinimalMarkdownRenderer instance to use for CV rendering
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.renderer = renderer
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "An expert CV writer that creates concise and impactful CV "
                "descriptions. Each description should be a single paragraph of no "
                "more than 50 words that highlights the candidate's key strengths "
                "and experience in relation to the job requirements."
            ),
        )

    def generate(
        self,
        minimal_cv: MinimalCV,
        job_description: str,
        user_notes: Optional[str] = None,
    ) -> CVDescription:
        """Generate a CV description based on minimal CV and job requirements.

        Args:
            minimal_cv: MinimalCV instance containing essential CV parts
            job_description: The job description to match against
            user_notes: Optional notes from the user to guide the generation

        Returns:
            A concise CV description

        Raises:
            ValueError: If required inputs are missing or invalid
            RendererError: If CV rendering fails
        """
        if not job_description.strip():
            raise ValueError("Job description is required")

        # Convert minimal CV to Markdown
        cv_text = self.renderer.render_to_string(minimal_cv)

        # Prepare context for the AI
        context = (
            f"Based on the CV and job description below, create a concise and "
            f"impactful CV description. The description should be a single paragraph "
            f"of no more than 50 words that highlights the candidate's key strengths "
            f"and experience in relation to the job requirements.\n\n"
            f"CV:\n{cv_text}\n\n"
            f"Job Description:\n{job_description}\n"
        )
        if user_notes:
            context += f"\nUser Notes for Consideration:\n{user_notes}"

        # Use the agent to generate description
        result = self.agent.run_sync(
            context,
            result_type=CVDescription,
        )
        return result.data
