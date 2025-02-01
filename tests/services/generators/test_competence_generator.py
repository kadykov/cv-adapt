"""Tests for core competence generator."""

import os
from contextlib import AbstractContextManager
from typing import Any
from unittest.mock import AsyncMock, Mock

import pytest

from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.models.components import CoreCompetence, CoreCompetences
from cv_adapter.services.generators.competence_generator import (
    create_core_competence_generator,
)
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    CoreCompetenceGenerationContext,
)

from .base_test import BaseGeneratorTest


class TestCompetenceGenerator(BaseGeneratorTest[CoreCompetenceGenerationContext]):
    """Test cases for core competence generator."""

    generator_type = AsyncGenerator
    default_template_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "cv_adapter",
        "services",
        "generators",
        "templates",
    )

    async def create_generator(self, **kwargs: Any) -> AsyncGenerator:
        """Create competence generator instance."""
        return await create_core_competence_generator(**kwargs)

    def get_default_template_paths(self) -> dict[str, str]:
        """Get paths to default templates."""
        return {
            "system_prompt": os.path.join(
                self.default_template_dir, "competence_system_prompt.j2"
            ),
            "context": os.path.join(self.default_template_dir, "competence_context.j2"),
        }

    def get_invalid_context(self) -> CoreCompetenceGenerationContext:
        """Get invalid context for validation tests."""
        return CoreCompetenceGenerationContext(
            cv="",  # Invalid: empty CV
            job_description="Test job",
            notes=None,
        )

    @pytest.mark.asyncio
    async def test_competence_generation(
        self,
        mock_agent: AsyncMock,
        mock_agent_factory: Any,
        competence_context: CoreCompetenceGenerationContext,
        language_ctx: AbstractContextManager[None],
    ) -> None:
        """Test competence generation with mocked agent."""
        with language_ctx:
            # Configure mock agent response
            mock_competences = CoreCompetences(
                items=[
                    CoreCompetence(text="Technical Leadership"),
                    CoreCompetence(text="Full Stack Development"),
                    CoreCompetence(text="Software Architecture"),
                    CoreCompetence(text="Agile Project Management"),
                ]
            )
            mock_agent.run.return_value = Mock(data=mock_competences)

            # Patch the Agent class
            from cv_adapter.services.generators import competence_generator as cg

            original_agent = getattr(cg, "Agent")
            setattr(cg, "Agent", mock_agent_factory)

            try:
                # Create generator and generate competences
                generator = await self.create_generator()
                result = await generator(competence_context)

                # Verify the result
                assert isinstance(result, list)
                assert len(result) == 4
                assert all(isinstance(comp, CoreCompetenceDTO) for comp in result)

                # Verify specific values from mock
                assert result[0].text == "Technical Leadership"
                assert result[1].text == "Full Stack Development"
                assert result[2].text == "Software Architecture"
                assert result[3].text == "Agile Project Management"

                # Verify agent was called
                mock_agent.run.assert_called_once()
            finally:
                # Restore the original Agent class
                setattr(cg, "Agent", original_agent)

    @pytest.mark.asyncio
    async def test_competence_generator_validation_job_description(self) -> None:
        """Test competence generator validation for job description."""
        generator = await self.create_generator()
        with pytest.raises(ValueError, match="Job description is required"):
            await generator(
                CoreCompetenceGenerationContext(
                    cv="Test CV",
                    job_description="",  # Invalid: empty job description
                    notes=None,
                )
            )
