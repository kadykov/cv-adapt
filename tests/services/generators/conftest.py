"""Common fixtures for generator tests."""

from contextlib import AbstractContextManager
from typing import Any, Generator
from unittest.mock import AsyncMock

import pytest
from pydantic_ai import Agent

from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.context import language_context
from cv_adapter.services.generators.protocols import (
    ComponentGenerationContext,
    CoreCompetenceGenerationContext,
)


@pytest.fixture
def base_context() -> ComponentGenerationContext:
    """Create base test context for component generators."""
    return ComponentGenerationContext(
        cv="Experienced software engineer with diverse technical skills",
        job_description=(
            "Seeking a senior software engineer with full-stack development skills"
        ),
        core_competences="Technical Leadership Advanced Learning",
        notes=None,
    )


@pytest.fixture
def competence_context() -> CoreCompetenceGenerationContext:
    """Create test context for competence generator."""
    return CoreCompetenceGenerationContext(
        cv="Experienced software engineer with diverse technical skills",
        job_description=(
            "Seeking a senior software engineer with full-stack development skills"
        ),
        notes=None,
    )


@pytest.fixture
def mock_agent() -> Generator[AsyncMock, None, None]:
    """Create a mock agent with async run method."""
    mock = AsyncMock()
    mock.run = AsyncMock()
    yield mock


@pytest.fixture
def mock_agent_factory(mock_agent: AsyncMock) -> Generator[Any, None, None]:
    """Create a mock agent factory."""

    def factory(*args: Any, **kwargs: Any) -> Agent[Any, Any]:
        return mock_agent

    yield factory


@pytest.fixture
def language_ctx() -> Generator[AbstractContextManager[None], None, None]:
    """Set up English language context."""
    ctx = language_context(ENGLISH)
    yield ctx


@pytest.fixture
def template_paths(tmp_path: Any) -> dict[str, str]:
    """Create and manage test template paths."""
    system_prompt_path = tmp_path / "system_prompt.j2"
    context_path = tmp_path / "context.j2"

    # Create default test templates
    system_prompt_path.write_text("Test system prompt template")
    context_path.write_text(
        "CV: {{ cv }}\n"
        "Job Description: {{ job_description }}\n"
        "{% if core_competences %}Core Competences: {{ core_competences }}{% endif %}\n"
        "{% if notes %}Notes: {{ notes }}{% endif %}"
    )

    return {"system_prompt": str(system_prompt_path), "context": str(context_path)}
