"""Tests for PDF renderer."""

import subprocess
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

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
from cv_adapter.renderers import PDFRenderer, RendererError, TypstRenderer


@pytest.fixture
def sample_cv() -> CVDTO:
    """Create a sample CV for testing."""
    return CVDTO(
        personal_info=PersonalInfoDTO(
            full_name="John Doe",
            email=ContactDTO(value="john@example.com", type="Email", icon="", url=""),
            location=ContactDTO(
                value="New York, USA", type="Location", icon="", url=""
            ),
        ),
        title=TitleDTO(text="Senior Software Engineer"),
        summary=SummaryDTO(
            text="Experienced software engineer with a passion for clean code."
        ),
        core_competences=[
            CoreCompetenceDTO(text="Python Development"),
            CoreCompetenceDTO(text="System Architecture"),
        ],
        experiences=[
            ExperienceDTO(
                company=InstitutionDTO(
                    name="Tech Corp",
                    location="San Francisco",
                ),
                position="Senior Developer",
                start_date=date(2020, 1, 1),
                end_date=date(2023, 12, 31),
                description="Led development of key features.",
                technologies=["Python", "TypeScript"],
            )
        ],
        education=[
            EducationDTO(
                university=InstitutionDTO(
                    name="State University",
                    location="Boston",
                ),
                degree="BSc Computer Science",
                start_date=date(2016, 9, 1),
                end_date=date(2020, 5, 31),
            )
        ],
        skills=[
            SkillGroupDTO(
                name="Programming",
                skills=[
                    SkillDTO(text="Python"),
                    SkillDTO(text="TypeScript"),
                ],
            )
        ],
        language=ENGLISH,
    )


def test_typst_renderer(sample_cv: CVDTO) -> None:
    """Test Typst renderer produces valid Typst markup."""
    renderer = TypstRenderer()
    result = renderer.render_to_string(sample_cv)

    # Basic checks for expected Typst content
    assert "#let cv(" in result
    assert "John Doe" in result
    assert "Senior Software Engineer" in result
    assert "Tech Corp" in result
    assert "State University" in result


def test_pdf_renderer(sample_cv: CVDTO) -> None:
    """Test PDF renderer creates a PDF file."""
    renderer = PDFRenderer()

    with TemporaryDirectory() as tmp_dir:
        output_path = Path(tmp_dir) / "test.pdf"
        renderer.render_to_file(sample_cv, output_path)

        # Check if PDF file was created and has content
        assert output_path.exists()
        assert output_path.stat().st_size > 0

        # Basic check for PDF header
        with open(output_path, "rb") as f:
            header = f.read(4)
            assert header == b"%PDF"  # PDF magic number


def test_pdf_renderer_bytes_output(sample_cv: CVDTO) -> None:
    """Test PDF renderer can output PDF as bytes."""
    renderer = PDFRenderer()
    pdf_bytes = renderer.render_to_bytes(sample_cv)

    # Check we got PDF content
    assert pdf_bytes.startswith(b"%PDF")
    assert len(pdf_bytes) > 0


def test_pdf_renderer_missing_typst() -> None:
    """Test PDF renderer handles missing typst command."""
    with patch("shutil.which", return_value=None):
        with pytest.raises(RendererError) as exc_info:
            PDFRenderer()
        assert "typst command not found" in str(exc_info.value)


def test_pdf_renderer_typst_error(sample_cv: CVDTO) -> None:
    """Test PDF renderer handles typst compilation errors."""
    renderer = PDFRenderer()

    with patch("subprocess.run") as mock_run:
        # Simulate typst compilation error
        mock_run.side_effect = subprocess.CalledProcessError(
            1, ["typst"], stderr=b"Invalid syntax at line 1"
        )

        with pytest.raises(RendererError) as exc_info:
            renderer.render_to_bytes(sample_cv)

        assert "Typst compilation failed" in str(exc_info.value)
        assert "Invalid syntax" in str(exc_info.value)


def test_pdf_renderer_invalid_output_path(sample_cv: CVDTO) -> None:
    """Test PDF renderer handles invalid output path."""
    renderer = PDFRenderer()

    with pytest.raises(RendererError):
        renderer.render_to_file(sample_cv, Path("/nonexistent/directory/cv.pdf"))
