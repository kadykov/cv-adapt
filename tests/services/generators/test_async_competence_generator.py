"""Tests for async core competence generator."""

from typing import Any, Awaitable, cast
from unittest.mock import AsyncMock, Mock

import pytest
from pydantic_ai import Agent

import cv_adapter.services.generators.competence_generator
from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.components import CoreCompetence, CoreCompetences
from cv_adapter.models.context import language_context
from cv_adapter.services.generators.competence_generator import (
    create_async_core_competence_generator,
    get_core_competence_generator,
)
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    CoreCompetenceGenerationContext,
)


@pytest.fixture
def context() -> CoreCompetenceGenerationContext:
    """Create a test context."""
    return CoreCompetenceGenerationContext(
        cv="Experienced software engineer with diverse technical skills",
        job_description=(
            "Seeking a senior software engineer with full-stack development skills"
        ),
        notes=None,
    )


@pytest.mark.asyncio
async def test_async_competence_generator_creation() -> None:
    """Test async competence generator creation."""
    generator = await create_async_core_competence_generator()
    assert isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_competence_generation(
    context: CoreCompetenceGenerationContext,
) -> None:
    """Test async competence generation."""
    try:
        with language_context(ENGLISH):
            # Create a mock agent
            mock_agent = AsyncMock()
            mock_agent.run.return_value = Mock(
                data=CoreCompetences(
                    items=[
                        CoreCompetence(text="Technical Leadership"),
                        CoreCompetence(text="Full Stack Development"),
                        CoreCompetence(text="Software Architecture"),
                        CoreCompetence(text="Agile Project Management"),
                    ]
                )
            )

            # Create a mock agent factory
            def mock_agent_factory(*args: Any, **kwargs: Any) -> Agent[Any, Any]:
                return cast(Agent[Any, Any], mock_agent)

            # Temporarily modify the Agent class
            original_agent = getattr(
                cv_adapter.services.generators.competence_generator, "Agent"
            )
            setattr(
                cv_adapter.services.generators.competence_generator,
                "Agent",
                mock_agent_factory,
            )

            generator = await create_async_core_competence_generator()
            result = await generator(context)

            # Verify the result is a list of CoreCompetenceDTO
            assert isinstance(result, list)
            assert len(result) == 4
            assert all(isinstance(comp, CoreCompetenceDTO) for comp in result)
            assert result[0].text == "Technical Leadership"
            assert result[1].text == "Full Stack Development"
            assert result[2].text == "Software Architecture"
            assert result[3].text == "Agile Project Management"

            # Verify agent was called with correct arguments
            mock_agent.run.assert_called_once()
    finally:
        # Restore the original Agent class
        setattr(
            cv_adapter.services.generators.competence_generator,
            "Agent",
            original_agent,
        )


@pytest.mark.asyncio
async def test_get_competence_generator_async() -> None:
    """Test get_competence_generator with async flag."""
    generator_factory = get_core_competence_generator(use_async=True)
    awaitable_generator = cast(Awaitable[AsyncGenerator], generator_factory)
    generator = await awaitable_generator
    assert isinstance(generator, AsyncGenerator)


def test_get_competence_generator_sync() -> None:
    """Test get_competence_generator without async flag."""
    generator = get_core_competence_generator(use_async=False)
    assert not isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_competence_generator_validation() -> None:
    """Test async competence generator validation."""
    with language_context(ENGLISH):
        generator = await create_async_core_competence_generator()

    with pytest.raises(ValueError, match="CV text is required"):
        await generator(
            CoreCompetenceGenerationContext(
                cv="",
                job_description="Test job",
                notes=None,
            )
        )

    with pytest.raises(ValueError, match="Job description is required"):
        await generator(
            CoreCompetenceGenerationContext(
                cv="Test CV",
                job_description="",
                notes=None,
            )
        )
