"""Service for generating professional experiences based on CV and job description."""

import os
from typing import Awaitable, List, Optional, Union

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import ExperienceDTO
from cv_adapter.dto.mapper import map_experience
from cv_adapter.models.components import Experience
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.utils import load_system_prompt, prepare_context


async def create_experience_generator(
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
) -> AsyncGenerator[ComponentGenerationContext, List[ExperienceDTO]]:
    """
    Create an async experience generator.

    Args:
        ai_model: AI model to use
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template

    Returns:
        An async generator for professional experiences
    """
    # Set default system prompt template if not provided
    if system_prompt_template_path is None:
        system_prompt_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "experience_system_prompt.j2"
        )

    # Set default context template if not provided
    if context_template_path is None:
        context_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "experience_context.j2"
        )

    # Create agent with system prompt
    agent = Agent(
        ai_model, system_prompt=load_system_prompt(system_prompt_template_path)
    )

    async def generation_func(
        context: ComponentGenerationContext,
    ) -> List[ExperienceDTO]:
        """
        Generate experiences based on context asynchronously.

        Args:
            context: Component generation context with core competences

        Returns:
            List of generated experiences
        """
        # Validate input parameters
        if not context.cv or not context.cv.strip():
            raise ValueError("CV text is required")
        if not context.job_description.strip():
            raise ValueError("Job description is required")
        if not context.core_competences or not context.core_competences.strip():
            raise ValueError("Core competences are required")

        # Prepare context string
        context_str = prepare_context(
            context_template_path, context, core_competences=context.core_competences
        )

        # Generate experiences
        result = await agent.run(context_str, result_type=list[Experience])

        # Map to DTOs
        return [map_experience(exp) for exp in result.data]

    return AsyncGenerator(generation_func)
