"""Tests for skills generator."""

import os
from contextlib import AbstractContextManager
from typing import Any
from unittest.mock import AsyncMock, Mock

import pytest

from cv_adapter.dto import cv as cv_dto
from cv_adapter.models.components import Skill, SkillGroup
from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    ComponentGenerationContext,
)
from cv_adapter.services.generators.skills_generator import (
    create_skills_generator,
)

from .base_test import BaseGeneratorTest


class TestSkillsGenerator(BaseGeneratorTest):
    """Test cases for skills generator."""

    generator_type = AsyncGenerator
    default_template_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
        "cv_adapter",
        "services",
        "generators",
        "templates",
    )

    @pytest.fixture
    def base_context(self) -> ComponentGenerationContext:
        """Create a test context."""
        return ComponentGenerationContext(
            cv="Experienced software engineer with diverse technical skills",
            job_description=(
                "Seeking a senior software engineer with full-stack development skills"
            ),
            core_competences="Technical Leadership Advanced Learning",
            notes=None,
        )

    async def create_generator(self, **kwargs: Any) -> AsyncGenerator:
        """Create skills generator instance."""
        return await create_skills_generator(**kwargs)

    def get_default_template_paths(self) -> dict[str, str]:
        """Get paths to default templates."""
        return {
            "system_prompt": os.path.join(
                self.default_template_dir, "skills_system_prompt.j2"
            ),
            "context": os.path.join(self.default_template_dir, "skills_context.j2"),
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
    async def test_skills_generation(
        self,
        mock_agent: AsyncMock,
        mock_agent_factory: Any,
        base_context: ComponentGenerationContext,
        language_ctx: AbstractContextManager[None],
    ) -> None:
        """Test skills generation with mocked agent."""
        with language_ctx:
            # Configure mock agent response
            mock_agent.run.return_value = Mock(
                data=[
                    SkillGroup(
                        name="Programming Languages",
                        skills=[
                            Skill(text="Python"),
                            Skill(text="JavaScript"),
                            Skill(text="TypeScript"),
                        ],
                    ),
                    SkillGroup(
                        name="Frameworks",
                        skills=[
                            Skill(text="React"),
                            Skill(text="Django"),
                            Skill(text="FastAPI"),
                        ],
                    ),
                ]
            )

            # Patch the Agent class
            from cv_adapter.services.generators import skills_generator as sg

            original_agent = getattr(sg, "Agent")
            setattr(sg, "Agent", mock_agent_factory)

            try:
                # Create generator and generate skills
                generator = await self.create_generator(ai_model="test")
                result = await generator(base_context)

                # Verify the result is a list of SkillGroupDTO
                assert isinstance(result, list)
                assert len(result) == 2

                # Verify each skill group
                for group in result:
                    assert isinstance(group, cv_dto.SkillGroupDTO)
                    assert isinstance(group.name, str)
                    assert len(group.skills) == 3

                    # Verify each skill
                    for skill in group.skills:
                        assert isinstance(skill, cv_dto.SkillDTO)
                        assert isinstance(skill.text, str)
                        assert len(skill.text) > 0

                # Verify specific skill group details
                assert result[0].name == "Programming Languages"
                assert result[1].name == "Frameworks"

                # Verify programming languages skills
                programming_skills = result[0].skills
                assert programming_skills[0].text == "Python"
                assert programming_skills[1].text == "JavaScript"
                assert programming_skills[2].text == "TypeScript"

                # Verify framework skills
                framework_skills = result[1].skills
                assert framework_skills[0].text == "React"
                assert framework_skills[1].text == "Django"
                assert framework_skills[2].text == "FastAPI"

                # Verify agent was called
                mock_agent.run.assert_called_once()
            finally:
                # Restore the original Agent class
                setattr(sg, "Agent", original_agent)
