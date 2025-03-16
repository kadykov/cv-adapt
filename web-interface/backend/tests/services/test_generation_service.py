"""Tests for CV generation service implementation."""

from typing import Any, Dict
from unittest.mock import AsyncMock as AsyncMockType

import pytest
from app.models.sqlmodels import DetailedCV, GeneratedCV, JobDescription, User
from app.services.generation.generation_service import CVGenerationServiceImpl
from app.services.generation.protocols import GenerationError, ValidationError
from app.services.repositories import EntityNotFoundError
from sqlmodel import Session

from cv_adapter.dto.cv import CVDTO, ContactDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import Language


def get_id(value: Any) -> int:
    """Get integer ID from SQLAlchemy Column."""
    return int(value) if value is not None else 1


@pytest.fixture
def mock_cv_adapter() -> AsyncMockType:
    """Create a mock CV adapter."""
    adapter = AsyncMockType()
    adapter.generate_core_competences = AsyncMockType()
    adapter.generate_cv_with_competences = AsyncMockType()
    return adapter


@pytest.fixture
def generation_service(
    db: Session, mock_cv_adapter: AsyncMockType
) -> CVGenerationServiceImpl:
    """Create a generation service with mock adapter."""
    return CVGenerationServiceImpl(db, mock_cv_adapter)


@pytest.fixture
def mock_cv_dto() -> CVDTO:
    """Create mock CV DTO."""
    return CVDTO.model_validate(
        {
            "title": {"text": "Test Title"},
            "summary": {"text": "Test Summary"},
            "experiences": [],
            "education": [],
            "skills": [],
            "core_competences": [],
            "personal_info": {
                "full_name": "Test User",
                "email": {
                    "value": "test@example.com",
                    "type": "email",
                    "icon": "email",
                    "url": "mailto:test@example.com",
                },
            },
            "language": {"code": "en"},
        }
    )


@pytest.mark.asyncio
async def test_generate_competences(
    generation_service: CVGenerationServiceImpl, mock_cv_adapter: AsyncMockType
) -> None:
    """Test competence generation."""
    mock_competences = [CoreCompetenceDTO(text="test competence")]
    mock_cv_adapter.generate_core_competences.return_value = mock_competences

    result = await generation_service.generate_competences(
        cv_text="test cv",
        job_description="test job",
        notes="test notes",
        language=Language(code="en"),
    )

    assert result == mock_competences
    mock_cv_adapter.generate_core_competences.assert_called_once_with(
        cv_text="test cv", job_description="test job", notes="test notes"
    )


@pytest.mark.asyncio
async def test_generate_competences_error(
    generation_service: CVGenerationServiceImpl, mock_cv_adapter: AsyncMockType
) -> None:
    """Test competence generation error handling."""
    mock_cv_adapter.generate_core_competences.side_effect = Exception("Test error")

    with pytest.raises(GenerationError) as exc_info:
        await generation_service.generate_competences(
            cv_text="test cv", job_description="test job"
        )

    assert str(exc_info.value) == "Test error"


@pytest.mark.asyncio
async def test_generate_cv(
    generation_service: CVGenerationServiceImpl,
    mock_cv_adapter: AsyncMockType,
    mock_cv_dto: CVDTO,
) -> None:
    """Test CV generation."""
    mock_cv_adapter.generate_cv_with_competences.return_value = mock_cv_dto

    personal_info = PersonalInfoDTO(
        full_name="Test User",
        email=ContactDTO(
            value="test@example.com",
            type="email",
            icon="email",
            url="mailto:test@example.com",
        ),
    )
    competences = [CoreCompetenceDTO(text="test competence")]

    result = await generation_service.generate_cv(
        cv_text="test cv",
        job_description="test job",
        personal_info=personal_info,
        competences=competences,
        notes="test notes",
        language=Language(code="en"),
    )

    assert result == mock_cv_dto
    mock_cv_adapter.generate_cv_with_competences.assert_called_once_with(
        cv_text="test cv",
        job_description="test job",
        personal_info=personal_info,
        core_competences=competences,
        notes="test notes",
    )


