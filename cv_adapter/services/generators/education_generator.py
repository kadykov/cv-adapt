"""Service for generating educational experiences."""

import os
from typing import List, Optional

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import EducationDTO
from cv_adapter.dto.mapper import map_education
from cv_adapter.models.language_context_models import Education
from cv_adapter.services.generators.protocols import (
    Generator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.utils import load_system_prompt, prepare_context


def create_education_generator(
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
) -> Generator[ComponentGenerationContext, List[EducationDTO]]:
    """
    Create an education generator.

    Args:
        ai_model: AI model to use
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template

    Returns:
        A generator for educational experiences
    """
    # Set default system prompt template if not provided
    if system_prompt_template_path is None:
        system_prompt_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "education_system_prompt.j2"
        )

    # Set default context template if not provided
    if context_template_path is None:
        context_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "education_context.j2"
        )

    # Create agent with system prompt
    agent = Agent(
        ai_model, system_prompt=load_system_prompt(system_prompt_template_path)
    )

    def generation_func(context: ComponentGenerationContext) -> List[EducationDTO]:
        """
        Generate educational experiences based on context.

        Args:
            context: Component generation context with core competences

        Returns:
            List of generated educational experiences
        """
        # Validate input parameters
        if not context.cv or not context.cv.strip():
            raise ValueError("CV text is required")
        if not context.job_description:
            raise ValueError("Job description is required")

        # Prepare context string
        context_str = prepare_context(
            context_template_path, context, core_competences=context.core_competences
        )

        # Generate educational experiences
        result = agent.run_sync(context_str, result_type=list[Education])

        # Map to DTOs
        return [map_education(edu) for edu in result.data]

    return Generator(generation_func)
