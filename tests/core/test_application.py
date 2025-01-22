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
    Education,
    Experience,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)

# Removed unused imports
from cv_adapter.models.language import Language
from cv_adapter.models.personal_info import PersonalInfo
from cv_adapter.models.summary import CVSummary
from cv_adapter.services.generators.competence_generator import CompetenceGenerator
from cv_adapter.services.generators.education_generator import EducationGenerator
from cv_adapter.services.generators.experience_generator import ExperienceGenerator
from cv_adapter.services.generators.skills_generator import SkillsGenerator
from cv_adapter.services.generators.summary_generator import SummaryGenerator
from cv_adapter.services.generators.title_generator import TitleGenerator


@pytest.fixture
def mock_services() -> Dict[str, Mock]:
    return {
        "competence_generator": Mock(),
        "experience_generator": Mock(),
        "education_generator": Mock(),
        "skills_generator": Mock(),
        "summary_generator": Mock(),
        "title_generator": Mock(),
    }


@pytest.fixture
def app(mock_services: Dict[str, Mock]) -> CVAdapterApplication:
    with patch("pydantic_ai.models.openai.AsyncOpenAI"):
        app = CVAdapterApplication(ai_model="openai:gpt-4")
        app.competence_generator = mock_services["competence_generator"]
        app.experience_generator = mock_services["experience_generator"]
        app.education_generator = mock_services["education_generator"]
        app.skills_generator = mock_services["skills_generator"]
        app.summary_generator = mock_services["summary_generator"]
        app.title_generator = mock_services["title_generator"]
        return app


def test_init_with_custom_ai_model() -> None:
    """Test that the application can be initialized with a custom AI model."""
    with patch("pydantic_ai.models.openai.AsyncOpenAI"):
        app = CVAdapterApplication(ai_model="openai:gpt-3.5-turbo")
        assert isinstance(app.competence_generator, CompetenceGenerator)
        assert isinstance(app.experience_generator, ExperienceGenerator)
        assert isinstance(app.education_generator, EducationGenerator)
        assert isinstance(app.skills_generator, SkillsGenerator)
        assert isinstance(app.summary_generator, SummaryGenerator)
        assert isinstance(app.title_generator, TitleGenerator)


@pytest.fixture
def detailed_cv() -> CV:
    return CV(
        personal_info=PersonalInfo(
            full_name="John Doe",
            contacts={"email": "john@example.com", "phone": "+1234567890"},
        ),
        title=Title(text="Senior Developer", language=Language.ENGLISH),
        summary=CVSummary(text="Original summary", language=Language.ENGLISH),
        core_competences=CoreCompetences(
            items=[
                CoreCompetence(text="Python", language=Language.ENGLISH),
                CoreCompetence(text="JavaScript", language=Language.ENGLISH),
                CoreCompetence(text="TypeScript", language=Language.ENGLISH),
                CoreCompetence(text="React", language=Language.ENGLISH),
            ],
            language=Language.ENGLISH,
        ),
        experiences=[
            Experience(
                company=Company(
                    name="Tech Corp",
                    description="Tech company",
                    location="San Francisco",
                    language=Language.ENGLISH,
                ),
                position="Developer",
                start_date=date(2020, 1, 1),
                end_date=date(2023, 1, 1),
                description="Coding",
                technologies=["Python", "Git"],
                language=Language.ENGLISH,
            )
        ],
        education=[
            Education(
                university=University(
                    name="University",
                    description="Top university",
                    location="New York",
                    language=Language.ENGLISH,
                ),
                degree="BSc Computer Science",
                start_date=date(2016, 9, 1),
                end_date=date(2020, 6, 1),
                description="Computer Science studies",
                language=Language.ENGLISH,
            )
        ],
        skills=Skills(
            groups=[
                SkillGroup(
                    name="Programming",
                    skills=[Skill(text="Python", language=Language.ENGLISH)],
                    language=Language.ENGLISH,
                )
            ],
            language=Language.ENGLISH,
        ),
        language=Language.ENGLISH,
    )


