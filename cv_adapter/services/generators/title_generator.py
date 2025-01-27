import os
from typing import Optional

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto import cv as cv_dto
from cv_adapter.dto.mapper import map_title
from cv_adapter.models.language_context_models import Title
from cv_adapter.services.generators.protocols import (
    GenerationContext,
    Generator,
)
from cv_adapter.services.generators.utils import load_system_prompt, prepare_context


def create_title_generator(
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
    core_competence_generator: Optional[Generator] = None,
) -> Generator[cv_dto.TitleDTO]:
    """
    Create a title generator.

    Args:
        ai_model: AI model to use
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template
        core_competence_generator: Optional generator for core competences

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

    def generation_func(context: GenerationContext) -> cv_dto.TitleDTO:
        """
        Generate title based on context.

        Args:
            context: Generation context

        Returns:
            Generated professional title
        """
        # Validate input parameters
        if not context.cv or not context.cv.strip():
            raise ValueError("CV text is required")
        if not context.job_description:
            raise ValueError("Job description is required")

        # Optional: generate core competences if generator is provided
        core_competences_str = ""
        if core_competence_generator:
            core_competences = core_competence_generator(context)
            core_competences_str = "\n".join(
                [f"{comp.title}: {comp.description}" for comp in core_competences]
            )

        # Create agent with system prompt
        agent = Agent(
            ai_model, system_prompt=load_system_prompt(system_prompt_template_path)
        )

        # Prepare context string
        context_str = prepare_context(
            context_template_path, context, core_competences=core_competences_str
        )

        # Generate title
        result = agent.run_sync(context_str, result_type=Title)

        # Map to DTO
        return map_title(result.data)

    return Generator(generation_func)
