from datetime import date

import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import CV, CoreCompetence, Experience
from cv_adapter.services.competence_analyzer import CompetenceAnalyzer


@pytest.fixture
def sample_cv() -> CV:
    return CV(
        full_name="John Doe",
        title="Senior Software Engineer",
        summary="Experienced software engineer focused on Python and cloud tech",
        core_competences=[],  # Empty as we'll generate these
        experiences=[
            Experience(
                company="Tech Corp",
                position="Senior Software Engineer",
                start_date=date(2020, 1, 1),
                end_date=date(2023, 12, 31),
                description="Led development of cloud-native applications",
                achievements=[
                    "Reduced deployment time by 70%",
                    "Implemented CI/CD pipeline",
                ],
                technologies=["Python", "Docker", "AWS", "FastAPI"],
            ),
            Experience(
                company="StartUp Inc",
                position="Software Developer",
                start_date=date(2018, 1, 1),
                end_date=date(2019, 12, 31),
                description="Full-stack development of web applications",
                achievements=[
                    "Developed new customer portal",
                    "Improved application performance by 50%",
                ],
                technologies=["Python", "React", "PostgreSQL", "Django"],
            ),
        ],
        education=["MSc in Computer Science, University of Technology, 2018"],
        contacts={"email": "john.doe@example.com"},
    )


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
    """Create a test model that returns predefined responses."""
    model = TestModel()

    # Define expected response for core competence generation
    model.custom_result_args = {
        "response": [
            CoreCompetence(
                name="Backend Development",
                description="Expert in designing and implementing backend services",
                keywords=["Python", "FastAPI", "Django", "REST APIs"],
            ),
            CoreCompetence(
                name="Cloud Architecture",
                description="Expert in cloud-native development and DevOps",
                keywords=["AWS", "Docker", "CI/CD", "Microservices"],
            ),
            CoreCompetence(
                name="Team Leadership",
                description="Proven track record in leading teams and architecture",
                keywords=["Team Leadership", "Architecture Design", "Mentoring"],
            ),
        ]
    }

    return model


def test_analyze_competences_matches_job_requirements(
    sample_cv: CV,
    job_description: str,
    test_model: TestModel,
) -> None:
    analyzer = CompetenceAnalyzer(ai_model=test_model)
    competences = analyzer.analyze(cv=sample_cv, job_description=job_description)

    # Verify we got the expected number of competences
    assert len(competences) == 3

    # Verify each competence has required fields
    for comp in competences:
        assert isinstance(comp, CoreCompetence)
        assert comp.name
        assert comp.description
        assert len(comp.keywords) >= 2

    # Verify we got the expected competences
    assert any(comp.name == "Backend Development" for comp in competences)
    assert any(comp.name == "Cloud Architecture" for comp in competences)
    assert any(comp.name == "Team Leadership" for comp in competences)


def test_analyze_competences_with_user_notes(
    sample_cv: CV,
    job_description: str,
    test_model: TestModel,
) -> None:
    analyzer = CompetenceAnalyzer(ai_model=test_model)
    user_notes = """
    - Emphasize cloud architecture experience
    - Focus on team leadership skills
    """

    competences = analyzer.analyze(
        cv=sample_cv,
        job_description=job_description,
        user_notes=user_notes,
    )

    # Verify competences reflect user notes
    assert any(comp.name == "Cloud Architecture" for comp in competences)
    assert any(comp.name == "Team Leadership" for comp in competences)


def test_analyze_competences_validates_input(
    sample_cv: CV,
    test_model: TestModel,
) -> None:
    analyzer = CompetenceAnalyzer(ai_model=test_model)

    with pytest.raises(ValueError, match="CV is required"):
        analyzer.analyze(cv=None, job_description="test")  # type: ignore

    with pytest.raises(ValueError, match="Job description is required"):
        analyzer.analyze(cv=sample_cv, job_description="")
