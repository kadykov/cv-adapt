"""Tests for Jinja2 renderer."""

from datetime import datetime
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
from cv_adapter.renderers import Jinja2Renderer, RendererError, RenderingConfig


@pytest.fixture
def sample_cv_dto() -> CVDTO:
    """Create a sample CV DTO for testing."""
    return CVDTO(
        language=ENGLISH,
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(value="john@example.com", type=None, icon=None, url=None),
            phone=ContactDTO(value="+1234567890", type=None, icon=None, url=None),
            location=ContactDTO(value="New York, USA", type=None, icon=None, url=None),
            linkedin=ContactDTO(
                value="linkedin.com/in/johndoe", type=None, icon=None, url=None
            ),
            github=ContactDTO(
                value="github.com/johndoe", type=None, icon=None, url=None
            ),
        ),
        title=TitleDTO(text="Senior Software Engineer"),
        summary=SummaryDTO(
            text="Experienced software engineer with a focus on Python development."
        ),
        core_competences=[
            CoreCompetenceDTO(text="Python Development"),
            CoreCompetenceDTO(text="System Design"),
        ],
        experiences=[
            ExperienceDTO(
                position="Senior Developer",
                company=InstitutionDTO(
                    name="Tech Corp",
                    location="San Francisco, USA",
                ),
                start_date=datetime(2020, 1, 1),
                end_date=None,
                description="Leading backend development team.",
                technologies=["Python", "Django", "PostgreSQL"],
            )
        ],
        education=[
            EducationDTO(
                degree="Master of Computer Science",
                university=InstitutionDTO(
                    name="Tech University",
                    location="Boston, USA",
                ),
                start_date=datetime(2018, 9, 1),
                end_date=datetime(2020, 6, 1),
                description="Focus on distributed systems.",
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
    )


@pytest.fixture
def sample_minimal_cv_dto() -> MinimalCVDTO:
    """Create a sample MinimalCVDTO for testing."""
    return MinimalCVDTO(
        language=ENGLISH,
        title=TitleDTO(text="Software Engineer"),
        core_competences=[
            CoreCompetenceDTO(text="Leadership"),
            CoreCompetenceDTO(text="Problem Solving"),
        ],
        experiences=[
            ExperienceDTO(
                position="Software Engineer",
                company=InstitutionDTO(
                    name="Tech Corp",
                    location="San Francisco, USA",
                ),
                start_date=datetime(2021, 1, 1),
                end_date=None,
                description="Developing web applications",
                technologies=["Python", "Django"],
            )
        ],
        education=[
            EducationDTO(
                degree="Computer Science",
                university=InstitutionDTO(
                    name="University",
                    location="Boston, USA",
                ),
                start_date=datetime(2017, 9, 1),
                end_date=datetime(2021, 6, 1),
                description="Bachelor's degree",
            )
        ],
        skills=[
            SkillGroupDTO(
                name="Programming",
                skills=[
                    SkillDTO(text="Python"),
                    SkillDTO(text="JavaScript"),
                ],
            )
        ],
    )


def test_jinja2_renderer_default_template(sample_cv_dto: CVDTO, tmp_path: Path) -> None:
    """Test Jinja2 renderer with default template."""
    renderer = Jinja2Renderer()
    output = renderer.render_to_string(sample_cv_dto)

    # Basic content checks
    assert "John Doe" in output
    assert "Senior Software Engineer" in output
    assert "Python Development" in output
    assert "Tech Corp" in output
    assert "Tech University" in output
    assert "Programming Languages" in output

    # Test file rendering
    output_file = tmp_path / "cv.md"
    renderer.render_to_file(sample_cv_dto, output_file)
    assert output_file.exists()
    assert output_file.read_text() == output


def test_jinja2_renderer_custom_template(sample_cv_dto: CVDTO, tmp_path: Path) -> None:
    """Test Jinja2 renderer with custom template."""
    # Create a custom template
    template_dir = tmp_path / "templates"
    template_dir.mkdir()
    custom_template = template_dir / "custom.j2"
    custom_template.write_text("Name: {{ cv.personal_info.full_name }}")

    # Test with custom template
    renderer = Jinja2Renderer(
        template_path=template_dir,
        template_name="custom.j2",
    )
    output = renderer.render_to_string(sample_cv_dto)
    assert output == "Name: John Doe"


def test_jinja2_renderer_with_config(sample_cv_dto: CVDTO) -> None:
    """Test Jinja2 renderer with custom config."""
    config = RenderingConfig(
        language=ENGLISH,
        include_yaml_header=False,
        include_header=False,
        include_sections=["skills"],
    )
    renderer = Jinja2Renderer(config=config)
    output = renderer.render_to_string(sample_cv_dto)

    # Check that only skills section is included
    assert "Programming Languages" in output
    assert "Python" in output
    assert "JavaScript" in output

    # Check that excluded sections are not present
    assert "Tech Corp" not in output
    assert "Tech University" not in output
    assert "---" not in output  # YAML header should be excluded


def test_jinja2_renderer_minimal_template(
    sample_minimal_cv_dto: MinimalCVDTO, tmp_path: Path
) -> None:
    """Test Jinja2 renderer with MinimalCVDTO using minimal template."""
    renderer = Jinja2Renderer()
    output = renderer.render_to_string(sample_minimal_cv_dto)

    # Basic content checks
    assert "Leadership" in output
    assert "Problem Solving" in output
    assert "Software Engineer at Tech Corp" in output
    assert "Location: San Francisco, USA" in output
    assert "Technologies: Python, Django" in output
    assert "Computer Science" in output
    assert "Institution: University" in output
    assert "Location: Boston, USA" in output
    assert "Programming" in output
    assert "* Python" in output
    assert "* JavaScript" in output

    # Test file rendering
    output_file = tmp_path / "minimal_cv.md"
    renderer.render_to_file(sample_minimal_cv_dto, output_file)
    assert output_file.exists()
    assert output_file.read_text() == output


def test_jinja2_renderer_minimal_with_config(
    sample_minimal_cv_dto: MinimalCVDTO,
) -> None:
    """Test Jinja2 renderer with MinimalCVDTO and custom config."""
    config = RenderingConfig(
        language=ENGLISH,
        include_sections=["skills", "core_competences"],
    )
    renderer = Jinja2Renderer(config=config)
    output = renderer.render_to_string(sample_minimal_cv_dto)

    # Check that only included sections are present
    assert "Programming" in output
    assert "* Python" in output
    assert "* JavaScript" in output
    assert "Leadership" in output
    assert "Problem Solving" in output

    # Check that excluded sections are not present
    assert "Tech Corp" not in output
    assert "University" not in output


def test_jinja2_renderer_error_handling(sample_cv_dto: CVDTO, tmp_path: Path) -> None:
    """Test error handling in Jinja2 renderer."""
    # Test with non-existent template directory
    with pytest.raises(RendererError):
        Jinja2Renderer(template_path=Path("/nonexistent"))

    # Test with non-existent template file
    renderer = Jinja2Renderer(template_name="nonexistent.j2")
    with pytest.raises(RendererError):
        renderer.render_to_string(sample_cv_dto)

    # Test with invalid output file path
    renderer = Jinja2Renderer()
    with pytest.raises(RendererError):
        renderer.render_to_file(sample_cv_dto, Path("/nonexistent/cv.md"))
