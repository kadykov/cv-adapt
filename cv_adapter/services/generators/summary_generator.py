"""Service for generating CV summaries."""

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto import cv as cv_dto
from cv_adapter.dto.language import ENGLISH
from cv_adapter.dto.mapper import map_summary
from cv_adapter.models.language import Language
from cv_adapter.models.language_context import get_current_language
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
                "and experience in relation to the job requirements. Capable of "
                "generating summaries in multiple languages while maintaining "
                "professional tone and local communication styles."
            ),
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        notes: str | None = None,
    ) -> cv_dto.SummaryDTO:
        """Generate a CV summary based on CV content and job requirements.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to highlight
            notes: Optional additional notes for context

        Returns:
            A concise CV summary DTO

        Raises:
            ValueError: If required inputs are missing or invalid
            RendererError: If CV rendering fails
        """
        # Input validation
        if not cv or not cv.strip():
            raise ValueError("CV text is required")
        if not job_description:
            raise ValueError("Job description is required")
        if not core_competences or not core_competences.strip():
            raise ValueError("Core competences are required")

        # Get language from context
        language = get_current_language()

        context = self._prepare_context(
            cv=cv,
            job_description=job_description,
            core_competences=core_competences,
            language=language,
            notes=notes,
        )

        # Use the agent to generate summary
        result = self.agent.run_sync(
            context,
            result_type=CVSummary,
        )

        # Convert to DTO
        return map_summary(result.data.text)

    def _prepare_context(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        language: Language,
        notes: str | None = None,
    ) -> str:
        """Prepare context for summary generation.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to highlight
            language: Target language for generation
            notes: Optional additional notes for context

        Returns:
            Prepared context string for the AI
        """
        context = (
            "Based on the CV and job description below, create a concise and "
            "impactful CV summary. The summary should be a single paragraph "
            "of no more than 50 words that highlights the candidate's key strengths "
            "and experience in relation to the job requirements.\n\n"
        )

        # Replace Language.ENGLISH with ENGLISH
        if language != ENGLISH:
            context += (
                "\nLanguage Requirements:\n"
                f"Generate the summary in {language.name.title()}, following "
                f"professional communication conventions for that language.\n"
            )

        context += (
            f"CV:\n{cv}\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Core Competences:\n{core_competences}\n"
        )

        if notes:
            context += f"\nUser Notes for Consideration:\n{notes}"

        return context
