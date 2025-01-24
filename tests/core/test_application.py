from datetime import date
from typing import Dict, Optional
from unittest.mock import Mock, patch

import pytest
from pydantic_ai.models import KnownModelName

from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.dto.cv import (
    CVDTO,
    CoreCompetencesDTO,
    EducationDTO,
    ExperienceDTO,
    PersonalInfoDTO,
    SkillsDTO,
    SummaryDTO,
    TitleDTO,
)
from cv_adapter.dto.language import ENGLISH
from cv_adapter.renderers.markdown import CoreCompetencesRenderer
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
    """Fixture to create a CVAdapterApplication with mocked services."""
    with patch("pydantic_ai.models.openai.AsyncOpenAI"):
        app = CVAdapterApplication(ai_model="openai:gpt-4o")
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
        # Test with different AI models
        test_models: list[KnownModelName] = [
            "openai:gpt-3.5-turbo",
            "openai:gpt-4o",
            "openai:gpt-4o-mini",
        ]

        for model in test_models:
            app = CVAdapterApplication(ai_model=model)

            # Verify that all generators are correctly initialized
            assert isinstance(app.competence_generator, CompetenceGenerator)
            assert isinstance(app.experience_generator, ExperienceGenerator)
            assert isinstance(app.education_generator, EducationGenerator)
            assert isinstance(app.skills_generator, SkillsGenerator)
            assert isinstance(app.summary_generator, SummaryGenerator)
            assert isinstance(app.title_generator, TitleGenerator)

            # Verify AI model initialization
            # Note: Can't directly check AI model attribute


@pytest.fixture
def detailed_cv_text() -> str:
    """Fixture to provide a sample CV text."""
    return "Existing CV text for John Doe"


def test_generate_cv(
    app: CVAdapterApplication, mock_services: Dict[str, Mock], detailed_cv_text: str
) -> None:
    # Setup mock returns
    job_description = "Looking for a Python developer"
    notes: Optional[str] = "Focus on Python experience"

    # Prepare mock DTOs
    core_competences_dto = CoreCompetencesDTO(
        items=[
            {"text": "Python", "language": ENGLISH},
            {"text": "JavaScript", "language": ENGLISH},
            {"text": "TypeScript", "language": ENGLISH},
            {"text": "React", "language": ENGLISH},
        ]
    )
    experiences_dto: list[ExperienceDTO] = [
        ExperienceDTO(
            company={
                "name": "Tech Corp",
                "description": "Tech company",
                "location": "San Francisco",
            },
            position="Senior Dev",
            start_date=date(2020, 1, 1),
            end_date=date(2023, 1, 1),
            description="Python development",
            technologies=["Python", "Git"],
        )
    ]
    education_dto: list[EducationDTO] = [
        EducationDTO(
            university={
                "name": "University",
                "description": "Top university",
                "location": "New York",
            },
            degree="MSc Computer Science",
            start_date=date(2016, 9, 1),
            end_date=date(2020, 6, 1),
            description="Advanced CS studies",
        )
    ]
    skills_dto = SkillsDTO(
        groups=[
            {
                "name": "Programming",
                "skills": [{"text": "Python"}],
            }
        ]
    )
    summary_dto = SummaryDTO(text="Generated summary")
    title_dto = TitleDTO(text="Senior Python Developer")
    personal_info_dto = PersonalInfoDTO(
        full_name="John Doe",
        contacts={
            "email": {"value": "john@example.com"},
            "phone": {"value": "+1234567890"},
        },
    )

    # Configure mock generators
    mock_services["competence_generator"].generate.return_value = core_competences_dto
    mock_services["experience_generator"].generate.return_value = experiences_dto
    mock_services["education_generator"].generate.return_value = education_dto
    mock_services["skills_generator"].generate.return_value = skills_dto
    mock_services["summary_generator"].generate.return_value = summary_dto
    mock_services["title_generator"].generate.return_value = title_dto

    # Execute
    result = app.generate_cv(
        cv_text=detailed_cv_text,
        job_description=job_description,
        personal_info=personal_info_dto,
        notes=notes,
        language=ENGLISH,
    )

    # Verify
    assert isinstance(result, CVDTO)
    assert result.summary == summary_dto
    assert result.core_competences.model_dump() == core_competences_dto.model_dump()
    assert [exp.model_dump() for exp in result.experiences] == experiences_dto
    assert [edu.model_dump() for edu in result.education] == education_dto
    assert result.skills.model_dump() == skills_dto.model_dump()
    assert result.personal_info.model_dump() == personal_info_dto.model_dump()
    assert result.title.model_dump() == title_dto.model_dump()
    assert result.language == ENGLISH

    # Verify service calls
    core_competences_md = CoreCompetencesRenderer.render_to_markdown(
        core_competences_dto
    )
    mock_services["competence_generator"].generate.assert_called_once_with(
        cv=detailed_cv_text,
        job_description=job_description,
        notes=notes,
    )
    mock_services["experience_generator"].generate.assert_called_once_with(
        cv=detailed_cv_text,
        job_description=job_description,
        core_competences=core_competences_md,
        notes=notes,
    )
    mock_services["education_generator"].generate.assert_called_once_with(
        cv=detailed_cv_text,
        job_description=job_description,
        core_competences=core_competences_md,
        notes=notes,
    )
    mock_services["skills_generator"].generate.assert_called_once_with(
        cv=detailed_cv_text,
        job_description=job_description,
        core_competences=core_competences_md,
        notes=notes,
    )
    mock_services["title_generator"].generate.assert_called_once_with(
        cv=detailed_cv_text,
        job_description=job_description,
        core_competences=core_competences_md,
        notes=notes,
    )
