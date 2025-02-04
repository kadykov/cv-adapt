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
            email=ContactDTO(
                value="john@example.com", type="email", icon=None, url=None
            ),
            phone=ContactDTO(value="+1234567890", type="phone", icon=None, url=None),
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


def test_json_renderer_to_string(sample_cv: CVDTO) -> None:
    """Test rendering CV to JSON string using Pydantic's serialization."""
    renderer = JSONRenderer()
    json_str = renderer.render_to_string(sample_cv)

    # Verify it's valid JSON and can be parsed back
    data = json.loads(json_str)
    assert data["personal_info"]["full_name"] == "John Doe"
    assert data["title"]["text"] == "Senior Software Engineer"
    assert isinstance(data, dict)
    # Language is now serialized as an object by Pydantic
    assert data["language"]["code"] == "en"


def test_json_renderer_to_file(sample_cv: CVDTO, tmp_path: Path) -> None:
    """Test saving CV to JSON file."""
    renderer = JSONRenderer()
    file_path = tmp_path / "cv.json"
    renderer.render_to_file(sample_cv, file_path)

    assert file_path.exists()
    data = json.loads(file_path.read_text())
    assert data["personal_info"]["full_name"] == "John Doe"
    assert data["language"]["code"] == "en"


def test_load_from_string(sample_cv: CVDTO) -> None:
    """Test loading CV from valid JSON string."""
    renderer = JSONRenderer()
    json_str = renderer.render_to_string(sample_cv)

    loaded_cv = renderer.load_from_string(json_str)

    assert loaded_cv.personal_info.full_name == sample_cv.personal_info.full_name
    assert loaded_cv.title.text == sample_cv.title.text
    assert loaded_cv.language.code == sample_cv.language.code
    assert loaded_cv.experiences[0].start_date == sample_cv.experiences[0].start_date


def test_load_from_file(sample_cv: CVDTO, tmp_path: Path) -> None:
    """Test loading CV from valid JSON file."""
    renderer = JSONRenderer()
    file_path = tmp_path / "cv.json"

    renderer.render_to_file(sample_cv, file_path)
    loaded_cv = renderer.load_from_file(file_path)

    assert loaded_cv.personal_info.full_name == sample_cv.personal_info.full_name
    assert loaded_cv.title.text == sample_cv.title.text
    assert loaded_cv.language.code == sample_cv.language.code
    assert loaded_cv.experiences[0].start_date == sample_cv.experiences[0].start_date


def test_load_invalid_json() -> None:
    """Test loading invalid JSON string."""
    renderer = JSONRenderer()
    invalid_json = "{invalid json"

    with pytest.raises(RendererError) as exc_info:
        renderer.load_from_string(invalid_json)
    assert "Error loading CV from JSON" in str(exc_info.value)


def test_load_invalid_data() -> None:
    """Test loading JSON that doesn't match CV structure."""
    renderer = JSONRenderer()
    invalid_data = {
        "personal_info": {
            "full_name": "John Doe",
            "email": "invalid_email_format",  # Should be ContactDTO object
        }
    }

    with pytest.raises(RendererError) as exc_info:
        renderer.load_from_string(json.dumps(invalid_data))
    # Error message now comes from Pydantic validation
    assert "Error loading CV from JSON" in str(exc_info.value)


def test_render_to_file_error(sample_cv: CVDTO, tmp_path: Path) -> None:
    """Test error handling when writing to invalid path."""
    renderer = JSONRenderer()
    invalid_path = tmp_path / "nonexistent" / "cv.json"

    with pytest.raises(RendererError) as exc_info:
        renderer.render_to_file(sample_cv, invalid_path)
    assert "Error saving CV to JSON file" in str(exc_info.value)


def test_load_from_nonexistent_file(tmp_path: Path) -> None:
    """Test loading from nonexistent file."""
    renderer = JSONRenderer()
    nonexistent_file = tmp_path / "nonexistent.json"

    with pytest.raises(RendererError) as exc_info:
        renderer.load_from_file(nonexistent_file)
    assert "Error loading CV from JSON file" in str(exc_info.value)
