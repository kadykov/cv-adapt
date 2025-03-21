"""Service for generating core competences based on CV and job description."""

import os
from typing import List, Optional

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.mapper import map_core_competences
from cv_adapter.models.components import CoreCompetences
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    CoreCompetenceGenerationContext,
)
from cv_adapter.services.generators.utils import load_system_prompt, prepare_context


async def create_core_competence_generator(
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
) -> AsyncGenerator[CoreCompetenceGenerationContext, List[CoreCompetenceDTO]]:
    """
    Create an async core competence generator.

    Args:
        ai_model: AI model to use
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template

    Returns:
        An async generator for core competences
    """
    # Set default system prompt template if not provided
    if system_prompt_template_path is None:
        system_prompt_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "competence_system_prompt.j2"
        )

    # Set default context template if not provided
    if context_template_path is None:
        context_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "competence_context.j2"
        )

    # Create agent with system prompt outside of generation_func
    agent = Agent(
        ai_model, system_prompt=load_system_prompt(system_prompt_template_path)
    )

    async def generation_func(
        context: CoreCompetenceGenerationContext,
    ) -> List[CoreCompetenceDTO]:
        """
        Generate core competences based on context.

        Args:
            context: Core competence generation context

        Returns:
            List of generated core competences
        """
        # Validate input parameters
        if not context.cv or not context.cv.strip():
            raise ValueError("CV text is required")
        if not context.job_description.strip():
            raise ValueError("Job description is required")

        # Prepare context string
        context_str = prepare_context(context_template_path, context)

        # Generate competences
        result = await agent.run(context_str, result_type=CoreCompetences)

        # Map to DTOs
        return map_core_competences(result.data)

    return AsyncGenerator(generation_func)
