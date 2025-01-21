"""Tests for CV language consistency validation."""

from datetime import date

import pytest
from pydantic import ValidationError

from cv_adapter.models.cv import (
    CV,
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
from cv_adapter.models.personal_info import PersonalInfo
from cv_adapter.models.summary import CVSummary


@pytest.fixture
def en_title() -> Title:
    """Create a sample English title."""
    return Title(language=Language.ENGLISH, text="Software Engineer")


@pytest.fixture
def fr_title() -> Title:
    """Create a sample French title."""
    return Title(language=Language.FRENCH, text="Ingénieur Logiciel")


@pytest.fixture
def en_core_competences() -> CoreCompetences:
    """Create sample English core competences."""
    return CoreCompetences(
        language=Language.ENGLISH,
        items=[
            CoreCompetence(language=Language.ENGLISH, text="Software Development"),
            CoreCompetence(language=Language.ENGLISH, text="Team Leadership"),
            CoreCompetence(language=Language.ENGLISH, text="Project Management"),
            CoreCompetence(language=Language.ENGLISH, text="System Architecture"),
        ],
    )


@pytest.fixture
def fr_core_competences() -> CoreCompetences:
    """Create sample French core competences."""
    return CoreCompetences(
        language=Language.FRENCH,
        items=[
            CoreCompetence(language=Language.FRENCH, text="Développement Logiciel"),
            CoreCompetence(language=Language.FRENCH, text="Leadership d'Équipe"),
            CoreCompetence(language=Language.FRENCH, text="Gestion de Projet"),
            CoreCompetence(language=Language.FRENCH, text="Architecture Système"),
        ],
    )


@pytest.fixture
def en_experience() -> Experience:
    """Create a sample English experience."""
    return Experience(
        company=Company(
            language=Language.ENGLISH,
            name="Tech Corp",
            description="Leading technology company",
            location="London",
        ),
        position="Senior Developer",
        start_date=date(2020, 1, 1),
        end_date=date(2023, 12, 31),
        description="Led development of core platform features",
        technologies=["Python", "TypeScript"],
        language=Language.ENGLISH,
    )


@pytest.fixture
def fr_experience() -> Experience:
    """Create a sample French experience."""
    return Experience(
        company=Company(
            language=Language.FRENCH,
            name="Tech Corp France",
            description="Entreprise technologique leader",
            location="Paris",
        ),
        position="Développeur Senior",
        start_date=date(2020, 1, 1),
        end_date=date(2023, 12, 31),
        description="Direction du développement des fonctionnalités principales",
        technologies=["Python", "TypeScript"],
        language=Language.FRENCH,
    )


@pytest.fixture
def en_education() -> Education:
    """Create a sample English education."""
    return Education(
        university=University(
            language=Language.ENGLISH,
            name="Tech University",
            description="Leading technical university",
            location="London",
        ),
        degree="Master of Computer Science",
        start_date=date(2018, 9, 1),
        end_date=date(2020, 6, 30),
        description="Specialized in Software Engineering",
        language=Language.ENGLISH,
    )


@pytest.fixture
def fr_education() -> Education:
    """Create a sample French education."""
    return Education(
        university=University(
            language=Language.FRENCH,
            name="Université de Technologie",
            description="Université technique de premier plan",
            location="Paris",
        ),
        degree="Master en Informatique",
        start_date=date(2018, 9, 1),
        end_date=date(2020, 6, 30),
        description="Spécialisation en Génie Logiciel",
        language=Language.FRENCH,
    )


@pytest.fixture
def en_skills() -> Skills:
    """Create sample English skills."""
    return Skills(
        language=Language.ENGLISH,
        groups=[
            SkillGroup(
                language=Language.ENGLISH,
                name="Programming",
                skills=[
                    Skill(language=Language.ENGLISH, text="Python"),
                    Skill(language=Language.ENGLISH, text="TypeScript"),
                ],
            ),
        ],
    )


@pytest.fixture
def fr_skills() -> Skills:
    """Create sample French skills."""
    return Skills(
        language=Language.FRENCH,
        groups=[
            SkillGroup(
                language=Language.FRENCH,
                name="Programmation",
                skills=[
                    Skill(language=Language.FRENCH, text="Python"),
                    Skill(language=Language.FRENCH, text="TypeScript"),
                ],
            ),
        ],
    )


@pytest.fixture
def en_summary() -> CVSummary:
    """Create a sample English summary."""
    return CVSummary(
        language=Language.ENGLISH,
        text="Experienced software engineer with focus on web technologies",
    )


@pytest.fixture
def fr_summary() -> CVSummary:
    """Create a sample French summary."""
    return CVSummary(
        language=Language.FRENCH,
        text="Ingénieur logiciel expérimenté spécialisé en technologies web",
    )


@pytest.fixture
def personal_info() -> PersonalInfo:
    """Create sample personal info (language-independent)."""
    return PersonalInfo(
        full_name="John Doe",
        contacts={"email": "john@example.com", "phone": "+1234567890"},
    )


def test_minimal_cv_consistent_language(
    en_title: Title,
    en_core_competences: CoreCompetences,
    en_experience: Experience,
    en_education: Education,
    en_skills: Skills,
) -> None:
    """Test MinimalCV creation with consistent language."""
    cv = MinimalCV(
        title=en_title,
        core_competences=en_core_competences,
        experiences=[en_experience],
        education=[en_education],
        skills=en_skills,
        language=Language.ENGLISH,
    )
    assert cv.language == Language.ENGLISH


def test_minimal_cv_inconsistent_title(
    fr_title: Title,
    en_core_competences: CoreCompetences,
    en_experience: Experience,
    en_education: Education,
    en_skills: Skills,
) -> None:
    """Test MinimalCV creation with inconsistent title language."""
    with pytest.raises(ValidationError) as exc_info:
        MinimalCV(
            title=fr_title,
            core_competences=en_core_competences,
            experiences=[en_experience],
            education=[en_education],
            skills=en_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_minimal_cv_inconsistent_core_competences(
    en_title: Title,
    fr_core_competences: CoreCompetences,
    en_experience: Experience,
    en_education: Education,
    en_skills: Skills,
) -> None:
    """Test MinimalCV creation with inconsistent core competences language."""
    with pytest.raises(ValidationError) as exc_info:
        MinimalCV(
            title=en_title,
            core_competences=fr_core_competences,
            experiences=[en_experience],
            education=[en_education],
            skills=en_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_minimal_cv_inconsistent_experience(
    en_title: Title,
    en_core_competences: CoreCompetences,
    fr_experience: Experience,
    en_education: Education,
    en_skills: Skills,
) -> None:
    """Test MinimalCV creation with inconsistent experience language."""
    with pytest.raises(ValidationError) as exc_info:
        MinimalCV(
            title=en_title,
            core_competences=en_core_competences,
            experiences=[fr_experience],
            education=[en_education],
            skills=en_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_minimal_cv_inconsistent_education(
    en_title: Title,
    en_core_competences: CoreCompetences,
    en_experience: Experience,
    fr_education: Education,
    en_skills: Skills,
) -> None:
    """Test MinimalCV creation with inconsistent education language."""
    with pytest.raises(ValidationError) as exc_info:
        MinimalCV(
            title=en_title,
            core_competences=en_core_competences,
            experiences=[en_experience],
            education=[fr_education],
            skills=en_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_minimal_cv_inconsistent_skills(
    en_title: Title,
    en_core_competences: CoreCompetences,
    en_experience: Experience,
    en_education: Education,
    fr_skills: Skills,
) -> None:
    """Test MinimalCV creation with inconsistent skills language."""
    with pytest.raises(ValidationError) as exc_info:
        MinimalCV(
            title=en_title,
            core_competences=en_core_competences,
            experiences=[en_experience],
            education=[en_education],
            skills=fr_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_cv_consistent_language(
    personal_info: PersonalInfo,
    en_title: Title,
    en_summary: CVSummary,
    en_core_competences: CoreCompetences,
    en_experience: Experience,
    en_education: Education,
    en_skills: Skills,
) -> None:
    """Test CV creation with consistent language."""
    cv = CV(
        personal_info=personal_info,
        title=en_title,
        summary=en_summary,
        core_competences=en_core_competences,
        experiences=[en_experience],
        education=[en_education],
        skills=en_skills,
        language=Language.ENGLISH,
    )
    assert cv.language == Language.ENGLISH


def test_cv_inconsistent_title(
    personal_info: PersonalInfo,
    fr_title: Title,
    en_summary: CVSummary,
    en_core_competences: CoreCompetences,
    en_experience: Experience,
    en_education: Education,
    en_skills: Skills,
) -> None:
    """Test CV creation with inconsistent title language."""
    with pytest.raises(ValidationError) as exc_info:
        CV(
            personal_info=personal_info,
            title=fr_title,
            summary=en_summary,
            core_competences=en_core_competences,
            experiences=[en_experience],
            education=[en_education],
            skills=en_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_cv_inconsistent_summary(
    personal_info: PersonalInfo,
    en_title: Title,
    fr_summary: CVSummary,
    en_core_competences: CoreCompetences,
    en_experience: Experience,
    en_education: Education,
    en_skills: Skills,
) -> None:
    """Test CV creation with inconsistent summary language."""
    with pytest.raises(ValidationError) as exc_info:
        CV(
            personal_info=personal_info,
            title=en_title,
            summary=fr_summary,
            core_competences=en_core_competences,
            experiences=[en_experience],
            education=[en_education],
            skills=en_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_cv_inconsistent_core_competences(
    personal_info: PersonalInfo,
    en_title: Title,
    en_summary: CVSummary,
    fr_core_competences: CoreCompetences,
    en_experience: Experience,
    en_education: Education,
    en_skills: Skills,
) -> None:
    """Test CV creation with inconsistent core competences language."""
    with pytest.raises(ValidationError) as exc_info:
        CV(
            personal_info=personal_info,
            title=en_title,
            summary=en_summary,
            core_competences=fr_core_competences,
            experiences=[en_experience],
            education=[en_education],
            skills=en_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_cv_inconsistent_experience(
    personal_info: PersonalInfo,
    en_title: Title,
    en_summary: CVSummary,
    en_core_competences: CoreCompetences,
    fr_experience: Experience,
    en_education: Education,
    en_skills: Skills,
) -> None:
    """Test CV creation with inconsistent experience language."""
    with pytest.raises(ValidationError) as exc_info:
        CV(
            personal_info=personal_info,
            title=en_title,
            summary=en_summary,
            core_competences=en_core_competences,
            experiences=[fr_experience],
            education=[en_education],
            skills=en_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_cv_inconsistent_education(
    personal_info: PersonalInfo,
    en_title: Title,
    en_summary: CVSummary,
    en_core_competences: CoreCompetences,
    en_experience: Experience,
    fr_education: Education,
    en_skills: Skills,
) -> None:
    """Test CV creation with inconsistent education language."""
    with pytest.raises(ValidationError) as exc_info:
        CV(
            personal_info=personal_info,
            title=en_title,
            summary=en_summary,
            core_competences=en_core_competences,
            experiences=[en_experience],
            education=[fr_education],
            skills=en_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)


def test_cv_inconsistent_skills(
    personal_info: PersonalInfo,
    en_title: Title,
    en_summary: CVSummary,
    en_core_competences: CoreCompetences,
    en_experience: Experience,
    en_education: Education,
    fr_skills: Skills,
) -> None:
    """Test CV creation with inconsistent skills language."""
    with pytest.raises(ValidationError) as exc_info:
        CV(
            personal_info=personal_info,
            title=en_title,
            summary=en_summary,
            core_competences=en_core_competences,
            experiences=[en_experience],
            education=[en_education],
            skills=fr_skills,
            language=Language.ENGLISH,
        )
    assert "All CV components must use the same language" in str(exc_info.value)
