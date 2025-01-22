"""Tests for core competence models."""

import pytest
from pydantic import ValidationError

from cv_adapter.models.core_competence import CoreCompetence, CoreCompetences
from cv_adapter.models.language import Language
from cv_adapter.models.language_context import language_context


def test_core_competence_validation() -> None:
    """Test core competence text validation."""
    with language_context(Language.FRENCH):
        # Valid competence
        competence = CoreCompetence(text="Gestion de projet")
        assert competence.text == "Gestion de projet"

        # Too many words
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetence(text="Un deux trois quatre cinq six sept huit neuf dix onze douze treize quatorze")
        assert "core competence must not exceed" in str(exc_info.value)

        # Multi-line text
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetence(text="Gestion de projet\nLeadership")
        assert "core competence must be a single line" in str(exc_info.value)


def test_core_competence_language_validation() -> None:
    """Test core competence language validation."""
    with language_context(Language.FRENCH):
        # French text in French context - should pass
        CoreCompetence(text="Gestion de projet")

        # English text in French context - should fail
        with pytest.raises(ValueError) as exc_info:
            CoreCompetence(text="Project Management and Leadership")
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
        with pytest.raises(ValueError) as exc_info:
            CoreCompetences(
                items=[
                    CoreCompetence(text="Gestion de projet"),
                    CoreCompetence(text="Développement logiciel"),
                    CoreCompetence(text="Travail en équipe"),
                    CoreCompetence(text="Gestion de projet"),
                ]
            )
        assert "must be unique" in str(exc_info.value)

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
