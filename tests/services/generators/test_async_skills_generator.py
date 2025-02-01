"""Tests for async skills generator."""

from typing import Any, Awaitable, cast
from unittest.mock import AsyncMock, Mock

import pytest
from pydantic_ai import Agent

import cv_adapter.services.generators.skills_generator
from cv_adapter.dto.cv import SkillDTO, SkillGroupDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.components import Skill, SkillGroup
from cv_adapter.models.context import language_context
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.skills_generator import (
    create_async_skills_generator,
    get_skills_generator,
)


@pytest.fixture
def context() -> ComponentGenerationContext:
    """Create a test context."""
    return ComponentGenerationContext(
        cv="Experienced software engineer with diverse technical skills",
        job_description=(
            "Seeking a senior software engineer with full-stack development skills"
        ),
        core_competences="Technical Leadership Advanced Learning",
        notes=None,
    )


@pytest.mark.asyncio
async def test_async_skills_generator_creation() -> None:
    """Test async skills generator creation."""
    generator = await create_async_skills_generator()
    assert isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_skills_generation(context: ComponentGenerationContext) -> None:
    """Test async skills generation."""
    try:
        with language_context(ENGLISH):
            # Create a mock agent
            mock_agent = AsyncMock()
            mock_agent.run.return_value = Mock(
                data=[
                    SkillGroup(
                        name="Programming Languages",
                        skills=[
                            Skill(text="Python"),
                            Skill(text="JavaScript"),
                            Skill(text="TypeScript"),
                        ],
                    ),
                    SkillGroup(
                        name="Frameworks",
                        skills=[
                            Skill(text="React"),
                            Skill(text="Django"),
                            Skill(text="FastAPI"),
                        ],
                    ),
                ]
            )

            # Create a mock agent factory
            def mock_agent_factory(*args: Any, **kwargs: Any) -> Agent[Any, Any]:
                return cast(Agent[Any, Any], mock_agent)

            # Temporarily modify the Agent class
            original_agent = getattr(
                cv_adapter.services.generators.skills_generator, "Agent"
            )
            setattr(
                cv_adapter.services.generators.skills_generator,
                "Agent",
                mock_agent_factory,
            )

            generator = await create_async_skills_generator()
            result = await generator(context)

        # Verify the result is a list of SkillGroupDTO
        assert isinstance(result, list)
        assert len(result) == 2

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

        # Verify specific skill group details
        assert result[0].name == "Programming Languages"
        assert result[1].name == "Frameworks"

        # Verify programming languages skills
        programming_skills = result[0].skills
        assert programming_skills[0].text == "Python"
        assert programming_skills[1].text == "JavaScript"
        assert programming_skills[2].text == "TypeScript"

        # Verify framework skills
        framework_skills = result[1].skills
        assert framework_skills[0].text == "React"
        assert framework_skills[1].text == "Django"
        assert framework_skills[2].text == "FastAPI"

        # Verify agent was called with correct arguments
        mock_agent.run.assert_called_once()
    finally:
        # Restore the original Agent class
        setattr(
            cv_adapter.services.generators.skills_generator,
            "Agent",
            original_agent,
        )


@pytest.mark.asyncio
async def test_get_skills_generator_async() -> None:
    """Test get_skills_generator with async flag."""
    generator_factory = get_skills_generator(use_async=True)
    awaitable_generator = cast(Awaitable[AsyncGenerator], generator_factory)
    generator = await awaitable_generator
    assert isinstance(generator, AsyncGenerator)


def test_get_skills_generator_sync() -> None:
    """Test get_skills_generator without async flag."""
    generator = get_skills_generator(use_async=False)
    assert not isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_skills_generator_validation() -> None:
    """Test async skills generator validation."""
    with language_context(ENGLISH):
        generator = await create_async_skills_generator()

    with pytest.raises(ValueError, match="CV text is required"):
        await generator(
            ComponentGenerationContext(
                cv="", job_description="Test job", core_competences="Test competences"
            )
        )

    with pytest.raises(ValueError, match="Job description is required"):
        await generator(
            ComponentGenerationContext(
                cv="Test CV", job_description="", core_competences="Test competences"
            )
        )

    with pytest.raises(ValueError, match="Core competences are required"):
        await generator(
            ComponentGenerationContext(
                cv="Test CV", job_description="Test job", core_competences=""
            )
        )
