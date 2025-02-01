"""Tests for title generator."""

import os
from contextlib import AbstractContextManager
from typing import Any
from unittest.mock import AsyncMock, Mock

import pytest

from cv_adapter.dto.cv import TitleDTO
from cv_adapter.models.components import Title
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.title_generator import create_title_generator

from .base_test import BaseGeneratorTest


class TestTitleGenerator(BaseGeneratorTest):
    """Test cases for title generator."""

    generator_type = AsyncGenerator
    default_template_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "cv_adapter",
        "services",
        "generators",
        "templates",
    )

    async def create_generator(self, **kwargs: Any) -> AsyncGenerator:
        """Create title generator instance."""
        return await create_title_generator(**kwargs)

    def get_default_template_paths(self) -> dict[str, str]:
        """Get paths to default templates."""
        return {
            "system_prompt": os.path.join(
                self.default_template_dir, "title_system_prompt.j2"
            ),
            "context": os.path.join(self.default_template_dir, "title_context.j2"),
        }

    def get_invalid_context(self) -> ComponentGenerationContext:
        """Get invalid context for validation tests."""
        return ComponentGenerationContext(
            cv="",  # Invalid: empty CV
            job_description="Test job",
            core_competences="Test competences",
            notes=None,
        )

    @pytest.mark.asyncio
    async def test_title_generation(
        self,
        mock_agent: AsyncMock,
        mock_agent_factory: Any,
        base_context: ComponentGenerationContext,
        language_ctx: AbstractContextManager[None],
    ) -> None:
        """Test title generation with mocked agent."""
        with language_ctx:
            # Configure mock agent response
            mock_agent.run.return_value = Mock(
                data=Title(text="Senior Software Engineer")
            )

            # Patch the Agent class
            import cv_adapter.services.generators.title_generator as title_generator

            original_agent = getattr(title_generator, "Agent")
            setattr(title_generator, "Agent", mock_agent_factory)

            try:
                # Create generator and generate title
                generator = await self.create_generator(ai_model="test")
                result = await generator(base_context)

                # Verify the result
                assert isinstance(result, TitleDTO)
                assert isinstance(result.text, str)
                assert len(result.text) > 0
                assert result.text == "Senior Software Engineer"

                # Verify agent was called
                mock_agent.run.assert_called_once()
            finally:
                # Restore the original Agent class
                setattr(title_generator, "Agent", original_agent)

    @pytest.mark.asyncio
    async def test_title_generator_validation_job_description(self) -> None:
        """Test title generator validation for job description."""
        generator = await self.create_generator(ai_model="test")
        with pytest.raises(ValueError, match="Job description is required"):
            await generator(
                ComponentGenerationContext(
                    cv="Test CV",
                    job_description="",  # Invalid: empty job description
                    core_competences="Test competences",
                    notes=None,
                )
            )

    @pytest.mark.asyncio
    async def test_title_generator_validation_core_competences(self) -> None:
        """Test title generator validation for core competences."""
        generator = await self.create_generator(ai_model="test")
        with pytest.raises(ValueError, match="Core competences are required"):
            await generator(
                ComponentGenerationContext(
                    cv="Test CV",
                    job_description="Test job",
                    core_competences="",  # Invalid: empty core competences
                    notes=None,
                )
            )
