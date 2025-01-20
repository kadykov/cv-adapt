from datetime import date

import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import Experience
from cv_adapter.models.generators import ExperienceGeneratorInput
from cv_adapter.services.experience_generator import ExperienceGenerator


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model."""
    model = TestModel()
    model.custom_result_args = [
        {
            "company": {
                "name": "Tech Corp",
                "description": "Leading software company",
                "location": "San Francisco, CA",
            },
            "position": "Senior Software Engineer",
            "start_date": date(2020, 1, 1),
            "end_date": date(2023, 12, 31),
            "description": (
                "Led cloud app development using Python and Kubernetes. Improved "
                "system performance by 40% through microservices redesign. Mentored "
                "junior developers and implemented CI/CD best practices."
            ),
            "technologies": ["Python", "Kubernetes", "Docker", "AWS"],
        },
        {
            "company": {
                "name": "Data Solutions Inc",
                "description": "Data analytics company",
                "location": "New York, NY",
            },
            "position": "Data Engineer",
            "start_date": date(2018, 6, 1),
            "end_date": date(2019, 12, 31),
            "description": (
                "Developed ETL pipelines processing 1TB+ data daily. "
                "Implemented data quality monitoring reducing errors by 60%. "
                "Collaborated with data scientists to optimize ML model deployment."
            ),
            "technologies": ["Python", "SQL", "Apache Spark", "Airflow"],
        },
    ]
    return model


def test_experience_generator(test_model: TestModel) -> None:
    """Test that experience generator produces valid experiences."""
    generator = ExperienceGenerator(ai_model="test")
    input_data = ExperienceGeneratorInput(
        cv_text="# CV\n\nDetailed professional experience...",
        job_description="# Job Description\n\nSeeking a senior developer...",
        core_competences=(
            "Python Development, Cloud Architecture, Team Leadership, Data Engineering"
        ),
    )

    with generator.agent.override(model=test_model):
        experiences = generator.generate(input_data)

        # Test basic structure
        assert len(experiences) == 2
        assert all(isinstance(exp, Experience) for exp in experiences)

        # Test experience constraints
        for exp in experiences:
            assert exp.company.name
            assert exp.position
            assert exp.start_date
            assert len(exp.description) <= 1200
            assert exp.technologies


def test_experience_generator_with_notes(test_model: TestModel) -> None:
    """Test that notes are properly included in generation."""
    generator = ExperienceGenerator(ai_model="test")
    input_data = ExperienceGeneratorInput(
        cv_text="# CV\n\nDetailed professional experience...",
        job_description="# Job Description\n\nSeeking a senior developer...",
        core_competences=(
            "Python Development, Cloud Architecture, Team Leadership, Data Engineering"
        ),
        notes="Focus on cloud architecture experience",
    )

    with generator.agent.override(model=test_model):
        experiences = generator.generate(input_data)
        assert len(experiences) == 2
        assert "cloud" in experiences[0].description.lower()


def test_empty_experience_list(test_model: TestModel) -> None:
    """Test handling of empty experience list from LLM."""
    generator = ExperienceGenerator(ai_model="test")
    input_data = ExperienceGeneratorInput(
        cv_text="CV text",
        job_description="Job description",
        core_competences="Core competences",
    )

    # Override test model to return empty list
    test_model.custom_result_args = []

    with generator.agent.override(model=test_model):
        with pytest.raises(
            ValueError, match="At least one experience must be generated"
        ):
            generator.generate(input_data)
