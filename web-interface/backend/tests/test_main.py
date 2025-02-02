import datetime
from unittest.mock import patch

import pytest
from app.main import app
from fastapi.testclient import TestClient

from cv_adapter.dto.cv import (
    CVDTO,
    ContactDTO,
    CoreCompetenceDTO,
    ExperienceDTO,
    InstitutionDTO,
    PersonalInfoDTO,
    SummaryDTO,
    TitleDTO,
)
from cv_adapter.dto.language import ENGLISH, FRENCH
from cv_adapter.models.context import get_current_language, language_context
from cv_adapter.renderers.json_renderer import JSONRenderer

client = TestClient(app)


@pytest.mark.asyncio
async def test_language_context_verification() -> None:
    """Test that language context is correctly set during competence generation."""
    test_request = {
        "cv_text": "Example CV",
        "job_description": "Example job",
    }
    test_competence = CoreCompetenceDTO(text="Test competence")

    # Test explicit language specification (FRENCH)
    with patch(
        "cv_adapter.core.async_application.AsyncCVAdapterApplication.generate_core_competences"
    ) as mock_generate:
        # Create a side effect that verifies the language context
        async def verify_language_context(
            *args: object, **kwargs: object
        ) -> list[CoreCompetenceDTO]:
            current_language = get_current_language()
            assert current_language == FRENCH, (
                f"Expected FRENCH language context, got {current_language}"
            )
            return [test_competence]

        mock_generate.side_effect = verify_language_context

        response = client.post(
            "/api/generate-competences",
            json=test_request,
            params={"language_code": "fr"},
        )
        assert response.status_code == 200
        mock_generate.assert_called_once()
        assert response.json() == {"competences": ["Test competence"]}


@pytest.mark.asyncio
async def test_language_dependency() -> None:
    """Test that the language dependency correctly handles language specification."""
    test_request = {
        "cv_text": "Example CV",
        "job_description": "Example job",
    }
    test_competence = CoreCompetenceDTO(text="Test competence")

    # Test default language (ENGLISH)
    with (
        language_context(ENGLISH),
        patch(
            "cv_adapter.core.async_application.AsyncCVAdapterApplication.generate_core_competences"
        ) as mock_generate,
    ):
        mock_generate.return_value = [test_competence]
        response = client.post(
            "/api/generate-competences",
            json=test_request,
        )
        assert response.status_code == 200
        mock_generate.assert_called_once()
        assert response.json() == {"competences": ["Test competence"]}

    # Test explicit language specification (FRENCH)
    with (
        language_context(FRENCH),
        patch(
            "cv_adapter.core.async_application.AsyncCVAdapterApplication.generate_core_competences"
        ) as mock_generate,
    ):
        mock_generate.return_value = [test_competence]
        response = client.post(
            "/api/generate-competences",
            json=test_request,
            params={"language_code": "fr"},
        )
        assert response.status_code == 200
        mock_generate.assert_called_once()
        assert response.json() == {"competences": ["Test competence"]}

    # Test validation error for invalid language code
    response = client.post(
        "/api/generate-competences",
        json=test_request,
        params={"language_code": "xx"},
    )
    assert response.status_code == 422
    assert "language_code" in response.json()["detail"][0]["loc"]


@pytest.mark.asyncio
async def test_generate_competences_success() -> None:
    # Test data
    test_request = {
        "cv_text": "Example CV",
        "job_description": "Example job",
    }

    # Set up language context and mock generate_core_competences
    with (
        language_context(ENGLISH),
        patch(
            "cv_adapter.core.async_application.AsyncCVAdapterApplication.generate_core_competences"
        ) as mock_generate,
    ):
        # Configure mock to return test data
        test_competence = CoreCompetenceDTO(text="Test competence")
        mock_generate.return_value = [test_competence]

        # Make request to our endpoint
        response = client.post(
            "/api/generate-competences",
            json=test_request,
        )

        # Check response
        assert response.status_code == 200
        assert response.json() == {"competences": ["Test competence"]}

        # Verify generate was called with correct arguments
        mock_generate.assert_called_once_with(
            cv_text=test_request["cv_text"],
            job_description=test_request["job_description"],
            notes=None,
        )


