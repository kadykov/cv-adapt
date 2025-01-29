import os
from typing import Optional

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto import cv as cv_dto
from cv_adapter.dto.mapper import map_title
from cv_adapter.models.language_context_models import Title
from cv_adapter.services.generators.protocols import (
    Generator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.utils import load_system_prompt, prepare_context


def create_title_generator(
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
) -> Generator[ComponentGenerationContext, cv_dto.TitleDTO]:
    """
    Create a title generator.

    Args:
        ai_model: AI model to use
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template

    Returns:
        A generator for professional titles
    """
    # Set default system prompt template if not provided
    if system_prompt_template_path is None:
        system_prompt_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "title_system_prompt.j2"
        )

    # Set default context template if not provided
    if context_template_path is None:
        context_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "title_context.j2"
        )

    # Create agent with system prompt
    agent = Agent(
        ai_model, system_prompt=load_system_prompt(system_prompt_template_path)
    )

    def generation_func(context: ComponentGenerationContext) -> cv_dto.TitleDTO:
        """
        Generate title based on context.

        Args:
            context: Component generation context with core competences

        Returns:
            Generated professional title
        """
        # Validate input parameters
        if not context.cv or not context.cv.strip():
            raise ValueError("CV text is required")
        if not context.job_description or not context.job_description.strip():
            raise ValueError("Job description is required")
        if not context.core_competences or not context.core_competences.strip():
            raise ValueError("Core competences are required")

        # Prepare context string
        context_str = prepare_context(
            context_template_path, context, core_competences=context.core_competences
        )

        # Generate title
        result = agent.run_sync(context_str, result_type=Title)

        # Map to DTO
        return map_title(result.data)

    return Generator(generation_func)
