import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import Title
from cv_adapter.models.generators import TitleGeneratorInput
from cv_adapter.services.generators.title_generator import TitleGenerator


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model."""
    model = TestModel()
    model.custom_result_args = {"text": "Senior DevOps Engineer & Cloud Architect"}
    return model


def test_title_generator(test_model: TestModel) -> None:
    """Test title generation with valid input."""
    generator = TitleGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        input_data = TitleGeneratorInput(
            cv_text="# CV\n\nDetailed professional experience...",
            job_description=("# Job Description\n\nSeeking a senior developer..."),
            core_competences=(
                "Python Development, Cloud Architecture, "
                "Team Leadership, Data Engineering"
            ),
        )
        title = generator.generate(input_data)

        assert isinstance(title, Title)
        assert len(title.text) <= 100
        assert "Cloud" in title.text


def test_title_generator_with_notes(test_model: TestModel) -> None:
    """Test title generation with notes."""
    generator = TitleGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        input_data = TitleGeneratorInput(
            cv_text="# CV\n\nDetailed professional experience...",
            job_description=("# Job Description\n\nSeeking a senior developer..."),
            core_competences=(
                "Python Development, Cloud Architecture, "
                "Team Leadership, Data Engineering"
            ),
            notes="Focus on DevOps expertise",
        )
        title = generator.generate(input_data)

        assert isinstance(title, Title)
        assert "DevOps" in title.text
