from datetime import date
from typing import Dict, Optional
from unittest.mock import Mock, patch

import pytest
from pydantic_ai.models import KnownModelName

from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.dto.cv import (
    CVDTO,
    ContactDTO,
    CoreCompetenceDTO,
    EducationDTO,
    ExperienceDTO,
    InstitutionDTO,
    PersonalInfoDTO,
    SkillDTO,
    SkillGroupDTO,
    SummaryDTO,
    TitleDTO,
)
from cv_adapter.dto.language import ENGLISH
from cv_adapter.renderers.markdown import CoreCompetencesRenderer
from cv_adapter.services.generators.protocols import Generator


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
            assert isinstance(app.competence_generator, Generator)
            assert isinstance(app.experience_generator, Generator)
            assert isinstance(app.education_generator, Generator)
            assert isinstance(app.skills_generator, Generator)
            assert isinstance(app.summary_generator, Generator)
            assert isinstance(app.title_generator, Generator)

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
    core_competences_dto = [
        CoreCompetenceDTO(text="Python"),
        CoreCompetenceDTO(text="JavaScript"),
        CoreCompetenceDTO(text="TypeScript"),
        CoreCompetenceDTO(text="React"),
    ]
    experiences_dto: list[ExperienceDTO] = [
        ExperienceDTO(
            company=InstitutionDTO(
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
    education_dto: list[EducationDTO] = [
        EducationDTO(
            university=InstitutionDTO(
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
    skills_dto = [
        SkillGroupDTO(
            name="Programming",
            skills=[SkillDTO(text="Python")],
        )
    ]
    summary_dto = SummaryDTO(text="Generated summary")
    title_dto = TitleDTO(text="Senior Python Developer")
    personal_info_dto = PersonalInfoDTO(
        full_name="John Doe",
        email=ContactDTO(
            value="john@example.com",
            type="email",
            icon="email",
            url="mailto:john@example.com",
        ),
        phone=ContactDTO(
            value="+1234567890", type="phone", icon="phone", url="tel:+1234567890"
        ),
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
    assert [cc.model_dump() for cc in result.core_competences] == [
        cc.model_dump() for cc in core_competences_dto
    ]
    # Compare experiences by converting to dictionaries and comparing key fields
    assert len(result.experiences) == len(experiences_dto)
    for result_exp, expected_exp in zip(result.experiences, experiences_dto):
        assert result_exp.company.name == expected_exp.company.name
        assert result_exp.company.description == expected_exp.company.description
        assert result_exp.company.location == expected_exp.company.location
        assert result_exp.position == expected_exp.position
        assert result_exp.start_date == expected_exp.start_date
        assert result_exp.end_date == expected_exp.end_date
        assert result_exp.description == expected_exp.description
        assert result_exp.technologies == expected_exp.technologies
    # Compare education by converting to dictionaries and comparing key fields
    assert len(result.education) == len(education_dto)
    for result_edu, expected_edu in zip(result.education, education_dto):
        assert result_edu.university.name == expected_edu.university.name
        assert result_edu.university.description == expected_edu.university.description
        assert result_edu.university.location == expected_edu.university.location
        assert result_edu.degree == expected_edu.degree
        assert result_edu.start_date == expected_edu.start_date
        assert result_edu.end_date == expected_edu.end_date
        assert result_edu.description == expected_edu.description

    # Compare skills by converting to dictionaries and comparing key fields
    assert len(result.skills) == len(skills_dto)
    for result_group, expected_group in zip(result.skills, skills_dto):
        assert result_group.name == expected_group.name
        assert len(result_group.skills) == len(expected_group.skills)
        for result_skill, expected_skill in zip(
            result_group.skills, expected_group.skills
        ):
            assert result_skill.text == expected_skill.text
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
