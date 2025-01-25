"""Service for generating CV summaries."""

import os
from typing import Optional

from pydantic_ai.models import KnownModelName

from cv_adapter.dto import cv as cv_dto
from cv_adapter.dto.language import Language
from cv_adapter.dto.mapper import map_summary
from cv_adapter.models.language_context import get_current_language
from cv_adapter.models.summary import CVSummary
from cv_adapter.renderers.markdown import MinimalMarkdownRenderer
from cv_adapter.services.generators.base_generator import BaseGenerator


class SummaryGenerator(BaseGenerator[cv_dto.SummaryDTO]):
    """Generates a concise CV summary based on CV content and job description."""

    def __init__(
        self,
        renderer: MinimalMarkdownRenderer,
        ai_model: KnownModelName = "openai:gpt-4o",
        system_prompt_template_path: Optional[str] = None,
        context_template_path: Optional[str] = None,
    ) -> None:
        """Initialize the generator with a renderer and AI model.

        Args:
            renderer: MinimalMarkdownRenderer instance to use for CV rendering
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
            system_prompt_template_path: Optional path to system prompt Jinja2 template
            context_template_path: Optional path to context Jinja2 template
        """
        # Store renderer for potential future use
        self.renderer = renderer

        # Set default system prompt template if not provided
        if system_prompt_template_path is None:
            system_prompt_template_path = os.path.join(
                os.path.dirname(__file__), "templates", "summary_system_prompt.j2"
            )

        # Set default context template if not provided
        if context_template_path is None:
            context_template_path = os.path.join(
                os.path.dirname(__file__), "templates", "summary_context.j2"
            )

        # Initialize base generator with templates
        super().__init__(
            ai_model=ai_model,
            system_prompt_template_path=system_prompt_template_path,
            context_template_path=context_template_path,
            result_type=CVSummary,
            mapper_func=map_summary,
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        notes: Optional[str] = None,
        language: Optional[Language] = None,
        **kwargs,
    ) -> cv_dto.SummaryDTO:
        """Generate a CV summary based on CV content and job requirements.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to highlight
            notes: Optional additional notes for context
            language: Optional language override
            **kwargs: Additional keyword arguments

        Returns:
            A concise CV summary DTO

        Raises:
            ValueError: If required inputs are missing or invalid
        """
        # Input validation
        if not cv or not cv.strip():
            raise ValueError("CV text is required")
        if not job_description:
            raise ValueError("Job description is required")
        if not core_competences or not core_competences.strip():
            raise ValueError("Core competences are required")

        # Use provided language or get from context
        language = language or get_current_language()

        # Prepare context and generate
        return self._generate_single_with_context(
            cv=cv,
            job_description=job_description,
            core_competences=core_competences,
            notes=notes,
            language=language,
            result_type=CVSummary,
            mapper_func=map_summary,
            **kwargs,
        )
