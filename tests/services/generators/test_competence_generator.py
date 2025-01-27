import os
from typing import Any

import pytest

import cv_adapter.services.generators.competence_generator
from cv_adapter.services.generators.competence_generator import create_core_competence_generator


def test_competence_generator_default_templates() -> None:
    """Test the competence generator with default templates."""
    # Use default template paths
    default_system_prompt_path = os.path.join(
        os.path.dirname(cv_adapter.services.generators.competence_generator.__file__),
        "templates",
        "competence_system_prompt.j2",
    )
    default_context_path = os.path.join(
        os.path.dirname(cv_adapter.services.generators.competence_generator.__file__),
        "templates",
        "competence_context.j2",
    )

    # Verify default template paths exist
    assert os.path.exists(default_system_prompt_path), (
        "Default system prompt template not found"
    )
    assert os.path.exists(default_context_path), "Default context template not found"

    # Create generator
    generator = create_core_competence_generator(
        ai_model="test",
        system_prompt_template_path=default_system_prompt_path,
        context_template_path=default_context_path,
    )

    # Verify generator is created successfully
    assert generator is not None


def test_competence_generator_custom_templates(tmp_path: Any) -> None:
    """Test the competence generator with custom templates."""
    # Create custom templates
    system_prompt_path = tmp_path / "system_prompt.j2"
    system_prompt_path.write_text(
        "An expert CV analyst that helps identify and describe core competences. "
        "Generate 4-6 concise competences that match job requirements."
    )

    context_template_path = tmp_path / "context.j2"
    context_template_path.write_text(
        "CV: {{ cv }}\n"
        "Job Description: {{ job_description }}\n"
        "{% if notes is defined %}Notes: {{ notes }}{% endif %}"
    )

    # Create generator with custom templates
    generator = create_core_competence_generator(
        ai_model="test",
        system_prompt_template_path=str(system_prompt_path),
        context_template_path=str(context_template_path),
    )

    # Verify generator is created successfully
    assert generator is not None
