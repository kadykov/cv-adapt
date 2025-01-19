from datetime import date
from typing import Dict
from unittest.mock import Mock, patch

import pytest

from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.models.cv import (
    CV,
    Company,
    CoreCompetence,
    CoreCompetences,
    CVDescription,
    Education,
    Experience,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)
from cv_adapter.models.personal_info import PersonalInfo
from cv_adapter.services.competence_analyzer import CompetenceAnalyzer
from cv_adapter.services.description_generator import DescriptionGenerator
from cv_adapter.services.education_generator import EducationGenerator
from cv_adapter.services.experience_generator import ExperienceGenerator
from cv_adapter.services.skills_generator import SkillsGenerator
from cv_adapter.services.title_generator import TitleGenerator


@pytest.fixture
def mock_services() -> Dict[str, Mock]:
    return {
        "competence_analyzer": Mock(),
        "experience_generator": Mock(),
        "education_generator": Mock(),
        "skills_generator": Mock(),
        "description_generator": Mock(),
        "title_generator": Mock(),
    }


@pytest.fixture
def app(mock_services: Dict[str, Mock]) -> CVAdapterApplication:
    with patch("pydantic_ai.models.openai.AsyncOpenAI"):
        app = CVAdapterApplication(ai_model="openai:gpt-4")
        app.competence_analyzer = mock_services["competence_analyzer"]
        app.experience_generator = mock_services["experience_generator"]
        app.education_generator = mock_services["education_generator"]
        app.skills_generator = mock_services["skills_generator"]
        app.description_generator = mock_services["description_generator"]
        app.title_generator = mock_services["title_generator"]
        return app


def test_init_with_custom_ai_model() -> None:
    """Test that the application can be initialized with a custom AI model."""
    with patch("pydantic_ai.models.openai.AsyncOpenAI"):
        app = CVAdapterApplication(ai_model="openai:gpt-3.5-turbo")
        assert isinstance(app.competence_analyzer, CompetenceAnalyzer)
        assert isinstance(app.experience_generator, ExperienceGenerator)
        assert isinstance(app.education_generator, EducationGenerator)
        assert isinstance(app.skills_generator, SkillsGenerator)
        assert isinstance(app.description_generator, DescriptionGenerator)
        assert isinstance(app.title_generator, TitleGenerator)


@pytest.fixture
def detailed_cv() -> CV:
    return CV(
        personal_info=PersonalInfo(
            full_name="John Doe",
            contacts={"email": "john@example.com", "phone": "+1234567890"},
        ),
        title=Title(text="Senior Developer"),
        description=CVDescription(text="Original description"),
        core_competences=CoreCompetences(
            items=[
                CoreCompetence(text="Python"),
                CoreCompetence(text="JavaScript"),
                CoreCompetence(text="TypeScript"),
                CoreCompetence(text="React"),
            ]
        ),
        experiences=[
            Experience(
                company=Company(
                    name="Tech Corp",
                    description="Tech company",
                    location="San Francisco",
                ),
                position="Developer",
                start_date=date(2020, 1, 1),
                end_date=date(2023, 1, 1),
                description="Coding",
                technologies=["Python", "Git"],
            )
        ],
        education=[
            Education(
                university=University(
                    name="University",
                    description="Top university",
                    location="New York",
                ),
                degree="BSc Computer Science",
                start_date=date(2016, 9, 1),
                end_date=date(2020, 6, 1),
                description="Computer Science studies",
            )
        ],
        skills=Skills(
            groups=[
                SkillGroup(
                    name="Programming",
                    skills=[Skill(text="Python")],
                )
            ]
        ),
    )


def test_generate_cv(
    app: CVAdapterApplication, mock_services: Dict[str, Mock], detailed_cv: CV
) -> None:
    # Setup mock returns
    job_description = "Looking for a Python developer"
    notes = "Focus on Python experience"
    cv_text = detailed_cv.model_dump_json()

    core_competences = [
        CoreCompetence(text="Python"),
        CoreCompetence(text="JavaScript"),
        CoreCompetence(text="TypeScript"),
        CoreCompetence(text="React"),
    ]
    experiences = [
        Experience(
            company=Company(
                name="Tech Corp",
                description="Tech company",
                location="San Francisco",
            ),
            position="Senior Dev",
            start_date=date(2020, 1, 1),
            end_date=date(2023, 1, 1),
            description="Python development",
            technologies=["Python", "Git"],
        )
    ]
    education = [
        Education(
            university=University(
                name="University",
                description="Top university",
                location="New York",
            ),
            degree="MSc Computer Science",
            start_date=date(2016, 9, 1),
            end_date=date(2020, 6, 1),
            description="Advanced CS studies",
        )
    ]
    skills = Skills(
        groups=[
            SkillGroup(
                name="Programming",
                skills=[Skill(text="Python")],
            )
        ]
    )
    description = "Generated description"

    mock_services["competence_analyzer"].analyze.return_value = CoreCompetences(
        items=core_competences
    )
    mock_services["experience_generator"].generate.return_value = experiences
    mock_services["education_generator"].generate.return_value = education
    mock_services["skills_generator"].generate.return_value = skills
    mock_services["description_generator"].generate.return_value = CVDescription(
        text=description
    )
    mock_services["title_generator"].generate.return_value = Title(
        text="Senior Python Developer"
    )

    # Execute
    result = app.generate_cv(cv_text, job_description, notes)

    # Verify
    assert isinstance(result.description, CVDescription)
    assert result.description.text == description
    assert isinstance(result.core_competences, CoreCompetences)
    assert result.core_competences.items == core_competences
    assert result.experiences == experiences
    assert result.education == education
    assert result.skills == skills
    assert result.personal_info.contacts == detailed_cv.personal_info.contacts
    assert result.personal_info.full_name == detailed_cv.personal_info.full_name
    assert result.title.text == "Senior Python Developer"

    # Verify service calls
    mock_services["competence_analyzer"].analyze.assert_called_once_with(
        cv_text, job_description, user_notes=notes
    )
    mock_services["experience_generator"].generate.assert_called_once_with(
        cv_text,
        job_description,
        ["Python", "JavaScript", "TypeScript", "React"],
        notes=notes,
    )
    mock_services["education_generator"].generate.assert_called_once_with(
        cv_text,
        job_description,
        ["Python", "JavaScript", "TypeScript", "React"],
        notes=notes,
    )
    mock_services["skills_generator"].generate.assert_called_once_with(
        cv_text,
        job_description,
        ["Python", "JavaScript", "TypeScript", "React"],
        notes=notes,
    )
    mock_services["title_generator"].generate.assert_called_once_with(
        cv_text,
        job_description,
        ["Python", "JavaScript", "TypeScript", "React"],
        notes=notes,
    )
