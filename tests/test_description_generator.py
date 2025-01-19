from datetime import date

import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import (
    Company,
    CoreCompetence,
    CoreCompetences,
    CVDescription,
    Education,
    Experience,
    MinimalCV,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)
from cv_adapter.renderers.minimal_markdown_renderer import MinimalMarkdownRenderer
from cv_adapter.services.description_generator import DescriptionGenerator


@pytest.fixture
def sample_minimal_cv() -> MinimalCV:
    return MinimalCV(
        title=Title(text="Senior Software Engineer"),
        core_competences=CoreCompetences(
            items=[
                CoreCompetence(text="Python Development"),
                CoreCompetence(text="Cloud Architecture"),
                CoreCompetence(text="Team Leadership"),
                CoreCompetence(text="DevOps Practices"),
            ]
        ),
        experiences=[
            Experience(
                company=Company(
                    name="Tech Corp",
                    location="San Francisco, CA",
                    description=None,
                ),
                position="Senior Software Engineer",
                start_date=date(2020, 1, 1),
                end_date=date(2023, 12, 31),
                description=(
                    "Led development of cloud-native applications. "
                    "Reduced deployment time by 70%. "
                    "Implemented CI/CD pipeline."
                ),
                technologies=["Python", "Docker", "AWS", "FastAPI"],
            ),
            Experience(
                company=Company(
                    name="StartUp Inc",
                    location="New York, NY",
                    description=None,
                ),
                position="Software Developer",
                start_date=date(2018, 1, 1),
                end_date=date(2019, 12, 31),
                description=(
                    "Full-stack development of web applications. "
                    "Developed new customer portal. "
                    "Improved application performance by 50%."
                ),
                technologies=["Python", "React", "PostgreSQL", "Django"],
            ),
        ],
        education=[
            Education(
                university=University(
                    name="University of Technology",
                    location="Boston, MA",
                    description=None,
                ),
                degree="MSc in Computer Science",
                start_date=date(2016, 9, 1),
                end_date=date(2018, 6, 1),
                description="Focus on distributed systems and cloud computing",
            )
        ],
        skills=Skills(
            groups=[
                SkillGroup(
                    name="Programming",
                    skills=[
                        Skill(text="Python"),
                        Skill(text="JavaScript"),
                        Skill(text="SQL"),
                    ],
                ),
                SkillGroup(
                    name="Cloud & DevOps",
                    skills=[
                        Skill(text="AWS"),
                        Skill(text="Docker"),
                        Skill(text="Kubernetes"),
                        Skill(text="CI/CD"),
                    ],
                ),
                SkillGroup(
                    name="Frameworks",
                    skills=[
                        Skill(text="FastAPI"),
                        Skill(text="Django"),
                        Skill(text="React"),
                    ],
                ),
            ]
        ),
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
    """Create a test model."""
    model = TestModel()
    model.custom_result_args = {
        "text": (
            "Senior Software Engineer with 5+ years of experience in Python "
            "development and cloud technologies. Proven track record in leading "
            "cloud-native applications and implementing CI/CD pipelines, reducing "
            "deployment time by 70%."
        )
    }
    return model


def test_generate_description_matches_job_requirements(
    sample_minimal_cv: MinimalCV,
    job_description: str,
    test_model: TestModel,
) -> None:
    renderer = MinimalMarkdownRenderer()
    generator = DescriptionGenerator(renderer=renderer, ai_model="test")

    with generator.agent.override(model=test_model):
        description = generator.generate(
            minimal_cv=sample_minimal_cv, job_description=job_description
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
    sample_minimal_cv: MinimalCV,
    job_description: str,
    test_model: TestModel,
) -> None:
    renderer = MinimalMarkdownRenderer()
    generator = DescriptionGenerator(renderer=renderer, ai_model="test")
    user_notes = """
    - Emphasize cloud architecture experience
    - Focus on team leadership skills
    """

    with generator.agent.override(model=test_model):
        description = generator.generate(
            minimal_cv=sample_minimal_cv,
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
    sample_minimal_cv: MinimalCV,
    test_model: TestModel,
) -> None:
    renderer = MinimalMarkdownRenderer()
    generator = DescriptionGenerator(renderer=renderer, ai_model="test")

    with generator.agent.override(model=test_model):
        with pytest.raises(ValueError, match="Job description is required"):
            generator.generate(minimal_cv=sample_minimal_cv, job_description="")
