from datetime import date
from typing import Any, cast
from unittest.mock import AsyncMock, patch

import pytest
from pydantic_ai.models import KnownModelName

from cv_adapter.core.async_application import AsyncCVAdapterApplication
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


@pytest.mark.asyncio
async def test_init_custom_ai_model() -> None:
    """Test application initialization with different AI models."""
    test_models: list[KnownModelName] = ["openai:gpt-3.5-turbo", "openai:gpt-4o"]  # type: ignore[list-item]
    for model in test_models:
        app = AsyncCVAdapterApplication(ai_model=model)
        assert app.ai_model == model
        assert app._initialized is False


@pytest.mark.asyncio
async def test_generate_cv_without_language_context(
    personal_info: PersonalInfoDTO,
) -> None:
    """Test that generating CV without language context raises RuntimeError."""
    with patch("pydantic_ai.models.openai.AsyncOpenAI"):
        app = AsyncCVAdapterApplication(ai_model="openai:gpt-4o")
        with pytest.raises(RuntimeError, match="Language context not set"):
            await app.generate_cv("cv text", "job description", personal_info)


@pytest.mark.asyncio
async def test_generate_core_competences_without_language_context() -> None:
    """Test that generating competences without language context raises RuntimeError."""
    with patch("pydantic_ai.models.openai.AsyncOpenAI"):
        app = AsyncCVAdapterApplication(ai_model="openai:gpt-4o")
        with pytest.raises(RuntimeError, match="Language context not set"):
            await app.generate_core_competences("cv text", "job description")


@pytest.mark.asyncio
async def test_generate_cv_with_competences_without_language_context(
    personal_info: PersonalInfoDTO,
) -> None:
    """Test RuntimeError is raised when language context is not set."""
    with patch("pydantic_ai.models.openai.AsyncOpenAI"):
        app = AsyncCVAdapterApplication(ai_model="openai:gpt-4o")
        with pytest.raises(RuntimeError, match="Language context not set"):
            await app.generate_cv_with_competences(
                "cv text",
                "job description",
                personal_info,
                [CoreCompetenceDTO(text="Python")],
            )


@pytest.mark.asyncio
async def test_generate_core_competences() -> None:
    """Test generating core competences."""
    mock_competences = [CoreCompetenceDTO(text="Python")]

    app = AsyncCVAdapterApplication(ai_model="openai:gpt-4o")
    await app._initialize_generators()

    # Mock the generator after initialization
    competence_mock = AsyncMock(return_value=mock_competences)
    app.competence_generator = cast(Any, competence_mock)

    with language_context(ENGLISH):
        competences = await app.generate_core_competences("cv text", "job description")
        assert competences == mock_competences


@pytest.mark.asyncio
async def test_generate_cv_with_competences(personal_info: PersonalInfoDTO) -> None:
    """Test generating CV with pre-generated competences."""
    mock_experiences = [
        ExperienceDTO(
            company=InstitutionDTO(name="Company"),
            position="Developer",
            start_date=date(2020, 1, 1),
            end_date=date(2023, 1, 1),
            description="Role description",
        )
    ]
    mock_education = [
        EducationDTO(
            university=InstitutionDTO(name="University"),
            degree="CS",
            start_date=date(2016, 9, 1),
            end_date=date(2020, 6, 1),
            description="Studies description",
        )
    ]
    mock_skills = [SkillGroupDTO(name="Programming", skills=[SkillDTO(text="Python")])]
    mock_title = TitleDTO(text="Senior Developer")
    mock_summary = SummaryDTO(text="Experienced developer")
    competences = [CoreCompetenceDTO(text="Python")]

    app = AsyncCVAdapterApplication(ai_model="openai:gpt-4o")
    await app._initialize_generators()

    # Mock all generators after initialization using cast to handle type compatibility
    app.experience_generator = cast(Any, AsyncMock(return_value=mock_experiences))
    app.education_generator = cast(Any, AsyncMock(return_value=mock_education))
    app.skills_generator = cast(Any, AsyncMock(return_value=mock_skills))
    app.title_generator = cast(Any, AsyncMock(return_value=mock_title))
    app.summary_generator = cast(Any, AsyncMock(return_value=mock_summary))

    with language_context(ENGLISH):
        result = await app.generate_cv_with_competences(
            "cv text",
            "job description",
            personal_info,
            competences,
        )

        assert isinstance(result, CVDTO)
        assert result.personal_info == personal_info
        assert result.core_competences == competences
        assert result.experiences == mock_experiences
        assert result.education == mock_education
        assert result.skills == mock_skills
        assert result.title == mock_title
        assert result.summary == mock_summary


@pytest.mark.asyncio
async def test_generate_cv(personal_info: PersonalInfoDTO) -> None:
    """Test generating complete CV in one step."""
    mock_competences = [CoreCompetenceDTO(text="Python")]
    mock_experiences = [
        ExperienceDTO(
            company=InstitutionDTO(name="Company"),
            position="Developer",
            start_date=date(2020, 1, 1),
            end_date=date(2023, 1, 1),
            description="Role description",
        )
    ]
    mock_education = [
        EducationDTO(
            university=InstitutionDTO(name="University"),
            degree="CS",
            start_date=date(2016, 9, 1),
            end_date=date(2020, 6, 1),
            description="Studies description",
        )
    ]
    mock_skills = [SkillGroupDTO(name="Programming", skills=[SkillDTO(text="Python")])]
    mock_title = TitleDTO(text="Senior Developer")
    mock_summary = SummaryDTO(text="Experienced developer")

    app = AsyncCVAdapterApplication(ai_model="openai:gpt-4o")
    await app._initialize_generators()

    # Mock all generators after initialization using cast to handle type compatibility
    app.competence_generator = cast(Any, AsyncMock(return_value=mock_competences))
    app.experience_generator = cast(Any, AsyncMock(return_value=mock_experiences))
    app.education_generator = cast(Any, AsyncMock(return_value=mock_education))
    app.skills_generator = cast(Any, AsyncMock(return_value=mock_skills))
    app.title_generator = cast(Any, AsyncMock(return_value=mock_title))
    app.summary_generator = cast(Any, AsyncMock(return_value=mock_summary))

    with language_context(ENGLISH):
        result = await app.generate_cv("cv text", "job description", personal_info)

        assert isinstance(result, CVDTO)
        assert result.personal_info == personal_info
        assert result.core_competences == mock_competences
        assert result.experiences == mock_experiences
        assert result.education == mock_education
        assert result.skills == mock_skills
        assert result.title == mock_title
        assert result.summary == mock_summary
