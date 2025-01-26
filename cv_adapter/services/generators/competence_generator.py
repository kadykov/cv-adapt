"""Service for generating core competences based on CV and job description."""

import os
from typing import List, Optional

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.mapper import map_core_competences
from cv_adapter.models.language_context_models import CoreCompetences
from cv_adapter.services.generators.protocols import (
    Generator, 
    GenerationContext, 
    CoreCompetenceGeneratorProtocol
)
from cv_adapter.services.generators.utils import (
    load_system_prompt, 
    prepare_context
)


def create_core_competence_generator(
    ai_model: KnownModelName = "openai:gpt-4o",
    system_prompt_template_path: Optional[str] = None,
    context_template_path: Optional[str] = None,
) -> Generator[List[CoreCompetenceDTO]]:
    """
    Create a core competence generator.

    Args:
        ai_model: AI model to use
        system_prompt_template_path: Optional path to system prompt template
        context_template_path: Optional path to context template

    Returns:
        A generator for core competences
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

    def generation_func(context: GenerationContext) -> List[CoreCompetenceDTO]:
        """
        Generate core competences based on context.

        Args:
            context: Generation context

        Returns:
            List of generated core competences
        """
        # Validate input parameters
        if not context.cv or not context.cv.strip():
            raise ValueError("CV text is required")
        if not context.job_description:
            raise ValueError("Job description is required")

        # Create agent with system prompt
        agent = Agent(
            ai_model,
            system_prompt=load_system_prompt(system_prompt_template_path)
        )

        # Prepare context string
        context_str = prepare_context(context_template_path, context)

        # Generate competences
        result = agent.run_sync(
            context_str,
            result_type=CoreCompetences
        )

        # Map to DTOs
        return map_core_competences(result.data)

    return Generator(generation_func)


def _load_system_prompt(template_path: str) -> str:
    """
    Load system prompt from a Jinja2 template.

    Args:
        template_path: Path to the system prompt template

    Returns:
        Rendered system prompt
    """
    from jinja2 import Environment, FileSystemLoader, StrictUndefined

    # Validate template path
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"System prompt template not found: {template_path}")

    try:
        # Get the directory and filename separately
        template_dir = os.path.dirname(template_path)
        template_filename = os.path.basename(template_path)

        # Create Jinja2 environment
        env = Environment(
            loader=FileSystemLoader(template_dir),
            undefined=StrictUndefined,  # Raise errors for undefined variables
        )

        # Load and render the template
        template = env.get_template(template_filename)
        rendered_prompt = template.render()

        # Validate that the rendered prompt is not empty
        if not rendered_prompt or not rendered_prompt.strip():
            raise RuntimeError(
                f"Rendered system prompt is empty: {template_path}"
            )

        return rendered_prompt

    except Exception as e:
        raise RuntimeError(
            f"Error loading system prompt template {template_path}: {str(e)}"
        ) from e
