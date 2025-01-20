from datetime import date
from pathlib import Path

import pytest
import yaml

from cv_adapter.models.cv import (
    CV,
    Company,
    CoreCompetence,
    CoreCompetences,

    Education,
    Experience,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)
from cv_adapter.models.personal_info import PersonalInfo
from cv_adapter.models.summary import CVSummary
from cv_adapter.renderers import MarkdownRenderer, RendererError, YAMLRenderer


@pytest.fixture
def sample_cv() -> CV:
    return CV(
        personal_info=PersonalInfo(
            full_name="John Doe",
            contacts={
                "email": "john@example.com",
                "phone": "+1234567890",
            },
        ),
        title=Title(text="Senior Software Engineer"),
        summary=CVSummary(
            text="Experienced software engineer with a focus on Python development"
        ),
        core_competences=CoreCompetences(
            items=[
                CoreCompetence(text="Python"),
                CoreCompetence(text="Software Architecture"),
                CoreCompetence(text="Team Leadership"),
                CoreCompetence(text="Agile Development"),
            ]
        ),
        experiences=[
            Experience(
                company=Company(
                    name="Tech Corp",
                    location="New York",
                    description=None,
                ),
                position="Senior Software Engineer",
                start_date=date(2020, 1, 1),
                end_date=None,
                description="Leading backend development team",
                technologies=["Python", "FastAPI", "PostgreSQL"],
            )
        ],
        education=[
            Education(
                university=University(
                    name="State University",
                    location="Boston",
                    description=None,
                ),
                degree="Master of Computer Science",
                start_date=date(2018, 9, 1),
                end_date=date(2020, 6, 1),
                description="Focus on distributed systems",
            )
        ],
        skills=Skills(
            groups=[
                SkillGroup(
                    name="Programming Languages",
                    skills=[
                        Skill(text="Python"),
                        Skill(text="JavaScript"),
                    ],
                )
            ]
        ),
    )


def test_yaml_renderer_to_string(sample_cv: CV, tmp_path: Path) -> None:
    renderer = YAMLRenderer()
    yaml_str = renderer.render_to_string(sample_cv)

    # Verify it's valid YAML and can be parsed back
    data = yaml.safe_load(yaml_str)
    assert data["personal_info"]["full_name"] == "John Doe"
    assert data["title"]["text"] == "Senior Software Engineer"


def test_yaml_renderer_to_file(sample_cv: CV, tmp_path: Path) -> None:
    renderer = YAMLRenderer()
    file_path = tmp_path / "cv.yaml"
    renderer.render_to_file(sample_cv, file_path)

    assert file_path.exists()
    with open(file_path) as f:
        data = yaml.safe_load(f)
    assert data["personal_info"]["full_name"] == "John Doe"


def test_markdown_renderer_to_string(sample_cv: CV) -> None:
    renderer = MarkdownRenderer()
    md_str = renderer.render_to_string(sample_cv)

    # Verify key sections are present
    assert "---" in md_str
    assert "full_name: John Doe" in md_str
    assert "contacts:" in md_str
    assert "  email: john@example.com" in md_str
    assert "  phone: '+1234567890'" in md_str
    assert "---" in md_str
    assert "## Senior Software Engineer" in md_str
    assert "## Core Competences" in md_str
    assert "* Python" in md_str
    assert "## Experience" in md_str
    assert "### Senior Software Engineer at Tech Corp" in md_str
    assert "## Education" in md_str
    assert "### Master of Computer Science" in md_str
    assert "## Skills" in md_str
    assert "### Programming Languages" in md_str


def test_markdown_renderer_to_file(sample_cv: CV, tmp_path: Path) -> None:
    renderer = MarkdownRenderer()
    file_path = tmp_path / "cv.md"
    renderer.render_to_file(sample_cv, file_path)

    assert file_path.exists()
    content = file_path.read_text()
    assert "full_name: John Doe" in content


def test_yaml_renderer_error_handling(sample_cv: CV, tmp_path: Path) -> None:
    renderer = YAMLRenderer()
    non_writable_path = tmp_path / "nonexistent" / "cv.yaml"

    with pytest.raises(RendererError):
        renderer.render_to_file(sample_cv, non_writable_path)


def test_markdown_renderer_error_handling(sample_cv: CV, tmp_path: Path) -> None:
    renderer = MarkdownRenderer()
    non_writable_path = tmp_path / "nonexistent" / "cv.md"

    with pytest.raises(RendererError):
        renderer.render_to_file(sample_cv, non_writable_path)
