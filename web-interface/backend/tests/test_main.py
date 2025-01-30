import sys
from pathlib import Path
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).parent.parent))

from app.main import app


# Setup test client
@pytest.fixture
def client() -> TestClient:
    return TestClient(app)


# Mock responses
MOCK_COMPETENCES = ["Competence 1", "Competence 2"]
MOCK_CV = {
    "personal_info": {
        "full_name": "John Doe",
        "email": {
            "value": "john@example.com",
            "type": "personal",
            "icon": None,
            "url": None
        },
        "phone": {
            "value": "123-456-7890",
            "type": "personal",
            "icon": None,
            "url": None
        },
        "location": {
            "value": "New York",
            "type": "personal",
            "icon": None,
            "url": None
        },
        "linkedin": None,
        "github": None
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
        "thousands_separator": ","
    },
}


# Test cases for /api/generate-competences
def test_generate_competences_success(client: TestClient) -> None:
    with patch("app.main.cv_adapter") as mock_adapter:
        # Setup mock
        mock_adapter.competence_generator.return_value.competences = MOCK_COMPETENCES

        # Test data
        request_data = {
            "cv_text": "Sample CV",
            "job_description": "Sample Job",
            "notes": "Sample notes",
        }

        # Make request
        response = client.post("/api/generate-competences", json=request_data)

        # Assertions
        assert response.status_code == 200
        assert response.json() == {"competences": MOCK_COMPETENCES}
        mock_adapter.competence_generator.assert_called_once()


def test_generate_competences_error(client: TestClient) -> None:
    with patch("app.main.cv_adapter") as mock_adapter:
        # Setup mock to raise exception
        mock_adapter.competence_generator.side_effect = Exception("Test error")

        # Test data
        request_data = {"cv_text": "Sample CV", "job_description": "Sample Job"}

        # Make request
        response = client.post("/api/generate-competences", json=request_data)

        # Assertions
        assert response.status_code == 500
        assert "Test error" in response.json()["detail"]


# Test cases for /api/generate-cv
def test_generate_cv_success(client: TestClient) -> None:
    with patch("app.main.cv_adapter") as mock_adapter:
        # Setup mock
        mock_adapter.generate_cv.return_value = MOCK_CV

        # Test data
        request_data = {
            "cv_text": "Sample CV",
            "job_description": "Sample Job",
            "personal_info": {
                "full_name": "John Doe",
                "email": {"value": "john@example.com", "type": "personal"},
                "phone": {"value": "123-456-7890", "type": "personal"},
                "location": {"value": "New York", "type": "personal"},
            },
            "approved_competences": ["Competence 1", "Competence 2"],
            "notes": "Sample notes",
        }

        # Make request
        response = client.post("/api/generate-cv", json=request_data)

        # Assertions
        assert response.status_code == 200
        assert response.json() == MOCK_CV
        mock_adapter.generate_cv.assert_called_once()


def test_generate_cv_error(client: TestClient) -> None:
    with patch("app.main.cv_adapter") as mock_adapter:
        # Setup mock to raise exception
        mock_adapter.generate_cv.side_effect = Exception("Test error")

        # Test data
        request_data = {
            "cv_text": "Sample CV",
            "job_description": "Sample Job",
            "personal_info": {
                "full_name": "John Doe",
                "email": {"value": "john@example.com", "type": "personal"},
            },
            "approved_competences": ["Competence 1"],
            "notes": None,
        }

        # Make request
        response = client.post("/api/generate-cv", json=request_data)

        # Assertions
        assert response.status_code == 500
        assert "Test error" in response.json()["detail"]


# Test input validation
def test_invalid_request_data(client: TestClient) -> None:
    # Missing required fields
    request_data = {
        "cv_text": "Sample CV"
        # missing job_description
    }

    response = client.post("/api/generate-competences", json=request_data)
    assert response.status_code == 422  # Unprocessable Entity


def test_invalid_personal_info(client: TestClient) -> None:
    request_data = {
        "cv_text": "Sample CV",
        "job_description": "Sample Job",
        "personal_info": {
            # missing required name
            "email": "john@example.com"
        },
        "approved_competences": [],
    }

    response = client.post("/api/generate-cv", json=request_data)
    assert response.status_code == 422  # Unprocessable Entity
