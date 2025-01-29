"""Tests for the DTO mapper."""

from datetime import date
from typing import Any, Callable, Dict

from cv_adapter.dto.cv import (
    CVDTO,
    CoreCompetenceDTO,
    EducationDTO,
    ExperienceDTO,
    InstitutionDTO,
    MinimalCVDTO,
    SkillDTO,
    SkillGroupDTO,
    SummaryDTO,
    TitleDTO,
)
from cv_adapter.dto.language import ENGLISH
from cv_adapter.dto.mapper import (
    map_core_competence,
    map_core_competences,
    map_cv,
    map_education,
    map_experience,
    map_institution,
    map_minimal_cv,
    map_skill,
    map_skill_group,
    map_skills,
    map_summary,
    map_title,
)
from cv_adapter.models import personal_info as pi
from cv_adapter.models.components import (
    Company,
    CoreCompetence,
    CoreCompetences,
    CVSummary,
    Education,
    Experience,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)
from cv_adapter.models.context import language_context


def with_language_context(func: Callable[..., Any]) -> Callable[..., Any]:
    """Decorator to wrap a test function with a language context."""

    def wrapper(*args: Any, **kwargs: Any) -> Any:
        with language_context(ENGLISH):
            return func(*args, **kwargs)

    return wrapper


@with_language_context
def test_map_core_competence() -> None:
    """Test mapping a single core competence."""
    core_competence = CoreCompetence(text="Innovative problem-solving")
    dto = map_core_competence(core_competence)

    assert isinstance(dto, CoreCompetenceDTO)
    assert dto.text == "Innovative problem-solving"


@with_language_context
def test_map_core_competences() -> None:
    """Test mapping a collection of core competences."""
    core_competences = CoreCompetences(
        items=[
            CoreCompetence(text="Innovative problem-solving"),
            CoreCompetence(text="Strategic planning"),
            CoreCompetence(text="Cross-functional collaboration"),
            CoreCompetence(text="Technical leadership"),
        ]
    )
    dto = map_core_competences(core_competences)

    assert isinstance(dto, list)
    assert len(dto) == 4
    assert dto[0].text == "Innovative problem-solving"
    assert dto[1].text == "Strategic planning"
    assert dto[2].text == "Cross-functional collaboration"
    assert dto[3].text == "Technical leadership"


@with_language_context
def test_map_institution() -> None:
    """Test mapping an institution."""
    institution = University(
        name="Tech Innovations Inc.",
        description="Leading technology company",
        location="San Francisco, CA",
    )
    dto = map_institution(institution)

    assert isinstance(dto, InstitutionDTO)
    assert dto.name == "Tech Innovations Inc."
    assert dto.description == "Leading technology company"
    assert dto.location == "San Francisco, CA"


@with_language_context
def test_map_experience() -> None:
    """Test mapping a professional experience."""
    experience = Experience(
        company=Company(
            name="Tech Innovations Inc.",
            description="Company description",
            location="Location",
        ),
        position="Senior Software Engineer",
        start_date=date(2020, 1, 1),
        end_date=date(2023, 12, 31),
        description="Led development of innovative software solutions",
        technologies=["Python", "React", "AWS"],
    )
    dto = map_experience(experience)

    assert isinstance(dto, ExperienceDTO)
    assert dto.position == "Senior Software Engineer"
    assert dto.start_date == date(2020, 1, 1)
    assert dto.end_date == date(2023, 12, 31)
    assert dto.description == "Led development of innovative software solutions"
    assert dto.technologies == ["Python", "React", "AWS"]
    assert dto.company.name == "Tech Innovations Inc."


@with_language_context
def test_map_education() -> None:
    """Test mapping an educational experience."""
    education = Education(
        university=University(
            name="Stanford University",
            description="University description",
            location="Location",
        ),
        degree="Master of Science in Computer Science",
        start_date=date(2018, 9, 1),
        end_date=date(2020, 6, 30),
        description="Advanced software engineering and machine learning",
    )
    dto = map_education(education)

    assert isinstance(dto, EducationDTO)
    assert dto.degree == "Master of Science in Computer Science"
    assert dto.start_date == date(2018, 9, 1)
    assert dto.end_date == date(2020, 6, 30)
    assert dto.description == "Advanced software engineering and machine learning"
    assert dto.university.name == "Stanford University"


@with_language_context
def test_map_skill() -> None:
    """Test mapping a single skill."""
    skill = Skill(text="Python")
    dto = map_skill(skill)

    assert isinstance(dto, SkillDTO)
    assert dto.text == "Python"


