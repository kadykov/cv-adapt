import os
from datetime import date
from typing import Any, cast
from unittest.mock import Mock

import pytest
from pydantic_ai import Agent

import cv_adapter.services.generators.education_generator
from cv_adapter.dto.cv import EducationDTO, InstitutionDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.models.language_context_models import Education, University
from cv_adapter.services.generators.education_generator import (
    create_education_generator,
)
from cv_adapter.services.generators.protocols import ComponentGenerationContext


def test_education_generator_default_templates() -> None:
    """Test the education generator with default templates."""
    # Use default template paths
    default_system_prompt_path = os.path.join(
        os.path.dirname(cv_adapter.services.generators.education_generator.__file__),
        "templates",
        "education_system_prompt.j2",
    )
    default_context_path = os.path.join(
        os.path.dirname(cv_adapter.services.generators.education_generator.__file__),
        "templates",
        "education_context.j2",
    )

    # Verify default template paths exist
    assert os.path.exists(default_system_prompt_path), (
        "Default system prompt template not found"
    )
    assert os.path.exists(default_context_path), "Default context template not found"

    # Create generator
    generator = create_education_generator(
        ai_model="test",
        system_prompt_template_path=default_system_prompt_path,
        context_template_path=default_context_path,
    )

    # Verify generator is created successfully
    assert generator is not None


def test_education_generator_custom_templates(tmp_path: Any) -> None:
    """Test the education generator with custom templates."""
    # Create custom templates
    system_prompt_path = tmp_path / "system_prompt.j2"
    system_prompt_path.write_text(
        "An expert CV analyst that helps identify and describe educational "
        "experiences. Generate educational experiences that match job requirements."
    )

    context_template_path = tmp_path / "context.j2"
    context_template_path.write_text(
        "CV: {{ cv }}\n"
        "Job Description: {{ job_description }}\n"
        "Core Competences: {{ core_competences }}"
    )

    # Create generator with custom templates
    generator = create_education_generator(
        ai_model="test",
        system_prompt_template_path=str(system_prompt_path),
        context_template_path=str(context_template_path),
    )

    # Verify generator is created successfully
    assert generator is not None


def test_education_generator_dto_output() -> None:
    """Test education generator returns a valid List[EducationDTO]."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Create a mock agent
        mock_agent = Mock(spec=Agent)
        mock_agent.run_sync.return_value = Mock(
            data=[
                Education(
                    university=University(
                        name="Tech University",
                        description="Leading technology and engineering institution",
                        location="San Francisco, CA",
                    ),
                    degree="Master of Science in Computer Science",
                    start_date=date(2018, 9, 1),
                    end_date=date(2020, 5, 15),
                    description="Specialized in machine learning and AI technologies",
                )
            ]
        )

        # Temporarily replace the agent creation in the function
        def mock_agent_factory(*args: Any, **kwargs: Any) -> Agent[Any, Any]:
            return cast(Agent[Any, Any], mock_agent)

        # Temporarily modify the Agent class
        original_agent_factory = getattr(
            cv_adapter.services.generators.education_generator, "Agent"
        )
        setattr(
            cv_adapter.services.generators.education_generator,
            "Agent",
            mock_agent_factory,
        )

        try:
            # Create generator
            generator = create_education_generator(ai_model="test")

            # Prepare test context
            context = ComponentGenerationContext(
                cv="Experienced software engineer with advanced academic background",
                job_description=(
                    "Seeking a senior software engineer with advanced technical skills"
                ),
                core_competences="Technical Leadership, Advanced Learning",
                language=ENGLISH,
            )

            # Generate education
            result = generator(context)

            # Verify the result is a list of EducationDTO
            assert isinstance(result, list)
            assert len(result) == 1

            # Verify the education is an EducationDTO
            education = result[0]
            assert isinstance(education, EducationDTO)
            assert isinstance(education.university, InstitutionDTO)
            assert isinstance(education.degree, str)
            assert isinstance(education.start_date, date)
            assert isinstance(education.description, str)

            # Verify specific education details
            assert education.university.name == "Tech University"
            assert education.degree == "Master of Science in Computer Science"
            assert (
                education.description
                == "Specialized in machine learning and AI technologies"
            )
            assert education.university.location == "San Francisco, CA"
            assert education.start_date == date(2018, 9, 1)
            assert education.end_date == date(2020, 5, 15)

            # Verify agent was called with correct arguments
            mock_agent.run_sync.assert_called_once()
        finally:
            # Restore the original Agent class
            setattr(
                cv_adapter.services.generators.education_generator,
                "Agent",
                original_agent_factory,
            )


def test_education_generator_raises_error_on_empty_parameters() -> None:
    """Test that generator raises ValueError when required parameters are empty."""
    with language_context(ENGLISH):
        generator = create_education_generator(ai_model="test")

        # Test empty CV
        with pytest.raises(ValueError):
            generator(
                ComponentGenerationContext(
                    cv="",
                    job_description="Valid job",
                    core_competences="Valid competences",
                    language=ENGLISH,
                )
            )

        # Test empty job description
        with pytest.raises(ValueError):
            generator(
                ComponentGenerationContext(
                    cv="Valid CV",
                    job_description="",
                    core_competences="Valid competences",
                    language=ENGLISH,
                )
            )
