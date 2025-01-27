"""Service for generating CV summaries."""

import os
from typing import Optional

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto import cv as cv_dto
from cv_adapter.dto.mapper import map_summary
from cv_adapter.models.summary import CVSummary
from cv_adapter.renderers.markdown import MinimalMarkdownRenderer
from cv_adapter.services.generators.protocols import (
    ComponentGenerator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.utils import load_system_prompt, prepare_context


def create_summary_generator(
    renderer: MinimalMarkdownRenderer,
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
) -> ComponentGenerator[cv_dto.SummaryDTO]:
    """
    Create a summary generator.

    Args:
        renderer: MinimalMarkdownRenderer instance to use for CV rendering
        ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template

    Returns:
        A generator for CV summaries
    """
    # Store renderer for potential future use
    # Note: This is a placeholder. Consider how the renderer might be used.
    _ = renderer

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

    def generation_func(context: ComponentGenerationContext) -> cv_dto.SummaryDTO:
        """
        Generate summary based on context.

        Args:
            context: Component generation context with core competences

        Returns:
            Generated summary
        """
        # Validate input parameters
        if not context.cv or not context.cv.strip():
            raise ValueError("CV text is required")
        if not context.job_description:
            raise ValueError("Job description is required")

        # Create agent with system prompt
        agent = Agent(
            ai_model, system_prompt=load_system_prompt(system_prompt_template_path)
        )

        # Prepare context string
        context_str = prepare_context(
            context_template_path, context, core_competences=context.core_competences
        )

        # Generate summary
        result = agent.run_sync(context_str, result_type=CVSummary)

        # Map to DTO
        return map_summary(result.data)

    return ComponentGenerator(generation_func)
