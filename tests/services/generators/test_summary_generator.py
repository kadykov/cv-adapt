"""Tests for summary generator."""

import os
from typing import Any
from unittest.mock import AsyncMock, Mock

import pytest

from cv_adapter.dto import cv as cv_dto
from cv_adapter.models.components import CVSummary
from cv_adapter.renderers.markdown import MinimalMarkdownRenderer
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.summary_generator import create_summary_generator

from .base_test import BaseGeneratorTest


class TestSummaryGenerator(BaseGeneratorTest):
    """Test cases for summary generator."""

    generator_type = AsyncGenerator
    default_template_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "cv_adapter",
        "services",
        "generators",
        "templates",
    )

    @pytest.fixture
    def renderer(self) -> MinimalMarkdownRenderer:
        """Create a test renderer."""
        return MinimalMarkdownRenderer()

    async def create_generator(self, **kwargs: Any) -> AsyncGenerator:
        """Create summary generator instance."""
        if "renderer" not in kwargs:
            kwargs["renderer"] = MinimalMarkdownRenderer()
        return await create_summary_generator(**kwargs)

    def get_default_template_paths(self) -> dict[str, str]:
        """Get paths to default templates."""
        return {
            "system_prompt": os.path.join(
                self.default_template_dir, "summary_system_prompt.j2"
            ),
            "context": os.path.join(self.default_template_dir, "summary_context.j2"),
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
    async def test_summary_generation(
        self,
        mock_agent: AsyncMock,
        mock_agent_factory: Any,
        base_context: ComponentGenerationContext,
        language_ctx: Any,
    ) -> None:
        """Test summary generation with mocked agent."""
        with language_ctx:
            # Configure mock agent response
            mock_summary_text = (
                "Experienced software engineer specialized in full-stack development"
            )
            mock_agent.run.return_value = Mock(data=CVSummary(text=mock_summary_text))

            # Patch the Agent class
            from cv_adapter.services.generators import summary_generator as sg

            original_agent = getattr(sg, "Agent")
            setattr(sg, "Agent", mock_agent_factory)

            try:
                # Create generator and generate summary
                generator = await self.create_generator()
                result = await generator(base_context)

                # Verify the result
                assert isinstance(result, cv_dto.SummaryDTO)
                assert isinstance(result.text, str)
                assert len(result.text) > 0
                assert result.text == mock_summary_text

                # Verify agent was called
                mock_agent.run.assert_called_once()
            finally:
                # Restore the original Agent class
                setattr(sg, "Agent", original_agent)

    @pytest.mark.asyncio
    async def test_summary_generator_validation_job_description(self) -> None:
        """Test summary generator validation for job description."""
        generator = await self.create_generator()
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
    async def test_summary_generator_validation_core_competences(self) -> None:
        """Test summary generator validation for core competences."""
        generator = await self.create_generator()
        with pytest.raises(ValueError, match="Core competences are required"):
            await generator(
                ComponentGenerationContext(
                    cv="Test CV",
                    job_description="Test job",
                    core_competences="",  # Invalid: empty core competences
                    notes=None,
                )
            )
