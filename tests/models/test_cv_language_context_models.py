"""Tests for CV language context models."""

import pytest
from datetime import date
from pydantic import ValidationError

from cv_adapter.models.language_context_models import (
    Company,
    CoreCompetence,
    CoreCompetences,
    Education,
    Experience,
    Institution,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)
from cv_adapter.models.language import Language
from cv_adapter.models.language_context import language_context


def test_institution_validation() -> None:
    """Test institution model validation."""
    with language_context(Language.FRENCH):
        # Valid French institution
        institution = Institution(
            name="Société Technologique",
            description="Entreprise de développement logiciel",
            location="Paris, La France"
        )
        assert institution.name == "Société Technologique"

        # Invalid multi-line name
        with pytest.raises(ValidationError) as exc_info:
            Institution(
                name="Société\nTechnologique",
                description="Entreprise de développement logiciel",
                location="Paris, France"
            )
        assert "field must be a single line" in str(exc_info.value)

        # English text in French context should fail
        with pytest.raises(ValueError) as exc_info:
            Institution(name="Tech Company")
        assert "language mismatch" in str(exc_info.value)


def test_experience_validation() -> None:
    """Test experience model validation."""
    with language_context(Language.FRENCH):
        # Valid French experience
        company = Company(name="Société Technologique")
        experience = Experience(
            company=company,
            position="Développeur Senior",
            start_date=date(2020, 1, 1),
            end_date=date(2023, 12, 31),
            description="Développement de solutions logicielles innovantes",
            technologies=["Python", "Django"]
        )
        assert experience.position == "Développeur Senior"

        # English text in French context should fail
        with pytest.raises(ValueError) as exc_info:
            Experience(
                company=company,
                position="Senior Developer",
                start_date=date(2020, 1, 1),
                description="Developing innovative software solutions",
                technologies=["Python", "Django"]
            )
        assert "language mismatch" in str(exc_info.value)


def test_education_validation() -> None:
    """Test education model validation."""
    with language_context(Language.FRENCH):
        # Valid French education
        university = University(name="Université de Paris")
        education = Education(
            university=university,
            degree="Master en Informatique",
            start_date=date(2018, 9, 1),
            end_date=date(2020, 6, 30),
            description="Spécialisation en développement logiciel"
        )
        assert education.degree == "Master en Informatique"

        # Invalid multi-line degree
        with pytest.raises(ValidationError) as exc_info:
            Education(
                university=university,
                degree="Master\nen Informatique",
                start_date=date(2018, 9, 1),
                description="Spécialisation en développement logiciel"
            )
        assert "degree must be a single line" in str(exc_info.value)


def test_title_validation() -> None:
    """Test title model validation."""
    with language_context(Language.FRENCH):
        # Valid French title
        title = Title(text="Développeur Logiciel\nExpérimenté")
        assert title.text == "Développeur Logiciel\nExpérimenté"

        # Too many lines
        with pytest.raises(ValidationError) as exc_info:
            Title(text="Développeur\nLogiciel\nExpérimenté")
        assert "title must not exceed 2 lines" in str(exc_info.value)

        # English text in French context should fail
        with pytest.raises(ValueError) as exc_info:
            Title(text="Senior Software Developer")
        assert "language mismatch" in str(exc_info.value)


def test_skill_validation() -> None:
    """Test skill model validation."""
    with language_context(Language.FRENCH):
        # Valid French skill
        skill = Skill(text="Gestion de projet")
        assert skill.text == "Gestion de projet"

        # Multi-line skill
        with pytest.raises(ValidationError) as exc_info:
            Skill(text="Gestion\nde projet")
        assert "skill must be a single line" in str(exc_info.value)

        # English text in French context should fail
        with pytest.raises(ValueError) as exc_info:
            Skill(text="Project Management")
        assert "language mismatch" in str(exc_info.value)


