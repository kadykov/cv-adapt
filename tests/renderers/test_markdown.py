"""Tests for Markdown renderer aliases."""

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
    MinimalCVDTO,
    PersonalInfoDTO,
    SkillDTO,
    SkillGroupDTO,
    SummaryDTO,
    TitleDTO,
)
from cv_adapter.dto.language import ENGLISH
from cv_adapter.renderers.base import RenderingConfig
from cv_adapter.renderers.markdown import (
    CoreCompetencesRenderer,
    MarkdownListRenderer,
    MarkdownRenderer,
    MinimalMarkdownRenderer,
)


def test_markdown_list_renderer_bullet_list() -> None:
    """Test rendering a list of items as Markdown bullet points."""
    items = [
        CoreCompetenceDTO(text="Leadership"),
        CoreCompetenceDTO(text="Problem Solving"),
    ]

    result = MarkdownListRenderer.render_bullet_list(items)

    assert result == ["* Leadership", "* Problem Solving"]


def test_core_competences_renderer_to_list() -> None:
    """Test rendering core competences to a list of strings."""
    core_competences = [
        CoreCompetenceDTO(text="Leadership"),
        CoreCompetenceDTO(text="Problem Solving"),
    ]

    result = CoreCompetencesRenderer.render_to_list(core_competences)

    assert result == ["Leadership", "Problem Solving"]


def test_core_competences_renderer_to_markdown() -> None:
    """Test rendering core competences to Markdown format."""
    core_competences = [
        CoreCompetenceDTO(text="Leadership"),
        CoreCompetenceDTO(text="Problem Solving"),
    ]

    result = CoreCompetencesRenderer.render_to_markdown(core_competences)

    assert result == "* Leadership\n* Problem Solving"


@pytest.fixture
def sample_cv_dto() -> CVDTO:
    """Create a sample CV DTO for testing."""
    return CVDTO(
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(
                value="john@example.com",
                type="primary",
                icon="email",
                url="mailto:john@example.com",
            ),
            phone=ContactDTO(
                value="+1234567890", type="primary", icon="phone", url="tel:+1234567890"
            ),
            location=ContactDTO(
                value="New York, NY", type="location", icon="location", url=None
            ),
        ),
        title=TitleDTO(text="Senior Software Engineer"),
        summary=SummaryDTO(
            text="Experienced software engineer with a focus on Python development"
        ),
        core_competences=[
            CoreCompetenceDTO(text="Python"),
            CoreCompetenceDTO(text="Software Architecture"),
        ],
        experiences=[
            ExperienceDTO(
                company=InstitutionDTO(name="Tech Corp", location="New York"),
                position="Senior Software Engineer",
                start_date=date(2020, 1, 1),
                end_date=None,
                description="Leading backend development team",
                technologies=["Python", "FastAPI", "PostgreSQL"],
            )
        ],
        education=[
            EducationDTO(
                university=InstitutionDTO(name="State University", location="Boston"),
                degree="Master of Computer Science",
                start_date=date(2018, 9, 1),
                end_date=date(2020, 6, 1),
                description="Focus on distributed systems",
            )
        ],
        skills=[
            SkillGroupDTO(
                name="Programming Languages",
                skills=[SkillDTO(text="Python"), SkillDTO(text="JavaScript")],
            )
        ],
        language=ENGLISH,
    )


def test_markdown_renderer_to_string(sample_cv_dto: CVDTO) -> None:
    """Test rendering CV to Markdown string using Jinja2 template."""
    renderer = MarkdownRenderer()
    md_str = renderer.render_to_string(sample_cv_dto)

    # Verify key sections are present
    assert "---" in md_str
    assert "full_name: John Doe" in md_str
    assert "contacts:" in md_str
    assert "  email: john@example.com" in md_str
    assert "  phone: +1234567890" in md_str
    assert "---" in md_str
    assert "## Senior Software Engineer" in md_str
    assert "## Core Competences" in md_str
    assert "* Python" in md_str
    assert "## Professional Experience" in md_str
    assert "### Senior Software Engineer | Tech Corp" in md_str
    assert "## Education" in md_str
    assert "### Master of Computer Science | State University" in md_str
    assert "## Skills" in md_str
    assert "### Programming Languages" in md_str


def test_markdown_renderer_to_file(sample_cv_dto: CVDTO, tmp_path: Path) -> None:
    """Test rendering CV to Markdown file using Jinja2 template."""
    renderer = MarkdownRenderer()
    file_path = tmp_path / "cv.md"
    renderer.render_to_file(sample_cv_dto, file_path)

    assert file_path.exists()
    content = file_path.read_text()
    assert "full_name: John Doe" in content


def test_minimal_markdown_renderer_to_string() -> None:
    """Test rendering MinimalCVDTO to Markdown string using Jinja2 template."""
    minimal_cv_dto = MinimalCVDTO(
        title=TitleDTO(text="Software Engineer"),
        core_competences=[
            CoreCompetenceDTO(text="Leadership"),
            CoreCompetenceDTO(text="Problem Solving"),
        ],
        experiences=[
            ExperienceDTO(
                company=InstitutionDTO(name="Tech Corp", location="San Francisco"),
                position="Software Engineer",
                start_date=date(2021, 1, 1),
                end_date=None,
                description="Developing web applications",
                technologies=["Python", "Django"],
            )
        ],
        education=[
            EducationDTO(
                university=InstitutionDTO(name="University", location="Boston"),
                degree="Computer Science",
                start_date=date(2017, 9, 1),
                end_date=date(2021, 6, 1),
                description="Bachelor's degree",
            )
        ],
        skills=[
            SkillGroupDTO(
                name="Programming",
                skills=[SkillDTO(text="Python"), SkillDTO(text="JavaScript")],
            )
        ],
        language=ENGLISH,
    )

    renderer = MinimalMarkdownRenderer()
    md_str = renderer.render_to_string(minimal_cv_dto)

    # Verify key sections are present
    assert "## Core Competences" in md_str
    assert "* Leadership" in md_str
    assert "* Problem Solving" in md_str
    assert "## Professional Experience" in md_str
    assert "### Software Engineer at Tech Corp" in md_str
    assert "Location: San Francisco" in md_str
    assert "Technologies: Python, Django" in md_str
    assert "## Education" in md_str
    assert "### Computer Science" in md_str
    assert "Institution: University" in md_str
    assert "Location: Boston" in md_str
    assert "## Skills" in md_str
    assert "### Programming" in md_str
    assert "* Python" in md_str
    assert "* JavaScript" in md_str


def test_markdown_renderer_with_config(sample_cv_dto: CVDTO) -> None:
    """Test Markdown renderer with custom config."""
    config = RenderingConfig(
        language=ENGLISH,
        include_yaml_header=False,
        include_header=False,
        include_sections=["skills"],
    )
    renderer = MarkdownRenderer(config=config)
    output = renderer.render_to_string(sample_cv_dto)

    # Check that only skills section is included
    assert "Programming Languages" in output
    assert "Python" in output
    assert "JavaScript" in output

    # Check that excluded sections are not present
    assert "Tech Corp" not in output
    assert "State University" not in output
    assert "---" not in output  # YAML header should be excluded
