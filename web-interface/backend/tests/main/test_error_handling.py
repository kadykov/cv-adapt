"""Tests for error handling in the API endpoints."""

from typing import Any, Dict

from app.main import app
from app.schemas.common import ErrorCode
from fastapi.testclient import TestClient

client = TestClient(app)


def assert_error_response(
    data: Dict[str, Any], expected_code: ErrorCode, expected_status: int
) -> None:
    """Assert that the error response matches the expected format.

    Args:
        data: Response data to validate
        expected_code: Expected error code
        expected_status: Expected HTTP status code
    """
    assert "error" in data, f"Response should contain 'error' field: {data}"
    assert data["status_code"] == expected_status, (
        f"Expected status {expected_status}, got {data.get('status_code')}"
    )
    error = data["error"]
    assert error["code"] == expected_code.value, (
        f"Expected code {expected_code.value}, got {error.get('code')}"
    )
    assert "message" in error, f"Response should contain 'message' field: {error}"


def test_http_exception_handler_not_found(client: TestClient) -> None:
    """Test entity not found errors are properly handled."""
    response = client.post("/test/not-found")
    assert response.status_code == 404
    data = response.json()
    assert_error_response(data, ErrorCode.NOT_FOUND, 404)
    assert "not found" in data["error"]["message"].lower()


def test_http_exception_handler_forbidden(client: TestClient) -> None:
    """Test HTTP 403 errors are properly handled using FastAPI's format."""
    response = client.post("/test/permission-error")
    assert response.status_code == 403
    data = response.json()
    # FastAPI's default format for HTTP errors
    assert "detail" in data
    assert data["detail"] == "Access denied"


def test_http_exception_handler_unauthorized(client: TestClient) -> None:
    """Test HTTP 401 errors are properly handled using FastAPI's format."""
    response = client.post("/test/http-unauthorized")
    assert response.status_code == 401
    data = response.json()
    # FastAPI's default format for HTTP errors
    assert "detail" in data
    assert data["detail"] == "Not authenticated"


def test_authentication_error_handler_token(client: TestClient) -> None:
    """Test domain authentication errors are properly handled."""
    response = client.post("/test/domain-auth-error")
    assert response.status_code == 401
    data = response.json()
    assert_error_response(data, ErrorCode.PERMISSION_DENIED, 401)
    assert data["error"]["field"] == "token"
    assert "invalid token format" in data["error"]["message"].lower()


def test_authentication_error_handler_email(client: TestClient) -> None:
    """Test authentication errors with email field are properly handled."""
    response = client.post("/test/auth-error-invalid-email")
    assert response.status_code == 401
    data = response.json()
    assert_error_response(data, ErrorCode.PERMISSION_DENIED, 401)
    assert data["error"]["field"] == "email"
    assert "incorrect email or password" in data["error"]["message"].lower()


def test_authentication_error_handler_password(client: TestClient) -> None:
    """Test authentication errors with password field are properly handled."""
    response = client.post("/test/auth-error-invalid-password")
    assert response.status_code == 401
    data = response.json()
    assert_error_response(data, ErrorCode.PERMISSION_DENIED, 401)
    assert data["error"]["field"] == "password"
    assert "incorrect email or password" in data["error"]["message"].lower()


def test_authentication_error_handler_refresh_token(client: TestClient) -> None:
    """Test authentication errors with refresh token are properly handled."""
    response = client.post("/test/auth-error-invalid-token")
    assert response.status_code == 401
    data = response.json()
    assert_error_response(data, ErrorCode.PERMISSION_DENIED, 401)
    assert data["error"]["field"] == "token"
    assert "invalid refresh token" in data["error"]["message"].lower()


def test_validation_error_handler_single(client: TestClient) -> None:
    """Test single validation errors are properly handled."""
    response = client.post("/test/validation-error", json={})
    assert response.status_code == 422
    data = response.json()
    assert_error_response(data, ErrorCode.VALIDATION_ERROR, 422)
    assert data["error"]["field"] == "status"


def test_validation_error_handler_multiple(
    client: TestClient, auth_headers: Dict[str, str]
) -> None:
    """Test multiple validation errors are properly handled."""
    response = client.post("/test/multiple-validation-error", headers=auth_headers)
    assert response.status_code == 422
    data = response.json()
    assert_error_response(data, ErrorCode.VALIDATION_ERROR, 422)
    assert "multiple validation errors" in data["error"]["message"].lower()
    assert "errors" in data["error"]["details"]
    assert len(data["error"]["details"]["fields"]) > 1


def test_generation_error_handler(client: TestClient) -> None:
    """Test generation errors are properly handled."""
    response = client.post("/test/generation-error")
    assert response.status_code == 500
    data = response.json()
    assert_error_response(data, ErrorCode.GENERATION_ERROR, 500)
    assert "failed to generate cv" in data["error"]["message"].lower()


def test_generation_validation_error_handler(client: TestClient) -> None:
    """Test generation validation errors are properly handled."""
    response = client.post("/test/generation-validation-error")
    assert response.status_code == 422
    data = response.json()
    assert_error_response(data, ErrorCode.VALIDATION_ERROR, 422)
    assert data["error"]["field"] == "language_code"
    assert "invalid language code" in data["error"]["message"].lower()


def test_general_exception_handler(
    client: TestClient, auth_headers: Dict[str, str]
) -> None:
    """Test unhandled exceptions are properly handled by FastAPI's error handler.

    FastAPI's built-in error handler ensures 500 errors return a generic
    sanitized response to prevent information leaks.
    """
    response = client.post("/test/error", headers=auth_headers)
    assert response.status_code == 500

    # FastAPI returns a plain text response for 500 errors by default
    assert response.text == "Internal Server Error"
    assert "test internal server error" not in response.text.lower()


def test_sensitive_information_handling(
    client: TestClient, auth_headers: Dict[str, str]
) -> None:
    """Test sensitive information is properly sanitized from error responses.

    FastAPI's built-in error handler ensures sensitive information is not
    leaked in error responses by returning a generic error message.
    """
    response = client.post("/test/sensitive-error", headers=auth_headers)
    assert response.status_code == 500

    # FastAPI returns a plain text response for 500 errors by default
    assert response.text == "Internal Server Error"

    # Verify sensitive information is not exposed
    text = response.text.lower()
    assert "secret123" not in text
    assert "password" not in text
    assert "admin" not in text
    assert "db.example.com" not in text
