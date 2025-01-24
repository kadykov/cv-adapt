from datetime import date
from pathlib import Path

import pytest
import yaml

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
from cv_adapter.renderers.yaml_renderer import YAMLRenderer


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


def test_yaml_renderer_to_string(sample_cv: CVDTO, tmp_path: Path) -> None:
    renderer = YAMLRenderer()
    yaml_str = renderer.render_to_string(sample_cv)

    # Verify it's valid YAML and can be parsed back
    data = yaml.safe_load(yaml_str)
    assert data["personal_info"]["full_name"] == "John Doe"
    assert data["title"]["text"] == "Senior Software Engineer"


def test_yaml_renderer_to_file(sample_cv: CVDTO, tmp_path: Path) -> None:
    renderer = YAMLRenderer()
    file_path = tmp_path / "cv.yaml"
    renderer.render_to_file(sample_cv, file_path)

    assert file_path.exists()
    data = yaml.safe_load(file_path.read_text())
    assert data["personal_info"]["full_name"] == "John Doe"


def test_yaml_renderer_error_handling(sample_cv: CVDTO, tmp_path: Path) -> None:
    renderer = YAMLRenderer()
    non_writable_path = tmp_path / "nonexistent" / "cv.yaml"

    with pytest.raises(RendererError):
        renderer.render_to_file(sample_cv, non_writable_path)
