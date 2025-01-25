import os
from typing import Any

import pytest
from pydantic_ai.models.test import TestModel

import cv_adapter.services.generators.competence_generator
from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.services.generators.competence_generator import CompetenceGenerator


@pytest.fixture
def valid_system_prompt_template(tmp_path: Any) -> str:
    """Create a valid system prompt template."""
    template_path = tmp_path / "system_prompt.j2"
    template_path.write_text(
        "An expert CV analyst that helps identify and describe core competences. "
        "Generate 4-6 concise competences that match job requirements."
    )
    return str(template_path)


@pytest.fixture
def valid_context_template(tmp_path: Any) -> str:
    """Create a valid context template."""
    template_path = tmp_path / "context.j2"
    template_path.write_text(
        "CV: {{ cv }}\n"
        "Job Description: {{ job_description }}\n"
        "{% if notes is defined %}Notes: {{ notes }}{% endif %}"
    )
    return str(template_path)


@pytest.fixture
def test_model() -> TestModel:
    """
    Create a test model for competence generation.

    Returns:
        TestModel: A mock model with predefined core competence items.
    """
    model: TestModel = TestModel()
    model.custom_result_args = {
        "items": [
            {"text": "Strategic Problem Solving"},
            {"text": "Technical Leadership"},
            {"text": "Agile Methodology"},
            {"text": "Cross-Functional Collaboration"},
        ]
    }
    return model


def test_competence_generator_default_templates(test_model: TestModel) -> None:
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

    # Create generator (kept for potential future use)
    CompetenceGenerator(
        ai_model="test",
        system_prompt_template_path=default_system_prompt_path,
        context_template_path=default_context_path,
    )


def test_competence_generator_dto_output(test_model: TestModel) -> None:
    """Test that the competence generator returns a valid List[CoreCompetenceDTO]."""
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

    # Initialize generator
    generator = CompetenceGenerator(
        ai_model="test",
        system_prompt_template_path=default_system_prompt_path,
        context_template_path=default_context_path,
    )

    # Use agent override to set the test model
    with generator.agent.override(model=test_model):
        # Set language context
        with language_context(ENGLISH):
            # Generate core competences
            result = generator.generate(
                cv="Experienced software engineer with 10 years of expertise",
                job_description=(
                    "Seeking a senior software engineer with leadership skills"
                ),
            )

            # Verify the result is a list of CoreCompetenceDTO
            assert isinstance(result, list)
            assert all(isinstance(comp, CoreCompetenceDTO) for comp in result)

            # Verify the number of competences
            assert len(result) == 4

            # Verify each competence is a CoreCompetenceDTO
            for competence in result:
                assert isinstance(competence, CoreCompetenceDTO)
                assert isinstance(competence.text, str)
                assert len(competence.text) > 0

            # Verify specific competence texts
            competence_texts = [comp.text for comp in result]
            assert "Strategic Problem Solving" in competence_texts
            assert "Technical Leadership" in competence_texts
            assert "Agile Methodology" in competence_texts
            assert "Cross-Functional Collaboration" in competence_texts


def test_generator_with_valid_templates(
    valid_system_prompt_template: str,
    valid_context_template: str,
    test_model: TestModel,
) -> None:
    """Test generator with valid custom templates."""
    generator = CompetenceGenerator(
        ai_model="test",
        system_prompt_template_path=valid_system_prompt_template,
        context_template_path=valid_context_template,
    )

    # Use agent override to set the test model
    with generator.agent.override(model=test_model):
        # Set language context
        with language_context(ENGLISH):
            # Generate core competences with custom templates
            result = generator.generate(
                cv="Experienced software engineer with 10 years of expertise",
                job_description=(
                    "Seeking a senior software engineer with leadership skills"
                ),
            )

            # Verify the result is a list of CoreCompetenceDTO
            assert isinstance(result, list)
            assert all(isinstance(comp, CoreCompetenceDTO) for comp in result)
            assert len(result) == 4
