import os
import pytest
from typing import Any, cast
from unittest.mock import Mock

from pydantic_ai import Agent

import cv_adapter.services.generators.skills_generator
from cv_adapter.dto.cv import SkillDTO, SkillGroupDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.models.language_context_models import Skill, SkillGroup
from cv_adapter.services.generators.protocols import ComponentGenerationContext
from cv_adapter.services.generators.skills_generator import create_skills_generator


def test_skills_generator_default_templates() -> None:
    """Test the skills generator with default templates."""
    # Use default template paths
    default_system_prompt_path = os.path.join(
        os.path.dirname(cv_adapter.services.generators.skills_generator.__file__),
        "templates",
        "skills_system_prompt.j2",
    )
    default_context_path = os.path.join(
        os.path.dirname(cv_adapter.services.generators.skills_generator.__file__),
        "templates",
        "skills_context.j2",
    )

    # Verify default template paths exist
    assert os.path.exists(default_system_prompt_path), (
        "Default system prompt template not found"
    )
    assert os.path.exists(default_context_path), "Default context template not found"

    # Create generator
    generator = create_skills_generator(
        ai_model="test",
        system_prompt_template_path=default_system_prompt_path,
        context_template_path=default_context_path,
    )

    # Verify generator is created successfully
    assert generator is not None


def test_skills_generator_custom_templates(tmp_path: Any) -> None:
    """Test the skills generator with custom templates."""
    # Create custom templates
    system_prompt_path = tmp_path / "system_prompt.j2"
    system_prompt_path.write_text(
        "An expert CV analyst that helps identify and organize skills. "
        "Generate skill groups that match job requirements."
    )

    context_template_path = tmp_path / "context.j2"
    context_template_path.write_text(
        "CV: {{ cv }}\n"
        "Job Description: {{ job_description }}\n"
        "Core Competences: {{ core_competences }}"
    )

    # Create generator with custom templates
    generator = create_skills_generator(
        ai_model="test",
        system_prompt_template_path=str(system_prompt_path),
        context_template_path=str(context_template_path),
    )

    # Verify generator is created successfully
    assert generator is not None


def test_skills_generator_dto_output() -> None:
    """Test skills generator returns a valid List[SkillGroupDTO]."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Create a mock agent
        mock_agent = Mock(spec=Agent)
        mock_agent.run_sync.return_value = Mock(
            data=[
                SkillGroup(
                    name="Programming Languages",
                    skills=[
                        Skill(text="Python"),
                        Skill(text="JavaScript"),
                        Skill(text="TypeScript"),
                    ]
                ),
                SkillGroup(
                    name="Frameworks",
                    skills=[
                        Skill(text="React"),
                        Skill(text="Django"),
                        Skill(text="FastAPI"),
                    ]
                ),
            ]
        )

        # Temporarily replace the agent creation in the function
        def mock_agent_factory(*args: Any, **kwargs: Any) -> Agent[Any, Any]:
            return cast(Agent[Any, Any], mock_agent)

        # Temporarily modify the Agent class
        original_agent_factory = getattr(
            cv_adapter.services.generators.skills_generator, "Agent"
        )
        setattr(
            cv_adapter.services.generators.skills_generator,
            "Agent",
            mock_agent_factory,
        )

        try:
            # Create generator
            generator = create_skills_generator(ai_model="test")

            # Prepare test context
            context = ComponentGenerationContext(
                cv="Experienced software engineer with diverse technical skills",
                job_description=(
                    "Seeking a senior software engineer "
                    "with full-stack development skills"
                ),
                core_competences="Technical Leadership, Advanced Learning",
                language=ENGLISH,
            )

            # Generate skills
            result = generator(context)

            # Verify the result is a list of SkillGroupDTO
            assert isinstance(result, list)
            assert all(isinstance(group, SkillGroupDTO) for group in result)

            # Verify skill groups
            assert len(result) == 2
            assert result[0].name == "Programming Languages"
            assert result[1].name == "Frameworks"

            # Verify each skill group
            for group in result:
                assert isinstance(group, SkillGroupDTO)
                assert isinstance(group.name, str)
                assert len(group.skills) == 3

                # Verify each skill
                for skill in group.skills:
                    assert isinstance(skill, SkillDTO)
                    assert isinstance(skill.text, str)
                    assert len(skill.text) > 0

            # Verify agent was called with correct arguments
            mock_agent.run_sync.assert_called_once()
        finally:
            # Restore the original Agent class
            setattr(
                cv_adapter.services.generators.skills_generator,
                "Agent",
                original_agent_factory,
            )


def test_skills_generator_raises_error_on_empty_parameters() -> None:
    """Test that generator raises ValueError when required parameters are empty."""
    with language_context(ENGLISH):
        generator = create_skills_generator(ai_model="test")

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

        # Test empty core competences
        with pytest.raises(ValueError):
            generator(
                ComponentGenerationContext(
                    cv="Valid CV",
                    job_description="Valid job",
                    core_competences="",
                    language=ENGLISH,
                )
            )
