"""Service for generating skills based on CV and job description."""

import os
from typing import Awaitable, List, Optional, Union

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import SkillGroupDTO
from cv_adapter.dto.mapper import map_skill_group
from cv_adapter.models.components import SkillGroup
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
    Generator,
)
from cv_adapter.services.generators.utils import load_system_prompt, prepare_context


async def create_async_skills_generator(
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
) -> AsyncGenerator[ComponentGenerationContext, List[SkillGroupDTO]]:
    """
    Create an async skills generator.

    Args:
        ai_model: AI model to use
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template

    Returns:
        A generator for skills
    """
    # Set default system prompt template if not provided
    if system_prompt_template_path is None:
        system_prompt_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "skills_system_prompt.j2"
        )

    # Set default context template if not provided
    if context_template_path is None:
        context_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "skills_context.j2"
        )

    # Create agent with system prompt
    agent = Agent(
        ai_model, system_prompt=load_system_prompt(system_prompt_template_path)
    )

    async def generation_func(
        context: ComponentGenerationContext,
    ) -> List[SkillGroupDTO]:
        """
        Generate skills based on context.

        Args:
            context: Component generation context with core competences

        Returns:
            List of generated skill groups
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

        # Generate skills
        result = await agent.run(context_str, result_type=list[SkillGroup])

        # Map to DTOs
        return [map_skill_group(skill_group) for skill_group in result.data]

    return AsyncGenerator(generation_func)


def create_skills_generator(
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
) -> Generator[ComponentGenerationContext, List[SkillGroupDTO]]:
    """
    Create a skills generator.

    Args:
        ai_model: AI model to use
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template

    Returns:
        A generator for skills
    """
    # Set default system prompt template if not provided
    if system_prompt_template_path is None:
        system_prompt_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "skills_system_prompt.j2"
        )

    # Set default context template if not provided
    if context_template_path is None:
        context_template_path = os.path.join(
            os.path.dirname(__file__), "templates", "skills_context.j2"
        )

    # Create agent with system prompt
    agent = Agent(
        ai_model, system_prompt=load_system_prompt(system_prompt_template_path)
    )

    def generation_func(context: ComponentGenerationContext) -> List[SkillGroupDTO]:
        """
        Generate skills based on context.

        Args:
            context: Component generation context with core competences

        Returns:
            List of generated skill groups
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

        # Generate skills
        result = agent.run_sync(context_str, result_type=list[SkillGroup])

        # Map to DTOs
        return [map_skill_group(skill_group) for skill_group in result.data]

    return Generator(generation_func)


def get_skills_generator(
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
    use_async: bool = False,
) -> Union[
    Generator[ComponentGenerationContext, List[SkillGroupDTO]],
    Awaitable[AsyncGenerator[ComponentGenerationContext, List[SkillGroupDTO]]],
]:
    """
    Get a skills generator based on the async flag.

    Args:
        ai_model: AI model to use
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template
        use_async: Whether to use async generator

    Returns:
        Either a sync or async generator for skills
    """
    if use_async:
        return create_async_skills_generator(
            ai_model, system_prompt_template_path, context_template_path
        )
    return create_skills_generator(
        ai_model, system_prompt_template_path, context_template_path
    )
