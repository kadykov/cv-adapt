"""Tests for async summary generator."""

from typing import Awaitable, cast

import pytest

from cv_adapter.dto import cv as cv_dto
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.context import language_context
from cv_adapter.renderers.markdown import MinimalMarkdownRenderer
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.summary_generator import (
    create_async_summary_generator,
    get_summary_generator,
)


@pytest.fixture
def context() -> ComponentGenerationContext:
    """Create a test context."""
    return ComponentGenerationContext(
        cv="Test CV content",
        job_description="Software Engineer position",
        core_competences="Python, Testing",
        notes=None,
    )


@pytest.fixture
def renderer() -> MinimalMarkdownRenderer:
    """Create a test renderer."""
    return MinimalMarkdownRenderer()


@pytest.mark.asyncio
async def test_async_summary_generator_creation(
    renderer: MinimalMarkdownRenderer,
) -> None:
    """Test async summary generator creation."""
    generator = await create_async_summary_generator(renderer)
    assert isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_summary_generation(
    renderer: MinimalMarkdownRenderer, context: ComponentGenerationContext
) -> None:
    """Test async summary generation."""
    with language_context(ENGLISH):
        generator = await create_async_summary_generator(renderer)
        result = await generator(context)
    assert isinstance(result, cv_dto.SummaryDTO)
    assert result.text


@pytest.mark.asyncio
async def test_get_summary_generator_async(renderer: MinimalMarkdownRenderer) -> None:
    """Test get_summary_generator with async flag."""
    generator_factory = get_summary_generator(renderer, use_async=True)
    awaitable_generator = cast(Awaitable[AsyncGenerator], generator_factory)
    generator = await awaitable_generator
    assert isinstance(generator, AsyncGenerator)


def test_get_summary_generator_sync(renderer: MinimalMarkdownRenderer) -> None:
    """Test get_summary_generator without async flag."""
    generator = get_summary_generator(renderer, use_async=False)
    assert not isinstance(generator, AsyncGenerator)


@pytest.mark.asyncio
async def test_async_summary_generator_validation(
    renderer: MinimalMarkdownRenderer,
) -> None:
    """Test async summary generator validation."""
    with language_context(ENGLISH):
        generator = await create_async_summary_generator(renderer)

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