@with_language_context
def test_map_skill_group() -> None:
    """Test mapping a skill group."""
    skill_group = SkillGroup(
        name="Programming Languages",
        skills=[Skill(text="Python"), Skill(text="JavaScript")],
    )
    dto = map_skill_group(skill_group)

    assert isinstance(dto, SkillGroupDTO)
    assert dto.name == "Programming Languages"
    assert len(dto.skills) == 2
    assert dto.skills[0].text == "Python"
    assert dto.skills[1].text == "JavaScript"


@with_language_context
def test_map_skills() -> None:
    """Test mapping skills."""
    skills = Skills(
        groups=[
            SkillGroup(
                name="Programming Languages",
                skills=[Skill(text="Python"), Skill(text="JavaScript")],
            ),
            SkillGroup(
                name="Frameworks",
                skills=[Skill(text="React"), Skill(text="Django")],
            ),
        ]
    )
    dto = map_skills(skills)

    assert isinstance(dto, list)
    assert len(dto) == 2
    assert dto[0].name == "Programming Languages"
    assert dto[1].name == "Frameworks"


@with_language_context
def test_map_title() -> None:
    """Test mapping a professional title."""
    title = Title(text="Innovative Software Engineer")
    dto = map_title(title)

    assert isinstance(dto, TitleDTO)
    assert dto.text == "Innovative Software Engineer"


@with_language_context
def test_map_summary() -> None:
    """Test mapping a summary."""
    summary = CVSummary(
        text="Experienced software engineer with a passion for innovative solutions",
    )
    dto = map_summary(summary)

    assert isinstance(dto, SummaryDTO)
    assert dto.text == summary.text


def create_minimal_cv_dict() -> Dict[str, Any]:
    """Helper function to create a minimal CV dictionary."""
    with language_context(ENGLISH):
        return {
            "title": Title(text="Innovative Software Engineer"),
            "core_competences": CoreCompetences(
                items=[
                    CoreCompetence(text="Innovative problem-solving"),
                    CoreCompetence(text="Strategic planning"),
                    CoreCompetence(text="Cross-functional collaboration"),
                    CoreCompetence(text="Technical leadership"),
                ]
            ),
            "experiences": [
                Experience(
                    company=Company(
                        name="Tech Innovations Inc.",
                        description="Innovative tech company",
                        location="San Francisco, CA",
                    ),
                    position="Senior Software Engineer",
                    start_date=date(2020, 1, 1),
                    end_date=date(2023, 12, 31),
                    description="Led development of innovative solutions",
                    technologies=["Python", "React"],
                )
            ],
            "education": [
                Education(
                    university=University(
                        name="Stanford University",
                        description="Top-tier research university",
                        location="Stanford, CA",
                    ),
                    degree="Master of Science in Computer Science",
                    start_date=date(2018, 9, 1),
                    end_date=date(2020, 6, 30),
                    description="Advanced software engineering",
                )
            ],
            "skills": Skills(
                groups=[
                    SkillGroup(
                        name="Programming Languages",
                        skills=[Skill(text="Python"), Skill(text="JavaScript")],
                    )
                ]
            ),
            "language": ENGLISH,
        }


@with_language_context
def test_map_minimal_cv() -> None:
    """Test mapping a minimal CV."""
    minimal_cv_dict = create_minimal_cv_dict()
    dto = map_minimal_cv(minimal_cv_dict)

    assert isinstance(dto, MinimalCVDTO)
    assert dto.title.text == "Innovative Software Engineer"
    assert len(dto.core_competences) == 4
    assert dto.core_competences[0].text == "Innovative problem-solving"
    assert dto.core_competences[1].text == "Strategic planning"
    assert dto.core_competences[2].text == "Cross-functional collaboration"
    assert dto.core_competences[3].text == "Technical leadership"
    assert len(dto.experiences) == 1
    assert dto.experiences[0].position == "Senior Software Engineer"
    assert len(dto.education) == 1
    assert dto.education[0].degree == "Master of Science in Computer Science"
    assert len(dto.skills) == 1
    assert dto.skills[0].name == "Programming Languages"
    assert dto.language == ENGLISH


@with_language_context
def test_map_cv() -> None:
    """Test mapping a complete CV."""
    cv_dict = {
        **create_minimal_cv_dict(),
        "personal_info": pi.PersonalInfo(
            full_name="John Doe",
            contacts={"email": "john.doe@example.com", "phone": "+1234567890"},
        ),
        "summary": CVSummary(
            text=(
                "Experienced software engineer with a passion for innovative solutions"
            ),
        ),
    }

    dto = map_cv(cv_dict)

    assert isinstance(dto, CVDTO)
    assert dto.personal_info.full_name == "John Doe"
    assert dto.personal_info.email is not None
    assert dto.personal_info.email.value == "john.doe@example.com"
    assert dto.summary.text == (
        "Experienced software engineer with a passion for innovative solutions"
    )
    assert dto.language == ENGLISH
