import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import CVDescription
from cv_adapter.services.description_generator import DescriptionGenerator


@pytest.fixture
def sample_cv_markdown() -> str:
    return """
# John Doe
## Senior Software Engineer

Experienced software engineer focused on Python and cloud tech.

### Experience

#### Tech Corp (2020-01 to 2023-12)
Senior Software Engineer
- Led development of cloud-native applications
- Reduced deployment time by 70%
- Implemented CI/CD pipeline
Technologies: Python, Docker, AWS, FastAPI

#### StartUp Inc (2018-01 to 2019-12)
Software Developer
- Full-stack development of web applications
- Developed new customer portal
- Improved application performance by 50%
Technologies: Python, React, PostgreSQL, Django

### Education
- MSc in Computer Science, University of Technology, 2018

### Contact
- Email: john.doe@example.com
"""


@pytest.fixture
def job_description() -> str:
    return """
# Senior Backend Developer

We are looking for a Senior Backend Developer to join our team. Requirements:

- Strong experience with Python and modern web frameworks (FastAPI, Django)
- Experience with cloud technologies (AWS, Docker, Kubernetes)
- Knowledge of database design and optimization
- Track record of leading technical projects
- Experience with CI/CD and DevOps practices

## Responsibilities:
- Design and implement scalable backend services
- Lead technical architecture decisions
- Mentor junior developers
- Ensure code quality through testing and reviews
"""


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model."""
    model = TestModel()
    model.custom_result_args = {
        "text": (
            "Senior Software Engineer with 5+ years of experience in Python development "
            "and cloud technologies. Proven track record in leading cloud-native "
            "applications and implementing CI/CD pipelines, reducing deployment time by 70%."
        )
    }
    return model


def test_generate_description_matches_job_requirements(
    sample_cv_markdown: str,
    job_description: str,
    test_model: TestModel,
) -> None:
    generator = DescriptionGenerator(ai_model="test")
    with generator.agent.override(model=test_model):
        description = generator.generate(
            cv_text=sample_cv_markdown, job_description=job_description
        )

        # Verify we got a valid description
        assert isinstance(description, CVDescription)
        assert description.text

        # Verify description is a single paragraph
        assert "\n" not in description.text

        # Verify description is not too long
        assert len(description.text.split()) <= 50

        # Verify description contains key elements
        assert "Software Engineer" in description.text
        assert "Python" in description.text
        assert "cloud" in description.text
        assert "CI/CD" in description.text


def test_generate_description_with_user_notes(
    sample_cv_markdown: str,
    job_description: str,
    test_model: TestModel,
) -> None:
    generator = DescriptionGenerator(ai_model="test")
    user_notes = """
    - Emphasize cloud architecture experience
    - Focus on team leadership skills
    """

    with generator.agent.override(model=test_model):
        description = generator.generate(
            cv_text=sample_cv_markdown,
            job_description=job_description,
            user_notes=user_notes,
        )

        # Verify we got a valid description
        assert isinstance(description, CVDescription)
        assert description.text

        # Verify description is a single paragraph
        assert "\n" not in description.text

        # Verify description is not too long
        assert len(description.text.split()) <= 50


def test_generate_description_validates_input(
    sample_cv_markdown: str,
    test_model: TestModel,
) -> None:
    generator = DescriptionGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        with pytest.raises(ValueError, match="CV text is required"):
            generator.generate(cv_text="", job_description="test")

        with pytest.raises(ValueError, match="Job description is required"):
            generator.generate(cv_text=sample_cv_markdown, job_description="")
