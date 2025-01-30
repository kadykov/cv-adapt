from datetime import date
from pathlib import Path
from typing import List

import pytest
import yaml

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
from cv_adapter.dto.language import ENGLISH, FRENCH, Language
from cv_adapter.renderers.base import RenderingConfig
from cv_adapter.renderers.markdown import (
    BaseMarkdownRenderer,
    CoreCompetencesRenderer,
    MarkdownListRenderer,
    MarkdownRenderer,
    MinimalMarkdownRenderer,
    RendererError,
)


def test_markdown_list_renderer_bullet_list() -> None:
    """Test rendering a list of items as Markdown bullet points."""
    items: list = [
        CoreCompetenceDTO(text="Leadership"),
        CoreCompetenceDTO(text="Problem Solving"),
    ]

    result = MarkdownListRenderer.render_bullet_list(items)

    assert result == ["* Leadership", "* Problem Solving"]


def test_markdown_list_renderer_empty_list() -> None:
    """Test rendering an empty list of items."""
    result = MarkdownListRenderer.render_bullet_list([])
    assert result == []


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


def test_base_markdown_renderer_section_labels() -> None:
    """Test section labels in BaseMarkdownRenderer."""
    # Test English labels
    renderer = BaseMarkdownRenderer(RenderingConfig(language=ENGLISH))
    assert (
        renderer._get_section_label("experience", ENGLISH) == "Professional Experience"
    )
    assert renderer._get_section_label("education", ENGLISH) == "Education"
    assert renderer._get_section_label("skills", ENGLISH) == "Skills"
    assert (
        renderer._get_section_label("core_competences", ENGLISH) == "Core Competences"
    )

    # Test French labels
    renderer = BaseMarkdownRenderer(RenderingConfig(language=FRENCH))
    assert (
        renderer._get_section_label("experience", FRENCH)
        == "Expérience Professionnelle"
    )
    assert renderer._get_section_label("education", FRENCH) == "Formation"
    assert renderer._get_section_label("skills", FRENCH) == "Compétences"
    assert renderer._get_section_label("core_competences", FRENCH) == "Compétences Clés"


def test_base_markdown_renderer_custom_renderers() -> None:
    """Test custom renderers in BaseMarkdownRenderer."""

    def custom_core_competences_renderer(
        core_competences: list, language: Language
    ) -> List[str]:
        return [f"Custom Core Competences ({language.code.value})"] + [
            f"- {cc.text}" for cc in core_competences
        ]

    config = RenderingConfig(
        language=ENGLISH, core_competences_renderer=custom_core_competences_renderer
    )
    renderer = BaseMarkdownRenderer(config)

    core_competences = [
        CoreCompetenceDTO(text="Leadership"),
        CoreCompetenceDTO(text="Problem Solving"),
    ]

    result = renderer._render_core_competences(core_competences, ENGLISH)
    assert result == [
        "Custom Core Competences (en)",
        "- Leadership",
        "- Problem Solving",
    ]


@pytest.fixture
def sample_cv_dto() -> CVDTO:
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
            CoreCompetenceDTO(text="Team Leadership"),
            CoreCompetenceDTO(text="Agile Development"),
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


def test_markdown_renderer_yaml_header(sample_cv_dto: CVDTO) -> None:
    """Test YAML header generation in MarkdownRenderer."""
    renderer = MarkdownRenderer()
    yaml_header = renderer._render_yaml_header(sample_cv_dto)

    assert yaml_header[0] == "---"
    assert "full_name: John Doe" in yaml_header[1]
    assert "contacts:" in yaml_header[1]
    assert "  email: john@example.com" in yaml_header[1]
    assert "  phone: '+1234567890'" in yaml_header[1]
    assert "  location: New York, NY" in yaml_header[1]
    assert yaml_header[2] == "---"
    assert yaml_header[3] == ""