@pytest.mark.asyncio
async def test_generate_cv_with_competences_success() -> None:
    """Test successful CV generation with competences."""
    test_request = {
        "cv_text": "Example CV",
        "job_description": "Example job",
        "personal_info": {
            "full_name": "John Doe",
            "email": {"value": "john@example.com", "type": "Email"},
            "phone": {"value": "+1234567890", "type": "Phone"},
            "location": {"value": "New York, USA", "type": "Location"},
        },
        "approved_competences": ["Competence 1", "Competence 2"],
        "notes": "Additional notes",
    }

    expected_personal_info = PersonalInfoDTO(
        full_name="John Doe",
        email=ContactDTO(value="john@example.com", type="Email", icon=None, url=None),
        phone=ContactDTO(value="+1234567890", type="Phone", icon=None, url=None),
        location=ContactDTO(
            value="New York, USA", type="Location", icon=None, url=None
        ),
    )
    expected_competences = [
        CoreCompetenceDTO(text="Competence 1"),
        CoreCompetenceDTO(text="Competence 2"),
    ]

    # Mock CV response
    mock_cv = CVDTO(
        personal_info=expected_personal_info,
        core_competences=expected_competences,
        title=TitleDTO(text="Software Engineer"),
        summary=SummaryDTO(text="Test summary"),
        experiences=[],
        education=[],
        skills=[],
        language=ENGLISH,
    )

    with (
        language_context(ENGLISH),
        patch(
            "cv_adapter.core.async_application.AsyncCVAdapterApplication.generate_cv_with_competences"
        ) as mock_generate,
    ):
        # Add experience with date to test date serialization
        mock_cv.experiences = [
            ExperienceDTO(
                company=InstitutionDTO(
                    name="Test Company", description=None, location=None
                ),
                position="Software Engineer",
                description="Test description",
                start_date=datetime.date(2020, 1, 1),
                end_date=datetime.date(2023, 12, 31),
                technologies=["Python", "FastAPI"],
            )
        ]
        mock_generate.return_value = mock_cv

        # Make request to endpoint
        response = client.post(
            "/api/generate-cv",
            json=test_request,
        )

        # Check response
        # Validate response against JSONRenderer schema
        renderer = JSONRenderer()
        try:
            renderer.validate_json(response.json())
        except Exception as e:
            pytest.fail(f"Response JSON does not match schema: {e}")

        assert response.status_code == 200
        result = response.json()
        assert result["personal_info"]["full_name"] == "John Doe"
        assert result["personal_info"]["email"]["value"] == "john@example.com"
        assert result["core_competences"] == [
            {"text": "Competence 1"},
            {"text": "Competence 2"},
        ]

        # Verify generate was called with correct arguments and proper DTO conversion
        mock_generate.assert_called_once()
        call_args = mock_generate.call_args[1]
        assert call_args["cv_text"] == test_request["cv_text"]
        assert call_args["job_description"] == test_request["job_description"]
        assert call_args["notes"] == test_request["notes"]
        assert isinstance(call_args["personal_info"], PersonalInfoDTO)
        assert [c.text for c in call_args["core_competences"]] == test_request[
            "approved_competences"
        ]


@pytest.mark.asyncio
async def test_generate_cv_minimal_info() -> None:
    """Test CV generation with minimal required information."""
    test_request = {
        "cv_text": "Example CV",
        "job_description": "Example job",
        "personal_info": {
            "full_name": "John Doe",
            "email": {"value": "john@example.com", "type": "Email"},
        },
        "approved_competences": ["Competence 1"],
    }

    mock_cv = CVDTO(
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(
                value="john@example.com", type="Email", icon=None, url=None
            ),
            phone=None,
            location=None,
        ),
        core_competences=[CoreCompetenceDTO(text="Competence 1")],
        title=TitleDTO(text="Software Engineer"),
        summary=SummaryDTO(text="Test summary"),
        experiences=[],
        education=[],
        skills=[],
        language=ENGLISH,
    )

    with (
        language_context(ENGLISH),
        patch(
            "cv_adapter.core.async_application.AsyncCVAdapterApplication.generate_cv_with_competences"
        ) as mock_generate,
    ):
        mock_generate.return_value = mock_cv

        response = client.post(
            "/api/generate-cv",
            json=test_request,
        )

        assert response.status_code == 200
        result = response.json()
        # Verify required fields are present and correct
        assert result["personal_info"]["full_name"] == "John Doe"
        assert result["personal_info"]["email"]["value"] == "john@example.com"

        # Verify competences
        assert len(result["core_competences"]) == 1
        assert result["core_competences"][0]["text"] == "Competence 1"


@pytest.mark.asyncio
async def test_generate_cv_language_context() -> None:
    """Test that language context is correctly set during CV generation."""
    test_request = {
        "cv_text": "Example CV",
        "job_description": "Example job",
        "personal_info": {
            "full_name": "John Doe",
            "email": {"value": "john@example.com", "type": "Email"},
        },
        "approved_competences": ["Competence 1"],
    }

    mock_cv = CVDTO(
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(
                value="john@example.com", type="Email", icon=None, url=None
            ),
        ),
        core_competences=[CoreCompetenceDTO(text="Competence 1")],
        title=TitleDTO(text="Software Engineer"),
        summary=SummaryDTO(text="Test summary"),
        experiences=[],
        education=[],
        skills=[],
        language=FRENCH,
    )

    with patch(
        "cv_adapter.core.async_application.AsyncCVAdapterApplication.generate_cv_with_competences"
    ) as mock_generate:

        async def verify_language_context(*args: object, **kwargs: object) -> CVDTO:
            current_language = get_current_language()
            assert current_language == FRENCH, (
                f"Expected FRENCH language context, got {current_language}"
            )
            return mock_cv

        mock_generate.side_effect = verify_language_context

        response = client.post(
            "/api/generate-cv",
            json=test_request,
            params={"language_code": "fr"},
        )

        assert response.status_code == 200
        mock_generate.assert_called_once()


@pytest.mark.asyncio
async def test_generate_cv_error_handling() -> None:
    """Test error handling in CV generation endpoint."""
    test_request = {
        "cv_text": "Example CV",
        "job_description": "Example job",
        "personal_info": {
            "full_name": "John Doe",
            "email": {"value": "john@example.com", "type": "Email"},
        },
        "approved_competences": ["Competence 1"],
    }

    with patch(
        "cv_adapter.core.async_application.AsyncCVAdapterApplication.generate_cv_with_competences"
    ) as mock_generate:
        mock_generate.side_effect = Exception("Test error")

        response = client.post(
            "/api/generate-cv",
            json=test_request,
        )

        assert response.status_code == 500
        assert response.json()["detail"] == "Test error"
