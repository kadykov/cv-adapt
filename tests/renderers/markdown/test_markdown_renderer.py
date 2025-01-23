from datetime import date
from pathlib import Path

import pytest

from cv_adapter.dto.cv import (
    CVDTO,
    PersonalInfoDTO,
    ContactDTO,
    TitleDTO,
    SummaryDTO,
    CoreCompetencesDTO,
    CoreCompetenceDTO,
    ExperienceDTO,
    InstitutionDTO,
    EducationDTO,
    SkillsDTO,
    SkillGroupDTO,
    SkillDTO,
)
from cv_adapter.models.language import Language
from cv_adapter.renderers import MarkdownRenderer, RendererError


@pytest.fixture
def sample_cv_dto() -> CVDTO:
    return CVDTO(
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(
                value="john@example.com",
                type="primary",
                icon="email",
                url="mailto:john@example.com"
            ),
            phone=ContactDTO(
                value="+1234567890",
                type="primary",
                icon="phone",
                url="tel:+1234567890"
            )
        ),
        title=TitleDTO(text="Senior Software Engineer"),
        summary=SummaryDTO(text="Experienced software engineer with a focus on Python development"),
        core_competences=CoreCompetencesDTO(
            items=[
                CoreCompetenceDTO(text="Python"),
                CoreCompetenceDTO(text="Software Architecture"),
                CoreCompetenceDTO(text="Team Leadership"),
                CoreCompetenceDTO(text="Agile Development"),
            ]
        ),
        experiences=[
            ExperienceDTO(
                company=InstitutionDTO(
                    name="Tech Corp",
                    location="New York"
                ),
                position="Senior Software Engineer",
                start_date=date(2020, 1, 1),
                end_date=None,
                description="Leading backend development team",
                technologies=["Python", "FastAPI", "PostgreSQL"]
            )
        ],
        education=[
            EducationDTO(
                university=InstitutionDTO(
                    name="State University",
                    location="Boston"
                ),
                degree="Master of Computer Science",
                start_date=date(2018, 9, 1),
                end_date=date(2020, 6, 1),
                description="Focus on distributed systems"
            )
        ],
        skills=SkillsDTO(
            groups=[
                SkillGroupDTO(
                    name="Programming Languages",
                    skills=[
                        SkillDTO(text="Python"),
                        SkillDTO(text="JavaScript")
                    ]
                )
            ]
        ),
        language=Language.ENGLISH
    )


def test_markdown_renderer_to_string(sample_cv_dto: CVDTO) -> None:
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
    renderer = MarkdownRenderer()
    file_path = tmp_path / "cv.md"
    renderer.render_to_file(sample_cv_dto, file_path)

    assert file_path.exists()
    content = file_path.read_text()
    assert "full_name: John Doe" in content


def test_markdown_renderer_error_handling(sample_cv_dto: CVDTO, tmp_path: Path) -> None:
    renderer = MarkdownRenderer()
    non_writable_path = tmp_path / "nonexistent" / "cv.md"

    with pytest.raises(RendererError):
        renderer.render_to_file(sample_cv_dto, non_writable_path)
