from datetime import date
from pathlib import Path

import pytest

from cv_adapter.models.cv import (
    Company,
    CoreCompetence,
    CoreCompetences,
    Education,
    Experience,
    MinimalCV,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)
from cv_adapter.models.language import Language
from cv_adapter.renderers.markdown.minimal_markdown_renderer import (
    MinimalMarkdownRenderer,
)


@pytest.fixture
def minimal_cv() -> MinimalCV:
    return MinimalCV(
        title=Title(text="Senior Software Engineer", language=Language.ENGLISH),
        core_competences=CoreCompetences(
            items=[
                CoreCompetence(text="Python Development", language=Language.ENGLISH),
                CoreCompetence(text="System Design", language=Language.ENGLISH),
                CoreCompetence(text="Team Leadership", language=Language.ENGLISH),
                CoreCompetence(text="Agile Methods", language=Language.ENGLISH),
            ],
            language=Language.ENGLISH,
        ),
        experiences=[
            Experience(
                company=Company(
                    name="Tech Corp",
                    location="San Francisco, CA",
                    description=None,
                    language=Language.ENGLISH,
                ),
                position="Senior Software Engineer",
                start_date=date(2020, 1, 1),
                end_date=None,
                description="Led development of microservices architecture",
                technologies=["Python", "Docker", "Kubernetes"],
                language=Language.ENGLISH,
            )
        ],
        education=[
            Education(
                university=University(
                    name="University of Technology",
                    location="Boston, MA",
                    description=None,
                    language=Language.ENGLISH,
                ),
                degree="Master of Computer Science",
                start_date=date(2018, 9, 1),
                end_date=date(2020, 6, 1),
                description="Focus on distributed systems and AI",
                language=Language.ENGLISH,
            )
        ],
        skills=Skills(
            groups=[
                SkillGroup(
                    name="Programming",
                    skills=[
                        Skill(text="Python", language=Language.ENGLISH),
                        Skill(text="Java", language=Language.ENGLISH),
                        Skill(text="Go", language=Language.ENGLISH),
                    ],
                    language=Language.ENGLISH,
                ),
                SkillGroup(
                    name="Tools",
                    skills=[
                        Skill(text="Docker", language=Language.ENGLISH),
                        Skill(text="Kubernetes", language=Language.ENGLISH),
                        Skill(text="Git", language=Language.ENGLISH),
                    ],
                    language=Language.ENGLISH,
                ),
            ],
            language=Language.ENGLISH,
        ),
        language=Language.ENGLISH,
    )


def test_minimal_cv_model(minimal_cv: MinimalCV) -> None:
    """Test that MinimalCV model works correctly."""
    assert len(minimal_cv.core_competences.items) == 4
    assert len(minimal_cv.experiences) == 1
    assert len(minimal_cv.education) == 1
    assert len(minimal_cv.skills.groups) == 2


def test_minimal_markdown_renderer(minimal_cv: MinimalCV, tmp_path: Path) -> None:
    """Test that MinimalMarkdownRenderer works correctly."""
    renderer = MinimalMarkdownRenderer()

    # Test render_to_string
    markdown = renderer.render_to_string(minimal_cv)
    assert "## Core Competences" in markdown
    assert "* Python Development" in markdown
    assert "## Experience" in markdown
    assert "Senior Software Engineer at Tech Corp" in markdown
    assert "## Education" in markdown
    assert "Master of Computer Science" in markdown
    assert "## Skills" in markdown
    assert "### Programming" in markdown
    assert "* Python" in markdown

    # Test render_to_file
    output_file = tmp_path / "minimal_cv.md"
    renderer.render_to_file(minimal_cv, output_file)
    assert output_file.exists()
    assert output_file.read_text() == markdown
