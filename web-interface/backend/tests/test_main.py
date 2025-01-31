import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from cv_adapter.dto.cv import ContactDTO, CoreCompetenceDTO
from cv_adapter.dto.language import ENGLISH

sys.path.append(str(Path(__file__).parent.parent))

from app.main import GenerateCompetencesRequest, GenerateCVRequest, PersonalInfo, app


# Setup test client
@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# Mock responses
MOCK_COMPETENCE_DTOS = [
    CoreCompetenceDTO(text="Competence 1"),
    CoreCompetenceDTO(text="Competence 2"),
]
MOCK_COMPETENCES = [
    "Competence 1",
    "Competence 2",
]  # String versions for response checking
MOCK_CV = {
    "personal_info": {
        "full_name": "John Doe",
        "email": {
            "value": "john@example.com",
            "type": "personal",
            "icon": None,
            "url": None,
        },
        "phone": {
            "value": "123-456-7890",
            "type": "personal",
            "icon": None,
            "url": None,
        },
        "location": {
            "value": "New York",
            "type": "personal",
            "icon": None,
            "url": None,
        },
        "linkedin": None,
        "github": None,
    },
    "summary": {"text": "Professional summary"},
    "title": {"text": "Software Engineer"},
    "core_competences": [],
    "experiences": [],
    "education": [],
    "skills": [],
    "language": {
        "code": "en",
        "name": "English",
        "native_name": "English",
        "date_format": "%m/%d/%Y",
        "decimal_separator": ".",
        "thousands_separator": ",",
    },
}


# Test cases for /api/generate-competences
def test_generate_competences_success(client: TestClient) -> None:
    with patch("app.main.cv_adapter") as mock_adapter:
        # Setup mocks
        mock_adapter.generate_core_competences.return_value = MOCK_COMPETENCE_DTOS
        mock_lang_context = patch("app.main.language_context")
        mock_lang_ctx = mock_lang_context.start()
        mock_lang_ctx.return_value.__enter__ = MagicMock()
        mock_lang_ctx.return_value.__exit__ = MagicMock()

        try:
            request_data = GenerateCompetencesRequest(
                cv_text="Sample CV", job_description="Sample Job", notes="Sample notes"
            ).model_dump()

            response = client.post("/api/generate-competences", json=request_data)

            print("Response:", response.json())  # Debug print
            assert response.status_code == 200
            assert response.json() == {"competences": MOCK_COMPETENCES}
            mock_adapter.generate_core_competences.assert_called_once_with(
                cv_text="Sample CV", job_description="Sample Job", notes="Sample notes"
            )
            mock_lang_ctx.assert_called_once_with(ENGLISH)
        finally:
            mock_lang_context.stop()


def test_generate_competences_error(client: TestClient) -> None:
    with patch("app.main.cv_adapter") as mock_adapter:
        # Setup mock
        mock_adapter.generate_core_competences.side_effect = Exception("Test error")
        mock_lang_context = patch("app.main.language_context")
        mock_lang_ctx = mock_lang_context.start()
        mock_lang_ctx.return_value.__enter__ = MagicMock()
        mock_lang_ctx.return_value.__exit__ = MagicMock()

        try:
            request_data = GenerateCompetencesRequest(
                cv_text="Sample CV", job_description="Sample Job"
            ).model_dump()

            response = client.post("/api/generate-competences", json=request_data)

            assert response.status_code == 500
            assert "Test error" in response.json()["detail"]
        finally:
            mock_lang_context.stop()


# Test cases for /api/generate-cv
def test_generate_cv_success(client: TestClient) -> None:
    with patch("app.main.cv_adapter") as mock_adapter:
        # Setup mock
        mock_adapter.generate_cv_with_competences.return_value = MOCK_CV
        mock_lang_context = patch("app.main.language_context")
        mock_lang_ctx = mock_lang_context.start()
        mock_lang_ctx.return_value.__enter__ = MagicMock()
        mock_lang_ctx.return_value.__exit__ = MagicMock()

        try:
            request_data = GenerateCVRequest(
                cv_text="Sample CV",
                job_description="Sample Job",
                personal_info=PersonalInfo(
                    full_name="John Doe",
                    email=ContactDTO(
                        value="john@example.com", type="personal"
                    ).model_dump(),
                    phone=ContactDTO(
                        value="123-456-7890", type="personal"
                    ).model_dump(),
                    location=ContactDTO(value="New York", type="personal").model_dump(),
                ),
                approved_competences=["Competence 1", "Competence 2"],
                notes="Sample notes",
            ).model_dump()

            response = client.post("/api/generate-cv", json=request_data)

            assert response.status_code == 200
            assert response.json() == MOCK_CV
            mock_adapter.generate_cv_with_competences.assert_called_once()
            mock_lang_ctx.assert_called_once_with(ENGLISH)
        finally:
            mock_lang_context.stop()


def test_generate_cv_error(client: TestClient) -> None:
    with patch("app.main.cv_adapter") as mock_adapter:
        # Setup mock
        mock_adapter.generate_cv_with_competences.side_effect = Exception("Test error")
        mock_lang_context = patch("app.main.language_context")
        mock_lang_ctx = mock_lang_context.start()
        mock_lang_ctx.return_value.__enter__ = MagicMock()
        mock_lang_ctx.return_value.__exit__ = MagicMock()

        try:
            request_data = GenerateCVRequest(
                cv_text="Sample CV",
                job_description="Sample Job",
                personal_info=PersonalInfo(
                    full_name="John Doe",
                    email=ContactDTO(
                        value="john@example.com", type="personal"
                    ).model_dump(),
                ),
                approved_competences=["Competence 1"],
                notes=None,
            ).model_dump()

            response = client.post("/api/generate-cv", json=request_data)

            assert response.status_code == 500
            assert "Test error" in response.json()["detail"]
        finally:
            mock_lang_context.stop()


# Test input validation
def test_invalid_request_data(client: TestClient) -> None:
    request_data = {"cv_text": "Sample CV"}

    response = client.post("/api/generate-competences", json=request_data)
    assert response.status_code == 422  # Unprocessable Entity


def test_invalid_personal_info(client: TestClient) -> None:
    request_data = {
        "cv_text": "Sample CV",
        "job_description": "Sample Job",
        "personal_info": {
            # missing required name
            "email": ContactDTO(value="john@example.com", type="personal").model_dump()
        },
        "approved_competences": [],
    }

    response = client.post("/api/generate-cv", json=request_data)
    assert response.status_code == 422  # Unprocessable Entity