def test_skill_group_validation() -> None:
    """Test skill group model validation."""
    with language_context(Language.FRENCH):
        # Valid French skill group
        skill_group = SkillGroup(
            name="Compétences Techniques",
            skills=[
                Skill(text="Python"),
                Skill(text="Django"),
                Skill(text="SQL")
            ]
        )
        assert skill_group.name == "Compétences Techniques"

        # Duplicate skills
        with pytest.raises(ValidationError) as exc_info:
            SkillGroup(
                name="Compétences Techniques",
                skills=[
                    Skill(text="Python"),
                    Skill(text="Python"),
                    Skill(text="Django")
                ]
            )
        assert "skills within a group must be unique" in str(exc_info.value)

        # Multi-line group name
        with pytest.raises(ValidationError) as exc_info:
            SkillGroup(
                name="Compétences\nTechniques",
                skills=[
                    Skill(text="Python"),
                    Skill(text="Django"),
                    Skill(text="SQL")
                ]
            )
        assert "group name must be a single line" in str(exc_info.value)


def test_skills_validation() -> None:
    """Test skills model validation."""
    with language_context(Language.FRENCH):
        # Valid skills
        skills = Skills(
            groups=[
                SkillGroup(
                    name="Compétences Techniques",
                    skills=[
                        Skill(text="Python"),
                        Skill(text="Django")
                    ]
                ),
                SkillGroup(
                    name="Compétences Interpersonnelles",
                    skills=[
                        Skill(text="Communication"),
                        Skill(text="Collaboration")
                    ]
                )
            ]
        )
        assert len(skills.groups) == 2

        # Duplicate skills across groups
        with pytest.raises(ValidationError) as exc_info:
            Skills(
                groups=[
                    SkillGroup(
                        name="Compétences Techniques",
                        skills=[
                            Skill(text="Python"),
                            Skill(text="Django")
                        ]
                    ),
                    SkillGroup(
                        name="Compétences Interpersonnelles",
                        skills=[
                            Skill(text="Python"),
                            Skill(text="Communication")
                        ]
                    )
                ]
            )
        assert "skills must be unique across all groups" in str(exc_info.value)


def test_core_competence_validation() -> None:
    """Test core competence model validation."""
    with language_context(Language.FRENCH):
        # Valid French core competence
        competence = CoreCompetence(text="Gestion de projet")
        assert competence.text == "Gestion de projet"

        # Too many words
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetence(
                text=(
                    "Un deux trois quatre cinq six sept huit "
                    "neuf dix onze douze treize quatorze"
                )
            )
        assert "core competence must not exceed" in str(exc_info.value)

        # Multi-line text
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetence(text="Gestion de projet\nLeadership")
        assert "core competence must be a single line" in str(exc_info.value)

        # English text in French context should fail
        with pytest.raises(ValueError) as exc_info:
            CoreCompetence(text="Project Management")
        assert "language mismatch" in str(exc_info.value)


def test_core_competences_validation() -> None:
    """Test core competences collection validation."""
    with language_context(Language.FRENCH):
        # Valid competences
        competences = CoreCompetences(
            items=[
                CoreCompetence(text="Gestion de projet"),
                CoreCompetence(text="Développement logiciel"),
                CoreCompetence(text="Travail en équipe"),
                CoreCompetence(text="Créativité"),
            ]
        )
        assert len(competences) == 4

        # Duplicate competences
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetences(
                items=[
                    CoreCompetence(text="Gestion de projet"),
                    CoreCompetence(text="Développement logiciel"),
                    CoreCompetence(text="Travail en équipe"),
                    CoreCompetence(text="Gestion de projet"),
                ]
            )
        assert "core competences must be unique" in str(exc_info.value)

        # Too few competences
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetences(items=[CoreCompetence(text="Gestion de projet")])
        assert "too_short" in str(exc_info.value)

        # Too many competences
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetences(
                items=[CoreCompetence(text=f"Compétence {i}") for i in range(10)]
            )
        assert "too_long" in str(exc_info.value)
