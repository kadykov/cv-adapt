"""Shared utility functions for generators."""

import os
from typing import Any, Dict

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from cv_adapter.services.generators.protocols import GenerationContext


def load_system_prompt(template_path: str) -> str:
    """
    Load system prompt from a Jinja2 template.

    Args:
        template_path: Path to the system prompt template

    Returns:
        Rendered system prompt
    """
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
            raise RuntimeError(f"Rendered system prompt is empty: {template_path}")

        return rendered_prompt

    except Exception as e:
        raise RuntimeError(
            f"Error loading system prompt template {template_path}: {str(e)}"
        ) from e


def prepare_context(
    context_template_path: str, context: GenerationContext, **extra_context: Any
) -> str:
    """
    Prepare context for generation using Jinja2 template.

    Args:
        context_template_path: Path to the context template
        context: Generation context
        **extra_context: Additional context variables to pass to the template

    Returns:
        Rendered context string
    """
    # Validate context template path
    if not os.path.exists(context_template_path):
        raise ValueError(
            f"Context template file does not exist: {context_template_path}"
        )

    try:
        # Create Jinja2 environment
        env = Environment(
            loader=FileSystemLoader(os.path.dirname(context_template_path)),
            undefined=StrictUndefined,  # Raise errors for undefined variables
        )
        template = env.get_template(os.path.basename(context_template_path))

        # Prepare template context
        template_context: Dict[str, Any] = {
            "cv": context.cv,
            "job_description": context.job_description,
            "language": context.language,
            "notes": context.notes,
            **extra_context,
        }

        # Render the template
        rendered_context = template.render(**template_context)

        # Validate rendered context
        if not rendered_context or not rendered_context.strip():
            raise RuntimeError("Rendered context template is empty")

        return rendered_context

    except Exception as e:
        raise RuntimeError(
            f"Failed to process context template {context_template_path}: {str(e)}"
        ) from e