@pytest.mark.asyncio
async def test_generate_cv_error(
    generation_service: CVGenerationServiceImpl, mock_cv_adapter: AsyncMockType
) -> None:
    """Test CV generation error handling."""
    mock_cv_adapter.generate_cv_with_competences.side_effect = Exception("Test error")

    personal_info = PersonalInfoDTO(
        full_name="Test User",
        email=ContactDTO(
            value="test@example.com",
            type="email",
            icon="email",
            url="mailto:test@example.com",
        ),
    )
    competences = [CoreCompetenceDTO(text="test competence")]

    with pytest.raises(GenerationError) as exc_info:
        await generation_service.generate_cv(
            cv_text="test cv",
            job_description="test job",
            personal_info=personal_info,
            competences=competences,
        )

    assert str(exc_info.value) == "Test error"


@pytest.mark.asyncio
async def test_generate_and_store_cv(
    generation_service: CVGenerationServiceImpl,
    mock_cv_adapter: AsyncMockType,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
    mock_cv_dto: CVDTO,
) -> None:
    """Test CV generation and storage."""
    mock_cv_adapter.generate_core_competences.return_value = [
        CoreCompetenceDTO(text="test competence")
    ]
    mock_cv_adapter.generate_cv_with_competences.return_value = mock_cv_dto

    # Get integer IDs
    user_id = get_id(test_user.id)
    detailed_cv_id = get_id(test_detailed_cv.id)
    job_description_id = get_id(test_job_description.id)

    result = await generation_service.generate_and_store_cv(
        user_id=user_id,
        detailed_cv_id=detailed_cv_id,
        job_description_id=job_description_id,
        language_code="en",
        generation_parameters={"test": "params"},
    )

    assert result.user_id == user_id
    assert result.detailed_cv_id == detailed_cv_id
    assert result.job_description_id == job_description_id
    assert result.language_code == "en"
    assert result.generation_parameters == {"test": "params"}
    assert result.status == "draft"
    assert isinstance(result.content, dict)
    assert "title" in result.content
    assert "summary" in result.content
    assert "experiences" in result.content
    assert "education" in result.content
    assert "core_competences" in result.content
    assert "language" in result.content and result.content["language"]["code"] == "en"


@pytest.mark.asyncio
async def test_generate_and_store_cv_not_found(
    generation_service: CVGenerationServiceImpl,
) -> None:
    """Test error when detailed CV or job not found."""
    with pytest.raises(EntityNotFoundError):
        await generation_service.generate_and_store_cv(
            user_id=1,
            detailed_cv_id=999,  # Non-existent
            job_description_id=1,
            language_code="en",
        )


@pytest.mark.asyncio
async def test_update_cv_status(
    generation_service: CVGenerationServiceImpl, test_generated_cv: GeneratedCV
) -> None:
    """Test CV status update."""
    cv_id = get_id(test_generated_cv.id)
    result = await generation_service.update_cv_status(cv_id=cv_id, status="approved")

    assert result.id == cv_id
    assert result.status == "approved"


@pytest.mark.asyncio
async def test_update_cv_status_invalid(
    generation_service: CVGenerationServiceImpl, test_generated_cv: GeneratedCV
) -> None:
    """Test CV status update with invalid status."""
    cv_id = get_id(test_generated_cv.id)
    with pytest.raises(ValidationError):
        await generation_service.update_cv_status(cv_id=cv_id, status="invalid")


@pytest.mark.asyncio
async def test_update_generation_parameters(
    generation_service: CVGenerationServiceImpl, test_generated_cv: GeneratedCV
) -> None:
    """Test generation parameters update."""
    cv_id = get_id(test_generated_cv.id)
    new_params: Dict[str, Any] = {"new": "params"}
    result = await generation_service.update_generation_parameters(
        cv_id=cv_id, parameters=new_params
    )

    assert result.id == cv_id
    assert result.generation_parameters == new_params


@pytest.mark.asyncio
async def test_update_generation_parameters_invalid(
    generation_service: CVGenerationServiceImpl, test_generated_cv: GeneratedCV
) -> None:
    """Test generation parameters update with invalid parameters."""
    cv_id = get_id(test_generated_cv.id)
    with pytest.raises(ValidationError):
        await generation_service.update_generation_parameters(
            cv_id=cv_id,
            parameters="not a dict",  # type: ignore
        )
