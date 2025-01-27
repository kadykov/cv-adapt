import os
from typing import Any, cast
from unittest.mock import Mock

from pydantic_ai import Agent

import cv_adapter.services.generators.competence_generator
from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.models.language_context_models import CoreCompetence, CoreCompetences
from cv_adapter.services.generators.competence_generator import (
    create_core_competence_generator,
)
from cv_adapter.services.generators.protocols import CoreCompetenceGenerationContext


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


def test_core_competence_generator_dto_output() -> None:
    """Test core competence generator returns a valid CoreCompetenceDTO list."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Create a mock agent
        mock_agent = Mock(spec=Agent)
        mock_agent.run_sync.return_value = Mock(
            data=CoreCompetences(
                items=[
                    CoreCompetence(text="Strategic Project Management"),
                    CoreCompetence(text="Cross-functional Team Leadership"),
                    CoreCompetence(text="Agile Software Development"),
                    CoreCompetence(text="Technical Problem Solving"),
                    CoreCompetence(text="Continuous Improvement Methodology"),
                    CoreCompetence(text="Enterprise Software Architecture"),
                ]
            )
        )

        # Temporarily replace the agent creation in the function
        def mock_agent_factory(*args: Any, **kwargs: Any) -> Agent[Any, Any]:
            return cast(Agent[Any, Any], mock_agent)

        # Temporarily modify the Agent class
        # Dynamically replacing the Agent class with a mock factory function
        # for testing purposes. This is a valid testing technique that
        # cannot be statically type-checked.
        original_agent_factory = getattr(
            cv_adapter.services.generators.competence_generator, "Agent"
        )
        setattr(
            cv_adapter.services.generators.competence_generator,
            "Agent",
            mock_agent_factory,
        )

        try:
            # Create generator
            generator = create_core_competence_generator(ai_model="test")

            # Prepare test context
            context = CoreCompetenceGenerationContext(
                cv="Senior Software Engineer with 10 years of experience",
                job_description="Seeking a Project Manager for innovative tech team",
                language=ENGLISH,
            )

            # Generate competences
            result = generator(context)

            # Assertions
            assert len(result) == 6
            assert all(isinstance(comp, CoreCompetenceDTO) for comp in result)
            assert result[0].text == "Strategic Project Management"
            assert result[1].text == "Cross-functional Team Leadership"
            assert result[2].text == "Agile Software Development"
            assert result[3].text == "Technical Problem Solving"
            assert result[4].text == "Continuous Improvement Methodology"
            assert result[5].text == "Enterprise Software Architecture"

            # Verify agent was called with correct arguments
            mock_agent.run_sync.assert_called_once()
        finally:
            # Restore the original Agent class
            setattr(
                cv_adapter.services.generators.competence_generator,
                "Agent",
                original_agent_factory,
            )
