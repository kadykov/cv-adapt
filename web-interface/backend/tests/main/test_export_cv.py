"""Tests for CV export functionality."""

import json
from datetime import UTC, datetime
from typing import TYPE_CHECKING

import pytest
from app.models.models import DetailedCV, GeneratedCV, JobDescription, User
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

if TYPE_CHECKING:
    from app.models.models import DetailedCV, GeneratedCV, JobDescription, User
    from sqlalchemy.orm import Session


@pytest.fixture
def test_generated_cv_with_content(
    db: Session,
    test_user: User,
    test_detailed_cv: DetailedCV,
    test_job_description: JobDescription,
) -> GeneratedCV:
    """Create a test generated CV with sample content."""
    cv_content = {
        "personal_info": {
            "full_name": "John Doe",
            "email": {"value": "john@example.com", "type": "email"},
            "phone": {"value": "+1234567890", "type": "phone"},
            "location": {"value": "San Francisco, CA", "type": "location"},
        },
        "title": {"text": "Software Engineer"},
        "summary": {"text": "Experienced software engineer with Python expertise"},
        "core_competences": [
            {"text": "Technical Leadership"},
            {"text": "Software Architecture"},
            {"text": "Python Development"},
        ],
        "experiences": [
            {
                "company": {
                    "name": "Tech Corp",
                    "location": "San Francisco, CA",
                    "description": "Leading tech company",
                },
                "position": "Senior Developer",
                "start_date": "2020-01-01",
                "end_date": "2023-12-31",
                "description": "Led development of core features",
                "technologies": ["Python", "TypeScript"],
            }
        ],
        "education": [
            {
                "university": {"name": "Tech University", "location": "Boston, MA"},
                "degree": "BS Computer Science",
                "start_date": "2014-09-01",
                "end_date": "2018-06-30",
                "description": "Focus on Software Engineering",
            }
        ],
        "skills": [
            {
                "name": "Programming Languages",
                "skills": [{"text": "Python"}, {"text": "TypeScript"}],
            },
            {"name": "Tools", "skills": [{"text": "Git"}, {"text": "Docker"}]},
        ],
        "language": {"code": "en", "name": "English"},
    }

    cv = GeneratedCV(
        user_id=test_user.id,
        detailed_cv_id=test_detailed_cv.id,
        job_description_id=test_job_description.id,
        language_code="en",
        content=cv_content,
        status="draft",
        generation_parameters={"style": "professional"},
        version=1,
        created_at=datetime.now(UTC),
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return cv


def test_export_cv_json(
    client: TestClient,
    test_generated_cv_with_content: GeneratedCV,
    auth_headers: dict,
) -> None:
    """Test exporting CV in JSON format."""
    response = client.get(
        f"/v1/api/generations/{test_generated_cv_with_content.id}/export?format=json",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"] == "application/json"
    assert (
        response.headers["content-disposition"]
        == f'attachment; filename="cv_{test_generated_cv_with_content.id}.json"'
    )

    # Verify content can be parsed as JSON
    content = json.loads(response.content)
    assert "title" in content
    assert "experiences" in content
    assert "education" in content
    assert "skills" in content


def test_export_cv_markdown(
    client: TestClient,
    test_generated_cv_with_content: GeneratedCV,
    auth_headers: dict,
) -> None:
    """Test exporting CV in Markdown format."""
    response = client.get(
        f"/v1/api/generations/{test_generated_cv_with_content.id}/export?format=markdown",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"] == "text/markdown; charset=utf-8"
    assert (
        response.headers["content-disposition"]
        == f'attachment; filename="cv_{test_generated_cv_with_content.id}.md"'
    )

    content = response.content.decode()
    assert "# Software Engineer" in content
    assert "## Professional Experience" in content
    assert "## Education" in content
    assert "## Skills" in content


def test_export_cv_yaml(
    client: TestClient,
    test_generated_cv_with_content: GeneratedCV,
    auth_headers: dict,
) -> None:
    """Test exporting CV in YAML format."""
    response = client.get(
        f"/v1/api/generations/{test_generated_cv_with_content.id}/export?format=yaml",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers["content-type"] == "application/x-yaml"
    assert (
        response.headers["content-disposition"]
        == f'attachment; filename="cv_{test_generated_cv_with_content.id}.yaml"'
    )

    content = response.content.decode()
    assert "title:" in content
    assert "experiences:" in content
    assert "education:" in content
    assert "skills:" in content


def test_export_cv_not_found(
    client: TestClient,
    auth_headers: dict,
) -> None:
    """Test exporting non-existent CV."""
    response = client.get(
        "/v1/api/generations/999/export?format=json",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_export_cv_unauthorized(
    client: TestClient,
    test_generated_cv_with_content: GeneratedCV,
) -> None:
    """Test exporting CV without authentication."""
    response = client.get(
        f"/v1/api/generations/{test_generated_cv_with_content.id}/export?format=json",
    )

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


def test_export_cv_invalid_format(
    client: TestClient,
    test_generated_cv_with_content: GeneratedCV,
    auth_headers: dict,
) -> None:
    """Test exporting CV with invalid format."""
    response = client.get(
        f"/v1/api/generations/{test_generated_cv_with_content.id}/export?format=invalid",
        headers=auth_headers,
    )

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "Input should be" in response.json()["detail"][0]["msg"]


def test_export_cv_wrong_user(
    client: TestClient,
    test_generated_cv_with_content: GeneratedCV,
    alt_user: User,
    alt_auth_headers: dict[str, str],
) -> None:
    """Test exporting CV belonging to another user."""
    response = client.get(
        f"/v1/api/generations/{test_generated_cv_with_content.id}/export?format=json",
        headers=alt_auth_headers,
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert "Access denied" in response.json()["detail"]
