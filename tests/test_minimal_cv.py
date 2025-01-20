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
from cv_adapter.renderers.markdown.minimal_markdown_renderer import (
    MinimalMarkdownRenderer,
)


@pytest.fixture
def minimal_cv() -> MinimalCV:
    return MinimalCV(
        title=Title(text="Senior Software Engineer"),
        core_competences=CoreCompetences(
            items=[
                CoreCompetence(text="Python Development"),
                CoreCompetence(text="System Design"),
                CoreCompetence(text="Team Leadership"),
                CoreCompetence(text="Agile Methods"),
            ]
        ),
        experiences=[
            Experience(
                company=Company(
                    name="Tech Corp",
                    location="San Francisco, CA",
                    description=None,
                ),
                position="Senior Software Engineer",
                start_date=date(2020, 1, 1),
                end_date=None,
                description="Led development of microservices architecture",
                technologies=["Python", "Docker", "Kubernetes"],
            )
        ],
        education=[
            Education(
                university=University(
                    name="University of Technology",
                    location="Boston, MA",
                    description=None,
                ),
                degree="Master of Computer Science",
                start_date=date(2018, 9, 1),
                end_date=date(2020, 6, 1),
                description="Focus on distributed systems and AI",
            )
        ],
        skills=Skills(
            groups=[
                SkillGroup(
                    name="Programming",
                    skills=[
                        Skill(text="Python"),
                        Skill(text="Java"),
                        Skill(text="Go"),
                    ],
                ),
                SkillGroup(
                    name="Tools",
                    skills=[
                        Skill(text="Docker"),
                        Skill(text="Kubernetes"),
                        Skill(text="Git"),
                    ],
                ),
            ]
        ),
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