def test_generate_cv(
    app: CVAdapterApplication, mock_services: Dict[str, Mock], detailed_cv: CV
) -> None:
    # Setup mock returns
    job_description = "Looking for a Python developer"
    notes = "Focus on Python experience"
    cv_text = detailed_cv.model_dump_json()

    core_competences = [
        CoreCompetence(text="Python", language=Language.ENGLISH),
        CoreCompetence(text="JavaScript", language=Language.ENGLISH),
        CoreCompetence(text="TypeScript", language=Language.ENGLISH),
        CoreCompetence(text="React", language=Language.ENGLISH),
    ]
    experiences = [
        Experience(
            company=Company(
                name="Tech Corp",
                description="Tech company",
                location="San Francisco",
                language=Language.ENGLISH,
            ),
            position="Senior Dev",
            start_date=date(2020, 1, 1),
            end_date=date(2023, 1, 1),
            description="Python development",
            technologies=["Python", "Git"],
            language=Language.ENGLISH,
        )
    ]
    education = [
        Education(
            university=University(
                name="University",
                description="Top university",
                location="New York",
                language=Language.ENGLISH,
            ),
            degree="MSc Computer Science",
            start_date=date(2016, 9, 1),
            end_date=date(2020, 6, 1),
            description="Advanced CS studies",
            language=Language.ENGLISH,
        )
    ]
    skills = Skills(
        groups=[
            SkillGroup(
                name="Programming",
                skills=[Skill(text="Python", language=Language.ENGLISH)],
                language=Language.ENGLISH,
            )
        ],
        language=Language.ENGLISH,
    )
    summary = "Generated summary"

    mock_services["competence_generator"].generate.return_value = CoreCompetences(
        items=core_competences,
        language=Language.ENGLISH,
    )
    mock_services["experience_generator"].generate.return_value = [
        Experience(
            company=Company(
                name="Tech Corp",
                description="Tech company",
                location="San Francisco",
                language=Language.ENGLISH,
            ),
            position="Senior Dev",
            start_date=date(2020, 1, 1),
            end_date=date(2023, 1, 1),
            description="Python development",
            technologies=["Python", "Git"],
            language=Language.ENGLISH,
        )
    ]
    mock_services["education_generator"].generate.return_value = [
        Education(
            university=University(
                name="University",
                description="Top university",
                location="New York",
                language=Language.ENGLISH,
            ),
            degree="MSc Computer Science",
            start_date=date(2016, 9, 1),
            end_date=date(2020, 6, 1),
            description="Advanced CS studies",
            language=Language.ENGLISH,
        )
    ]
    mock_services["skills_generator"].generate.return_value = Skills(
        groups=[
            SkillGroup(
                name="Programming",
                skills=[Skill(text="Python", language=Language.ENGLISH)],
                language=Language.ENGLISH,
            )
        ],
        language=Language.ENGLISH,
    )
    mock_services["summary_generator"].generate.return_value = CVSummary(
        text=summary,
        language=Language.ENGLISH,
    )
    mock_services["title_generator"].generate.return_value = Title(
        text="Senior Python Developer",
        language=Language.ENGLISH,
    )

    # Execute
    result = app.generate_cv(
        cv_text,
        job_description,
        personal_info=detailed_cv.personal_info,
        notes=notes,
        language=Language.ENGLISH,
    )

    # Verify
    assert isinstance(result.summary, CVSummary)
    assert result.summary.text == summary
    assert isinstance(result.core_competences, CoreCompetences)
    assert result.core_competences.items == core_competences
    assert result.experiences == experiences
    assert result.education == education
    assert result.skills == skills
    assert result.personal_info.contacts == detailed_cv.personal_info.contacts
    assert result.personal_info.full_name == detailed_cv.personal_info.full_name
    assert result.title.text == "Senior Python Developer"
    assert result.language == Language.ENGLISH

    # Verify service calls
    core_competences_md = "* Python\n* JavaScript\n* TypeScript\n* React"
    mock_services["competence_generator"].generate.assert_called_once_with(
        cv=cv_text,
        job_description=job_description,
        notes=notes,
        language=Language.ENGLISH,
    )
    mock_services["experience_generator"].generate.assert_called_once_with(
        cv=cv_text,
        job_description=job_description,
        core_competences=core_competences_md,
        notes=notes,
        language=Language.ENGLISH,
    )
    mock_services["education_generator"].generate.assert_called_once_with(
        cv=cv_text,
        job_description=job_description,
        core_competences=core_competences_md,
        notes=notes,
        language=Language.ENGLISH,
    )
    mock_services["skills_generator"].generate.assert_called_once_with(
        cv=cv_text,
        job_description=job_description,
        core_competences=core_competences_md,
        notes=notes,
        language=Language.ENGLISH,
    )
    mock_services["title_generator"].generate.assert_called_once_with(
        cv=cv_text,
        job_description=job_description,
        core_competences=core_competences_md,
        notes=notes,
        language=Language.ENGLISH,
    )
