from datetime import date
from unittest.mock import AsyncMock, Mock, patch

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
from cv_adapter.models.context import language_context


@pytest.fixture
def detailed_cv_text() -> str:
    """Fixture to provide a sample CV text."""
    return "Existing CV text for John Doe"


@pytest.fixture
def personal_info() -> PersonalInfoDTO:
    """Fixture to provide sample personal info."""
    return PersonalInfoDTO(
        full_name="John Doe",
        email=ContactDTO(
            value="john@example.com",
            type="email",
            icon="email",
            url="mailto:john@example.com",
        ),
        phone=ContactDTO(
            value="+1234567890",
            type="phone",
            icon="phone",
            url="tel:+1234567890",
        ),
    )


@pytest.fixture
def async_app() -> Mock:
    """Mock for the internal AsyncCVAdapterApplication."""
    mock = AsyncMock()
    mock_cv = CVDTO(
        personal_info=PersonalInfoDTO(full_name="John Doe"),
        title=TitleDTO(text="Senior Developer"),
        summary=SummaryDTO(text="Experienced developer"),
        core_competences=[CoreCompetenceDTO(text="Python")],
        experiences=[
            ExperienceDTO(
                company=InstitutionDTO(name="Company"),
                position="Developer",
                start_date=date(2020, 1, 1),
                end_date=date(2023, 1, 1),
                description="Role description",
            )
        ],
        education=[
            EducationDTO(
                university=InstitutionDTO(name="University"),
                degree="Computer Science",
                start_date=date(2016, 9, 1),
                end_date=date(2020, 6, 1),
                description="Studies description",
            )
        ],
        skills=[
            SkillGroupDTO(
                name="Programming",
                skills=[SkillDTO(text="Python")],
            )
        ],
        language=ENGLISH,
    )
    mock_competences = [CoreCompetenceDTO(text="Python")]
    # Create return values for each async method
    mock.generate_core_competences.return_value = mock_competences
    mock.generate_cv.return_value = mock_cv
    mock.generate_cv_with_competences.return_value = mock_cv
    # Set async method side effects to make the returns awaitable
    mock.generate_core_competences.side_effect = AsyncMock(
        return_value=mock_competences
    )
    mock.generate_cv.side_effect = AsyncMock(return_value=mock_cv)
    mock.generate_cv_with_competences.side_effect = AsyncMock(return_value=mock_cv)
    return mock


@pytest.fixture
def app(async_app: Mock) -> CVAdapterApplication:
    """Fixture to create a CVAdapterApplication with mocked async app."""
    with patch("pydantic_ai.models.openai.AsyncOpenAI"):
        app = CVAdapterApplication(ai_model="openai:gpt-4o")
        app._async_app = async_app
        return app


def test_init_custom_ai_model() -> None:
    """Test application initialization with different AI models."""
    with patch("cv_adapter.core.application.AsyncCVAdapterApplication") as mock_class:
        mock_instance = AsyncMock()
        mock_class.return_value = mock_instance
        with patch("pydantic_ai.models.openai.AsyncOpenAI"):
            test_models: list[KnownModelName] = [
                "openai:gpt-3.5-turbo",
                "openai:gpt-4o",
            ]  # type: ignore[list-item]
            for model in test_models:
                CVAdapterApplication(ai_model=model)
                mock_class.assert_called_with(ai_model=model)


def test_generate_cv_without_language_context(
    app: CVAdapterApplication, personal_info: PersonalInfoDTO
) -> None:
    """Test that generating CV without language context raises RuntimeError."""
    with pytest.raises(RuntimeError, match="Language context not set"):
        app.generate_cv("cv text", "job description", personal_info)


def test_generate_core_competences_without_language_context(
    app: CVAdapterApplication,
) -> None:
    """Test that generating competences without language context raises RuntimeError."""
    with pytest.raises(RuntimeError, match="Language context not set"):
        app.generate_core_competences("cv text", "job description")


def test_generate_cv_with_competences_without_language_context(
    app: CVAdapterApplication, personal_info: PersonalInfoDTO
) -> None:
    """Test RuntimeError is raised when language context is not set."""
    with pytest.raises(RuntimeError, match="Language context not set"):
        app.generate_cv_with_competences(
            "cv text",
            "job description",
            personal_info,
            [CoreCompetenceDTO(text="Python")],
        )


def test_generate_core_competences(
    app: CVAdapterApplication, async_app: Mock, detailed_cv_text: str
) -> None:
    """Test generating core competences."""
    with language_context(ENGLISH):
        result = app.generate_core_competences(
            cv_text=detailed_cv_text, job_description="job description", notes="notes"
        )

    async_app.generate_core_competences.assert_called_once_with(
        cv_text=detailed_cv_text, job_description="job description", notes="notes"
    )
    assert result == async_app.generate_core_competences.return_value


def test_generate_cv_with_competences(
    app: CVAdapterApplication,
    async_app: Mock,
    detailed_cv_text: str,
    personal_info: PersonalInfoDTO,
) -> None:
    """Test generating CV with pre-generated competences."""
    competences = [CoreCompetenceDTO(text="Python")]

    with language_context(ENGLISH):
        result = app.generate_cv_with_competences(
            cv_text=detailed_cv_text,
            job_description="job description",
            personal_info=personal_info,
            core_competences=competences,
            notes="notes",
        )

    async_app.generate_cv_with_competences.assert_called_once_with(
        cv_text=detailed_cv_text,
        job_description="job description",
        personal_info=personal_info,
        core_competences=competences,
        notes="notes",
    )
    assert result == async_app.generate_cv_with_competences.return_value


def test_generate_cv(
    app: CVAdapterApplication,
    async_app: Mock,
    detailed_cv_text: str,
    personal_info: PersonalInfoDTO,
) -> None:
    """Test generating complete CV in one step."""
    with language_context(ENGLISH):
        result = app.generate_cv(
            cv_text=detailed_cv_text,
            job_description="job description",
            personal_info=personal_info,
            notes="notes",
        )

    async_app.generate_cv.assert_called_once_with(
        cv_text=detailed_cv_text,
        job_description="job description",
        personal_info=personal_info,
        notes="notes",
    )
    assert result == async_app.generate_cv.return_value
