from unittest.mock import patch

from app.main import app
from fastapi.testclient import TestClient

from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.language import ENGLISH, FRENCH
from cv_adapter.models.context import get_current_language, language_context

client = TestClient(app)


def test_language_context_verification() -> None:
    """Test that language context is correctly set during competence generation."""
    test_request = {
        "cv_text": "Example CV",
        "job_description": "Example job",
    }
    test_competence = CoreCompetenceDTO(text="Test competence")

    # Test explicit language specification (FRENCH)
    with patch(
        "cv_adapter.core.application.CVAdapterApplication.generate_core_competences"
    ) as mock_generate:
        # Create a side effect that verifies the language context
        def verify_language_context(
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


def test_language_dependency() -> None:
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
            "cv_adapter.core.application.CVAdapterApplication.generate_core_competences"
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
            "cv_adapter.core.application.CVAdapterApplication.generate_core_competences"
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


def test_generate_competences_success() -> None:
    # Test data
    test_request = {
        "cv_text": "Example CV",
        "job_description": "Example job",
    }

    # Set up language context and mock generate_core_competences
    with (
        language_context(ENGLISH),
        patch(
            "cv_adapter.core.application.CVAdapterApplication.generate_core_competences"
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
        print("Response:", response.status_code)
        print("Response body:", response.json())
        assert response.status_code == 200
        assert response.json() == {"competences": ["Test competence"]}

        # Verify generate was called with correct arguments
        mock_generate.assert_called_once_with(
            cv_text=test_request["cv_text"],
            job_description=test_request["job_description"],
            notes=None,
        )
