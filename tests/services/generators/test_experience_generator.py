"""Tests for experience generator."""

import os
from contextlib import AbstractContextManager
from datetime import date
from typing import Any
from unittest.mock import AsyncMock, Mock

import pytest

from cv_adapter.dto import cv as cv_dto
from cv_adapter.models.components import Experience
from cv_adapter.models.components.experience import Company
from cv_adapter.services.generators.experience_generator import (
    create_experience_generator,
)
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)

from .base_test import BaseGeneratorTest


class TestExperienceGenerator(BaseGeneratorTest[ComponentGenerationContext]):
    """Test cases for experience generator."""

    generator_type = AsyncGenerator
    default_template_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "cv_adapter",
        "services",
        "generators",
        "templates",
    )

    async def create_generator(self, **kwargs: Any) -> AsyncGenerator:
        """Create experience generator instance."""
        return await create_experience_generator(**kwargs)

    def get_default_template_paths(self) -> dict[str, str]:
        """Get paths to default templates."""
        return {
            "system_prompt": os.path.join(
                self.default_template_dir, "experience_system_prompt.j2"
            ),
            "context": os.path.join(self.default_template_dir, "experience_context.j2"),
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
    async def test_experience_generation(
        self,
        mock_agent: AsyncMock,
        mock_agent_factory: Any,
        base_context: ComponentGenerationContext,
        language_ctx: AbstractContextManager[None],
    ) -> None:
        """Test experience generation with mocked agent."""
        with language_ctx:
            # Configure mock agent response
            mock_experience = [
                Experience(
                    company=Company(
                        name="Tech Corp",
                        description="Leading technology company",
                        location="San Francisco",
                    ),
                    position="Senior Software Engineer",
                    start_date=date(2020, 1, 1),
                    end_date=date(2023, 1, 1),
                    description="Led development of cloud-native applications",
                    technologies=["Python", "Docker", "Kubernetes"],
                )
            ]
            mock_agent.run.return_value = Mock(data=mock_experience)

            # Patch the Agent class
            from cv_adapter.services.generators import experience_generator as xg

            original_agent = getattr(xg, "Agent")
            setattr(xg, "Agent", mock_agent_factory)

            try:
                # Create generator and generate experience
                generator = await self.create_generator()
                result = await generator(base_context)

                # Verify the result
                assert isinstance(result, list)
                assert len(result) > 0

                experience = result[0]
                assert isinstance(experience, cv_dto.ExperienceDTO)
                assert isinstance(experience.company, cv_dto.InstitutionDTO)
                assert isinstance(experience.position, str)
                assert isinstance(experience.start_date, date)
                assert isinstance(experience.description, str)
                assert isinstance(experience.technologies, list)

                # Verify specific values from mock
                assert experience.company.name == "Tech Corp"
                assert experience.position == "Senior Software Engineer"
                assert (
                    experience.description
                    == "Led development of cloud-native applications"
                )
                assert "Python" in experience.technologies

                # Verify agent was called
                mock_agent.run.assert_called_once()
            finally:
                # Restore the original Agent class
                setattr(xg, "Agent", original_agent)

    @pytest.mark.asyncio
    async def test_experience_generator_validation_job_description(self) -> None:
        """Test experience generator validation for job description."""
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
    async def test_experience_generator_validation_core_competences(self) -> None:
        """Test experience generator validation for core competences."""
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
