"""Tests for async education generator."""

from datetime import date
from typing import Any, Awaitable, cast
from unittest.mock import AsyncMock, Mock

import pytest
from pydantic_ai import Agent

import cv_adapter.services.generators.education_generator
from cv_adapter.dto.cv import EducationDTO, InstitutionDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.components import Education, University
from cv_adapter.models.context import language_context
from cv_adapter.services.generators.education_generator import (
    create_async_education_generator,
    get_education_generator,
)
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)


@pytest.fixture
def context() -> ComponentGenerationContext:
    """Create a test context."""
    return ComponentGenerationContext(
        cv="Experienced software engineer with advanced academic background",
        job_description=(
            "Seeking a senior software engineer with advanced technical skills"
        ),
        core_competences="Technical Leadership Advanced Learning",
        notes=None,
    )


@pytest.mark.asyncio
async def test_async_education_generator_creation() -> None:
    """Test async education generator creation."""
    generator = await create_async_education_generator()
    assert isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_education_generation(context: ComponentGenerationContext) -> None:
    """Test async education generation."""
    try:
        with language_context(ENGLISH):
            # Create a mock agent
            mock_agent = AsyncMock()
            mock_agent.run.return_value = Mock(
                data=[
                    Education(
                        university=University(
                            name="Tech University",
                            description=(
                                "Leading technology and engineering institution"
                            ),
                            location="San Francisco, CA",
                        ),
                        degree="Master of Science in Computer Science",
                        start_date=date(2018, 9, 1),
                        end_date=date(2020, 5, 15),
                        description=(
                            "Specialized in machine learning and AI technologies"
                        ),
                    )
                ]
            )

            # Create a mock agent factory
            def mock_agent_factory(*args: Any, **kwargs: Any) -> Agent[Any, Any]:
                return cast(Agent[Any, Any], mock_agent)

            # Temporarily modify the Agent class
            original_agent = getattr(
                cv_adapter.services.generators.education_generator, "Agent"
            )
            setattr(
                cv_adapter.services.generators.education_generator,
                "Agent",
                mock_agent_factory,
            )

            generator = await create_async_education_generator()
            result = await generator(context)

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
        mock_agent.run.assert_called_once()
    finally:
        # Restore the original Agent class
        setattr(
            cv_adapter.services.generators.education_generator,
            "Agent",
            original_agent,
        )


@pytest.mark.asyncio
async def test_get_education_generator_async() -> None:
    """Test get_education_generator with async flag."""
    generator_factory = get_education_generator(use_async=True)
    awaitable_generator = cast(Awaitable[AsyncGenerator], generator_factory)
    generator = await awaitable_generator
    assert isinstance(generator, AsyncGenerator)


def test_get_education_generator_sync() -> None:
    """Test get_education_generator without async flag."""
    generator = get_education_generator(use_async=False)
    assert not isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_education_generator_validation() -> None:
    """Test async education generator validation."""
    with language_context(ENGLISH):
        generator = await create_async_education_generator()

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
