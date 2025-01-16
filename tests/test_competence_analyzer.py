import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import CoreCompetence
from cv_adapter.services.competence_analyzer import CompetenceAnalyzer


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
        "items": [
            {"text": "Backend Development"},
            {"text": "Cloud Architecture"},
            {"text": "Team Leadership"},
            {"text": "Python Development"},
        ]
    }
    return model


def test_analyze_competences_matches_job_requirements(
    sample_cv_markdown: str,
    job_description: str,
    test_model: TestModel,
) -> None:
    analyzer = CompetenceAnalyzer(ai_model="test")
    with analyzer.agent.override(model=test_model):
        competences = analyzer.analyze(
            cv_text=sample_cv_markdown, job_description=job_description
        )

        # Verify we got the expected number of competences (4-6)
        assert 4 <= len(competences) <= 6

        # Verify each competence has required fields
        for comp in competences.items:
            assert isinstance(comp, CoreCompetence)
            assert comp.text
            # Verify each competence is 1-5 words
            assert 1 <= len(comp.text.split()) <= 5

        # Verify we got the expected competences
        assert any(comp.text == "Backend Development" for comp in competences.items)
        assert any(comp.text == "Cloud Architecture" for comp in competences.items)
        assert any(comp.text == "Team Leadership" for comp in competences.items)
        assert any(comp.text == "Python Development" for comp in competences.items)


def test_analyze_competences_with_user_notes(
    sample_cv_markdown: str,
    job_description: str,
    test_model: TestModel,
) -> None:
    analyzer = CompetenceAnalyzer(ai_model="test")
    user_notes = """
    - Emphasize cloud architecture experience
    - Focus on team leadership skills
    """

    with analyzer.agent.override(model=test_model):
        competences = analyzer.analyze(
            cv_text=sample_cv_markdown,
            job_description=job_description,
            user_notes=user_notes,
        )

        # Verify we got the expected number of competences (4-6)
        assert 4 <= len(competences) <= 6

        # Verify each competence has required fields
        for comp in competences.items:
            assert isinstance(comp, CoreCompetence)
            assert comp.text
            # Verify each competence is 1-5 words
            assert 1 <= len(comp.text.split()) <= 5


def test_analyze_competences_validates_input(
    sample_cv_markdown: str,
    test_model: TestModel,
) -> None:
    analyzer = CompetenceAnalyzer(ai_model="test")

    with analyzer.agent.override(model=test_model):
        with pytest.raises(ValueError, match="CV text is required"):
            analyzer.analyze(cv_text="", job_description="test")

        with pytest.raises(ValueError, match="Job description is required"):
            analyzer.analyze(cv_text=sample_cv_markdown, job_description="")
