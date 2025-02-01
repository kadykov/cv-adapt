"""Tests for async experience generator."""

from datetime import date
from typing import Awaitable, cast

import pytest

from cv_adapter.dto import cv as cv_dto
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.context import language_context
from cv_adapter.services.generators.experience_generator import (
    create_async_experience_generator,
    get_experience_generator,
)
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)


@pytest.fixture
def context() -> ComponentGenerationContext:
    """Create a test context."""
    return ComponentGenerationContext(
        cv="Experienced software engineer with 10 years of expertise",
        job_description="Seeking a senior software engineer with leadership skills",
        core_competences="Technical Leadership, Strategic Problem Solving",
        notes=None,
    )


@pytest.mark.asyncio
async def test_async_experience_generator_creation() -> None:
    """Test async experience generator creation."""
    generator = await create_async_experience_generator()
    assert isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_experience_generation(context: ComponentGenerationContext) -> None:
    """Test async experience generation."""
    with language_context(ENGLISH):
        generator = await create_async_experience_generator()
        result = await generator(context)

    assert isinstance(result, list)
    assert len(result) > 0

    # Verify the experience is an ExperienceDTO
    experience = result[0]
    assert isinstance(experience, cv_dto.ExperienceDTO)
    assert isinstance(experience.company, cv_dto.InstitutionDTO)
    assert isinstance(experience.position, str)
    assert isinstance(experience.start_date, date)
    assert isinstance(experience.description, str)
    assert isinstance(experience.technologies, list)

    # Verify basic properties of the experience
    assert experience.company.name is not None
    assert experience.position is not None
    assert experience.start_date is not None
    assert experience.description is not None
    assert len(experience.technologies) > 0


@pytest.mark.asyncio
async def test_get_experience_generator_async() -> None:
    """Test get_experience_generator with async flag."""
    generator_factory = get_experience_generator(use_async=True)
    awaitable_generator = cast(Awaitable[AsyncGenerator], generator_factory)
    generator = await awaitable_generator
    assert isinstance(generator, AsyncGenerator)


def test_get_experience_generator_sync() -> None:
    """Test get_experience_generator without async flag."""
    generator = get_experience_generator(use_async=False)
    assert not isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_experience_generator_validation() -> None:
    """Test async experience generator validation."""
    with language_context(ENGLISH):
        generator = await create_async_experience_generator()

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
