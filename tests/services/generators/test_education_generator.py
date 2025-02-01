"""Tests for education generator."""

import os
from contextlib import AbstractContextManager
from datetime import date
from typing import Any
from unittest.mock import AsyncMock, Mock

import pytest

from cv_adapter.dto import cv as cv_dto
from cv_adapter.models.components import Education, University
from cv_adapter.services.generators.education_generator import (
    create_education_generator,
)
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)

from .base_test import BaseGeneratorTest


class TestEducationGenerator(BaseGeneratorTest):
    """Test cases for education generator."""

    generator_type = AsyncGenerator
    default_template_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "cv_adapter",
        "services",
        "generators",
        "templates",
    )

    async def create_generator(self, **kwargs: Any) -> AsyncGenerator:
        """Create education generator instance."""
        return await create_education_generator(**kwargs)

    def get_default_template_paths(self) -> dict[str, str]:
        """Get paths to default templates."""
        return {
            "system_prompt": os.path.join(
                self.default_template_dir, "education_system_prompt.j2"
            ),
            "context": os.path.join(self.default_template_dir, "education_context.j2"),
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
    async def test_education_generation(
        self,
        mock_agent: AsyncMock,
        mock_agent_factory: Any,
        base_context: ComponentGenerationContext,
        language_ctx: AbstractContextManager[None],
    ) -> None:
        """Test education generation with mocked agent."""
        with language_ctx:
            # Configure mock agent response
            mock_education = [
                Education(
                    university=University(
                        name="Tech University",
                        description="Leading technology and engineering institution",
                        location="San Francisco, CA",
                    ),
                    degree="Master of Science in Computer Science",
                    start_date=date(2018, 9, 1),
                    end_date=date(2020, 5, 15),
                    description="Specialized in machine learning and AI technologies",
                )
            ]
            mock_agent.run.return_value = Mock(data=mock_education)

            # Patch the Agent class
            from cv_adapter.services.generators import education_generator as eg

            original_agent = getattr(eg, "Agent")
            setattr(eg, "Agent", mock_agent_factory)

            try:
                # Create generator and generate education
                generator = await self.create_generator()
                result = await generator(base_context)

                # Verify the result
                assert isinstance(result, list)
                assert len(result) == 1

                education = result[0]
                assert isinstance(education, cv_dto.EducationDTO)
                assert isinstance(education.university, cv_dto.InstitutionDTO)
                assert isinstance(education.degree, str)
                assert isinstance(education.start_date, date)
                assert isinstance(education.description, str)

                # Verify specific values from mock
                assert education.university.name == "Tech University"
                assert education.degree == "Master of Science in Computer Science"
                assert (
                    education.description
                    == "Specialized in machine learning and AI technologies"
                )
                assert education.university.location == "San Francisco, CA"
                assert education.start_date == date(2018, 9, 1)
                assert education.end_date == date(2020, 5, 15)

                # Verify agent was called
                mock_agent.run.assert_called_once()
            finally:
                # Restore the original Agent class
                setattr(eg, "Agent", original_agent)

    @pytest.mark.asyncio
    async def test_education_generator_validation_job_description(
        self,
        language_ctx: AbstractContextManager[None],
    ) -> None:
        """Test education generator validation for job description."""
        with language_ctx:
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
    async def test_education_generator_validation_core_competences(
        self,
        language_ctx: AbstractContextManager[None],
    ) -> None:
        """Test education generator validation for core competences."""
        with language_ctx:
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
