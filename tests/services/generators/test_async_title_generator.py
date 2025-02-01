"""Tests for async title generator."""

from typing import Any, Awaitable, cast
from unittest.mock import AsyncMock, Mock

import pytest
from pydantic_ai import Agent

import cv_adapter.services.generators.title_generator
from cv_adapter.dto.cv import TitleDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.components import Title
from cv_adapter.models.context import language_context
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.title_generator import (
    create_async_title_generator,
    get_title_generator,
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
async def test_async_title_generator_creation() -> None:
    """Test async title generator creation."""
    generator = await create_async_title_generator()
    assert isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_title_generation(context: ComponentGenerationContext) -> None:
    """Test async title generation."""
    try:
        with language_context(ENGLISH):
            # Create a mock agent
            mock_agent = AsyncMock()
            mock_agent.run.return_value = Mock(
                data=Title(text="Senior Software Engineer")
            )

            # Create a mock agent factory
            def mock_agent_factory(*args: Any, **kwargs: Any) -> Agent[Any, Any]:
                return cast(Agent[Any, Any], mock_agent)

            # Temporarily modify the Agent class
            original_agent = getattr(
                cv_adapter.services.generators.title_generator, "Agent"
            )
            setattr(
                cv_adapter.services.generators.title_generator,
                "Agent",
                mock_agent_factory,
            )

            generator = await create_async_title_generator()
            result = await generator(context)

            # Verify the result is a TitleDTO
            assert isinstance(result, TitleDTO)
            assert isinstance(result.text, str)
            assert len(result.text) > 0
            assert result.text == "Senior Software Engineer"

            # Verify agent was called with correct arguments
            mock_agent.run.assert_called_once()
    finally:
        # Restore the original Agent class
        setattr(
            cv_adapter.services.generators.title_generator,
            "Agent",
            original_agent,
        )


@pytest.mark.asyncio
async def test_get_title_generator_async() -> None:
    """Test get_title_generator with async flag."""
    generator_factory = get_title_generator(use_async=True)
    awaitable_generator = cast(Awaitable[AsyncGenerator], generator_factory)
    generator = await awaitable_generator
    assert isinstance(generator, AsyncGenerator)


def test_get_title_generator_sync() -> None:
    """Test get_title_generator without async flag."""
    generator = get_title_generator(use_async=False)
    assert not isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_title_generator_validation() -> None:
    """Test async title generator validation."""
    with language_context(ENGLISH):
        generator = await create_async_title_generator()

    with pytest.raises(ValueError, match="CV text is required"):
        await generator(
            ComponentGenerationContext(
                cv="",
                job_description="Test job",
                core_competences="Test competences",
                notes=None,
            )
        )

    with pytest.raises(ValueError, match="Job description is required"):
        await generator(
            ComponentGenerationContext(
                cv="Test CV",
                job_description="",
                core_competences="Test competences",
                notes=None,
            )
        )

    with pytest.raises(ValueError, match="Core competences are required"):
        await generator(
            ComponentGenerationContext(
                cv="Test CV",
                job_description="Test job",
                core_competences="",
                notes=None,
            )
        )
