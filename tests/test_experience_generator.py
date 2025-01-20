from datetime import date

import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import Experience
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
    generator = ExperienceGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        experiences = generator.generate(
            cv_text="# CV\n\nDetailed professional experience...",
            job_description=("# Job Description\n\nSeeking a senior developer..."),
            core_competences="Python Development, Cloud Architecture, Team Leadership, Data Engineering",
        )

        assert len(experiences) == 2
        assert all(isinstance(exp, Experience) for exp in experiences)

        # Test first experience
        exp1 = experiences[0]
        assert exp1.company.name == "Tech Corp"
        assert exp1.position == "Senior Software Engineer"
        assert exp1.start_date == date(2020, 1, 1)
        assert exp1.end_date == date(2023, 12, 31)
        assert len(exp1.description) <= 1200
        assert "Python" in exp1.technologies

        # Test second experience
        exp2 = experiences[1]
        assert exp2.company.name == "Data Solutions Inc"
        assert exp2.position == "Data Engineer"
        assert exp2.start_date == date(2018, 6, 1)
        assert exp2.end_date == date(2019, 12, 31)
        assert len(exp2.description) <= 1200
        assert "Python" in exp2.technologies


def test_experience_generator_with_notes(test_model: TestModel) -> None:
    generator = ExperienceGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        experiences = generator.generate(
            cv_text="# CV\n\nDetailed professional experience...",
            job_description=("# Job Description\n\nSeeking a senior developer..."),
            core_competences="Python Development, Cloud Architecture, Team Leadership, Data Engineering",
            notes="Focus on cloud architecture experience",
        )

        assert len(experiences) == 2
        assert "cloud" in experiences[0].description.lower()


def test_experience_validation(test_model: TestModel) -> None:
    generator = ExperienceGenerator(ai_model="test")

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
