import json
from datetime import date
from pathlib import Path

import pytest

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
from cv_adapter.renderers.base import RendererError
from cv_adapter.renderers.json_renderer import JSONRenderer


@pytest.fixture
def sample_cv() -> CVDTO:
    return CVDTO(
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(value="john@example.com", type=None, icon=None, url=None),
            phone=ContactDTO(value="+1234567890", type=None, icon=None, url=None),
        ),
        title=TitleDTO(text="Senior Software Engineer"),
        summary=SummaryDTO(
            text="Experienced software engineer with a focus on Python development"
        ),
        core_competences=[
            CoreCompetenceDTO(text="Python"),
            CoreCompetenceDTO(text="Software Architecture"),
            CoreCompetenceDTO(text="Team Leadership"),
            CoreCompetenceDTO(text="Agile Development"),
        ],
        experiences=[
            ExperienceDTO(
                company=InstitutionDTO(
                    name="Tech Corp",
                    location="New York",
                ),
                position="Senior Software Engineer",
                start_date=date(2020, 1, 1),
                end_date=None,
                description="Leading backend development team",
                technologies=["Python", "FastAPI", "PostgreSQL"],
            )
        ],
        education=[
            EducationDTO(
                university=InstitutionDTO(
                    name="State University",
                    location="Boston",
                ),
                degree="Master of Computer Science",
                start_date=date(2018, 9, 1),
                end_date=date(2020, 6, 1),
                description="Focus on distributed systems",
            )
        ],
        skills=[
            SkillGroupDTO(
                name="Programming Languages",
                skills=[
                    SkillDTO(text="Python"),
                    SkillDTO(text="JavaScript"),
                ],
            )
        ],
        language=ENGLISH,
    )


def test_json_renderer_to_string(sample_cv: CVDTO, tmp_path: Path) -> None:
    renderer = JSONRenderer()
    json_str = renderer.render_to_string(sample_cv)

    # Verify it's valid JSON and can be parsed back
    data = json.loads(json_str)
    assert data["personal_info"]["full_name"] == "John Doe"
    assert data["title"]["text"] == "Senior Software Engineer"
    assert isinstance(data, dict)  # Ensure it's a valid JSON object


def test_json_renderer_to_file(sample_cv: CVDTO, tmp_path: Path) -> None:
    renderer = JSONRenderer()
    file_path = tmp_path / "cv.json"
    renderer.render_to_file(sample_cv, file_path)

    assert file_path.exists()
    data = json.loads(file_path.read_text())
    assert data["personal_info"]["full_name"] == "John Doe"
    assert "language" in data  # Check language field is present
    assert data["language"] == "en"  # Verify Language enum is serialized correctly


def test_json_renderer_error_handling(sample_cv: CVDTO, tmp_path: Path) -> None:
    renderer = JSONRenderer()
    non_writable_path = tmp_path / "nonexistent" / "cv.json"

    with pytest.raises(RendererError):
        renderer.render_to_file(sample_cv, non_writable_path)
