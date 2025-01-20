import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import Title
from cv_adapter.services.title_generator import TitleGenerator


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model."""
    model = TestModel()
    model.custom_result_args = {"text": "Senior DevOps Engineer & Cloud Architect"}
    return model


def test_title_generator(test_model: TestModel) -> None:
    generator = TitleGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        title = generator.generate(
            cv_text="# CV\n\nDetailed professional experience...",
            job_description=("# Job Description\n\nSeeking a senior developer..."),
            core_competences=(
                "Python Development, Cloud Architecture, "
                "Team Leadership, Data Engineering"
            ),
        )

        assert isinstance(title, Title)
        assert len(title.text) <= 100
        assert "Cloud" in title.text


def test_title_generator_with_notes(test_model: TestModel) -> None:
    generator = TitleGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        title = generator.generate(
            cv_text="# CV\n\nDetailed professional experience...",
            job_description=("# Job Description\n\nSeeking a senior developer..."),
            core_competences=(
                "Python Development, Cloud Architecture, "
                "Team Leadership, Data Engineering"
            ),
            notes="Focus on DevOps expertise",
        )

        assert isinstance(title, Title)
        assert "DevOps" in title.text


def test_title_validation(test_model: TestModel) -> None:
    generator = TitleGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        with pytest.raises(ValueError, match="CV text is required"):
            generator.generate(
                cv_text="",
                job_description=("# Job Description\n\nSeeking a senior developer..."),
                core_competences="Python Development",
            )

        with pytest.raises(ValueError, match="Job description is required"):
            generator.generate(
                cv_text="# CV\n\nDetailed professional experience...",
                job_description="",
                core_competences="Python Development",
            )

        with pytest.raises(ValueError, match="Core competences are required"):
            generator.generate(
                cv_text="# CV\n\nDetailed professional experience...",
                job_description=("# Job Description\n\nSeeking a senior developer..."),
                core_competences="",
            )