def test_markdown_renderer_yaml_header_no_optional_contacts(
    sample_cv_dto: CVDTO,
) -> None:
    """Test YAML header generation when optional contacts are missing."""
    cv_dto = sample_cv_dto.model_copy(
        update={
            "personal_info": PersonalInfoDTO(
                full_name="Jane Doe",
                email=ContactDTO(
                    value="jane@example.com",
                    type="primary",
                    icon="email",
                    url="mailto:jane@example.com",
                ),
                phone=None,
                location=None,
                linkedin=None,
                github=None,
            )
        }
    )

    renderer = MarkdownRenderer()
    yaml_header = renderer._render_yaml_header(cv_dto)

    yaml_data = yaml.safe_load(yaml_header[1])
    assert yaml_data["full_name"] == "Jane Doe"
    assert "contacts" in yaml_data
    assert "email" in yaml_data["contacts"]
    assert "phone" not in yaml_data["contacts"]
    assert "location" not in yaml_data["contacts"]


def test_markdown_renderer_header_section(sample_cv_dto: CVDTO) -> None:
    """Test header section generation in MarkdownRenderer."""
    renderer = MarkdownRenderer()
    header = renderer._render_header(sample_cv_dto)

    assert header[0] == "## Senior Software Engineer"
    assert (
        header[1] == "Experienced software engineer with a focus on Python development"
    )
    assert header[2] == ""


def test_markdown_renderer_header_section_disabled() -> None:
    """Test header section generation when disabled."""
    config = RenderingConfig(language=ENGLISH, include_header=False)
    renderer = MarkdownRenderer(config)
    sample_cv_dto = CVDTO(
        personal_info=PersonalInfoDTO(full_name="John Doe"),
        title=TitleDTO(text="Software Engineer"),
        summary=SummaryDTO(text="Sample summary"),
        core_competences=[],
        experiences=[],
        education=[],
        skills=[],
        language=ENGLISH,
    )

    header = renderer._render_header(sample_cv_dto)
    assert header == []


def test_markdown_renderer_to_string(sample_cv_dto: CVDTO) -> None:
    """Test rendering CV to Markdown string."""
    renderer = MarkdownRenderer()
    md_str = renderer.render_to_string(sample_cv_dto)

    # Verify key sections are present
    assert "---" in md_str
    assert "full_name: John Doe" in md_str
    assert "contacts:" in md_str
    assert "  email: john@example.com" in md_str
    assert "  phone: '+1234567890'" in md_str
    assert "---" in md_str
    assert "## Senior Software Engineer" in md_str
    assert "## Core Competences" in md_str
    assert "- Python" in md_str
    assert "## Professional Experience" in md_str
    assert "### Senior Software Engineer | Tech Corp" in md_str
    assert "## Education" in md_str
    assert "### Master of Computer Science | State University" in md_str
    assert "## Skills" in md_str
    assert "### Programming Languages" in md_str


def test_markdown_renderer_to_file(sample_cv_dto: CVDTO, tmp_path: Path) -> None:
    """Test rendering CV to Markdown file."""
    renderer = MarkdownRenderer()
    file_path = tmp_path / "cv.md"
    renderer.render_to_file(sample_cv_dto, file_path)

    assert file_path.exists()
    content = file_path.read_text()
    assert "full_name: John Doe" in content


def test_markdown_renderer_to_file_error_handling(
    sample_cv_dto: CVDTO, tmp_path: Path
) -> None:
    """Test error handling when rendering to an invalid file path."""
    renderer = MarkdownRenderer()
    non_writable_path = tmp_path / "nonexistent" / "cv.md"

    with pytest.raises(RendererError, match="Error saving CV to Markdown file"):
        renderer.render_to_file(sample_cv_dto, non_writable_path)


def test_minimal_markdown_renderer_to_string() -> None:
    """Test rendering MinimalCVDTO to Markdown string."""
    minimal_cv_dto = MinimalCVDTO(
        title=TitleDTO(text="Software Engineer"),
        core_competences=[
            CoreCompetenceDTO(text="Leadership"),
            CoreCompetenceDTO(text="Problem Solving"),
        ],
        experiences=[
            ExperienceDTO(
                company=InstitutionDTO(name="Tech Corp"),
                position="Software Engineer",
                start_date=date(2021, 1, 1),
                end_date=None,
                description="Developing web applications",
            )
        ],
        education=[
            EducationDTO(
                university=InstitutionDTO(name="University"),
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

    assert "## Core Competences" in md_str
    assert "* Leadership" in md_str
    assert "## Professional Experience" in md_str
    assert "### Software Engineer at Tech Corp" in md_str
    assert "## Education" in md_str
    assert "### Computer Science" in md_str
    assert "Institution: University" in md_str
    assert "## Skills" in md_str
    assert "### Programming" in md_str
