"""Service for generating CV summaries."""

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.generators import SummaryGeneratorInput
from cv_adapter.models.summary import CVSummary
from cv_adapter.renderers.markdown.minimal_markdown_renderer import (
    MinimalMarkdownRenderer,
)


class SummaryGenerator:
    """Generates a concise CV summary based on CV content and job description."""

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
                "summaries. Each summary should be a single paragraph of no "
                "more than 50 words that highlights the candidate's key strengths "
                "and experience in relation to the job requirements."
            ),
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        notes: str | None = None,
    ) -> CVSummary:
        """Generate a CV summary based on CV content and job requirements.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to highlight
            notes: Optional additional notes for context

        Returns:
            A concise CV summary

        Raises:
            ValueError: If required inputs are missing or invalid
            RendererError: If CV rendering fails
        """
        input_data = SummaryGeneratorInput(
            cv_text=cv,
            job_description=job_description,
            core_competences=core_competences,
            notes=notes,
        )
        context = self._prepare_context(
            cv=input_data.cv_text,
            job_description=input_data.job_description,
            core_competences=input_data.core_competences,
            notes=input_data.notes,
        )

        # Use the agent to generate summary
        result = self.agent.run_sync(
            context,
            result_type=CVSummary,
        )
        return result.data

    def _prepare_context(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        notes: str | None = None,
    ) -> str:
        """Prepare context for summary generation.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to highlight
            notes: Optional additional notes for context

        Returns:
            Prepared context string for the AI
        """
        input_data = SummaryGeneratorInput(
            cv_text=cv,
            job_description=job_description,
            core_competences=core_competences,
            notes=notes,
        )
        context = (
            f"Based on the CV and job description below, create a concise and "
            f"impactful CV summary. The summary should be a single paragraph "
            f"of no more than 50 words that highlights the candidate's key strengths "
            f"and experience in relation to the job requirements.\n\n"
            f"CV:\n{input_data.cv_text}\n\n"
            f"Job Description:\n{input_data.job_description}\n\n"
            f"Core Competences:\n{input_data.core_competences}\n"
        )
        if input_data.notes:
            context += f"\nUser Notes for Consideration:\n{input_data.notes}"

        return context
