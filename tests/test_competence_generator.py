"""Tests for the competence generator service."""

from unittest.mock import MagicMock, patch

import pytest
from pydantic_ai import Agent

from cv_adapter.models.cv import CoreCompetence, CoreCompetences
from cv_adapter.models.generators import CompetenceGeneratorInput
from cv_adapter.services.generators.competence_generator import CompetenceGenerator


@pytest.fixture
def mock_agent(monkeypatch: pytest.MonkeyPatch) -> MagicMock:
    """Create a mock Agent instance."""
    mock = MagicMock(spec=Agent)
    mock.run_sync.return_value.data = CoreCompetences(
        items=[
            CoreCompetence(text="Python Development"),
            CoreCompetence(text="Cloud Architecture"),
            CoreCompetence(text="Team Leadership"),
            CoreCompetence(text="System Design"),
        ]
    )
    monkeypatch.setattr(
        "cv_adapter.services.generators.competence_generator.Agent",
        lambda *args, **kwargs: mock,
    )
    return mock


class TestCompetenceGenerator:
    """Test suite for CompetenceGenerator."""

    def test_initialization(self) -> None:
        """Test that generator is initialized with correct model."""
        with patch("pydantic_ai.models.openai.AsyncOpenAI"):
            generator = CompetenceGenerator(ai_model="openai:gpt-4o")
            assert isinstance(generator.agent, Agent)

    def test_generate_competences(self, mock_agent: MagicMock) -> None:
        """Test competence generation with valid input."""
        generator = CompetenceGenerator()
        input_data = CompetenceGeneratorInput(
            cv_text="Python developer with 5 years experience",
            job_description="Looking for a senior Python developer",
            notes="Focus on technical skills",
        )

        result = generator.generate(input_data)

        assert isinstance(result, CoreCompetences)
        assert len(result.items) == 4
        assert any(comp.text == "Python Development" for comp in result.items)

        # Verify agent was called with correct context
        call_args = mock_agent.run_sync.call_args[0][0]
        assert input_data.cv_text in call_args
        assert input_data.job_description in call_args
        assert input_data.notes in call_args

    def test_generate_without_notes(self, mock_agent: MagicMock) -> None:
        """Test competence generation without optional notes."""
        generator = CompetenceGenerator()
        input_data = CompetenceGeneratorInput(
            cv_text="Python developer with 5 years experience",
            job_description="Looking for a senior Python developer",
        )

        result = generator.generate(input_data)

        assert isinstance(result, CoreCompetences)
        # Verify notes section is not in context
        call_args = mock_agent.run_sync.call_args[0][0]
        assert "User Notes for Consideration" not in call_args
