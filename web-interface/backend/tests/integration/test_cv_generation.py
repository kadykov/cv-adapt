"""Integration tests for CV generation flow."""

import pytest
from app.main import app
from fastapi.testclient import TestClient

from cv_adapter.renderers.json_renderer import JSONRenderer

client = TestClient(app)


@pytest.fixture(scope="module")
def test_cv_data() -> dict:
    """Fixture providing test CV generation data."""
    return {
        "cv_text": "Software Engineer with 5 years of experience in Python development",
        "job_description": "Looking for a Python developer with FastAPI experience",
    }


@pytest.fixture(scope="module")
def test_personal_info() -> dict:
    """Fixture providing test personal information."""
    return {
        "full_name": "John Doe",
        "email": {"value": "john@example.com", "type": "Email"},
        "phone": {"value": "+1234567890", "type": "Phone"},
        "location": {"value": "San Francisco, CA", "type": "Location"},
    }


@pytest.fixture(scope="module")
def json_renderer() -> JSONRenderer:
    """Fixture providing JSONRenderer instance for schema validation."""
    return JSONRenderer()


@pytest.mark.asyncio
async def test_complete_cv_generation_flow(
    test_cv_data: dict,
    test_personal_info: dict,
    json_renderer: JSONRenderer,
) -> None:
    """Test the complete flow of CV generation with the test AI model."""
    # 1. Generate competences
    competences_response = client.post(
        "/api/generate-competences",
        json=test_cv_data,
    )
    assert competences_response.status_code == 200
    competences_result = competences_response.json()

    # Validate competences response
    assert "competences" in competences_result
    assert len(competences_result["competences"]) >= 1  # At least one competence

    # 2. Generate CV with the competences
    cv_request = {
        **test_cv_data,
        "personal_info": test_personal_info,
        "approved_competences": competences_result["competences"],
    }

    cv_response = client.post("/api/generate-cv", json=cv_request)
    assert cv_response.status_code == 200
    cv_result = cv_response.json()

    # Validate CV structure
    assert cv_result["personal_info"]["full_name"] == test_personal_info["full_name"]
    assert (
        cv_result["personal_info"]["email"]["value"]
        == test_personal_info["email"]["value"]
    )
    assert len(cv_result["core_competences"]) >= 1

    # Validate CV response against JSON schema
    json_renderer.validate_json(cv_result)


@pytest.mark.asyncio
async def test_contact_validation() -> None:
    """Test validation of contact information in CV generation."""
    base_request = {
        "cv_text": "Test CV",
        "job_description": "Test job",
        "approved_competences": ["Test competence"],
    }

    # Test missing type in email
    invalid_email = {
        **base_request,
        "personal_info": {
            "full_name": "John Doe",
            "email": {"value": "test@example.com"},  # Missing type
        },
    }
    response = client.post("/api/generate-cv", json=invalid_email)
    assert response.status_code == 422
    assert "type" in response.text.lower()

    # Test missing value in email
    invalid_email_2 = {
        **base_request,
        "personal_info": {
            "full_name": "John Doe",
            "email": {"type": "Email"},  # Missing value
        },
    }
    response = client.post("/api/generate-cv", json=invalid_email_2)
    assert response.status_code == 422
    assert "value" in response.text.lower()


@pytest.mark.asyncio
async def test_multilanguage_generation(
    test_cv_data: dict,
    test_personal_info: dict,
    json_renderer: JSONRenderer,
) -> None:
    """Test CV generation in different languages."""
    # Generate competences in French
    competences_response = client.post(
        "/api/generate-competences",
        json=test_cv_data,
        params={"language_code": "fr"},
    )
    assert competences_response.status_code == 200
    competences = competences_response.json()["competences"]

    # Generate CV in French
    cv_request = {
        **test_cv_data,
        "personal_info": test_personal_info,
        "approved_competences": competences,
    }
    cv_response = client.post(
        "/api/generate-cv",
        json=cv_request,
        params={"language_code": "fr"},
    )
    assert cv_response.status_code == 200
    cv_result = cv_response.json()
    assert (
        cv_result["language"] == "fr"
    )  # JSONRenderer converts Language object to code string

    # Validate French CV response against JSON schema
    json_renderer.validate_json(cv_result)


@pytest.mark.asyncio
async def test_invalid_language_code(test_cv_data: dict) -> None:
    """Test handling of invalid language codes."""
    response = client.post(
        "/api/generate-competences",
        json=test_cv_data,
        params={"language_code": "invalid"},
    )
    assert response.status_code == 422
    assert "language_code" in response.json()["detail"][0]["loc"]
