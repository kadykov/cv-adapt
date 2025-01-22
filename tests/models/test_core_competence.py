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
        competence = CoreCompetence(text="Gestion")
        assert competence.text == "Gestion"

        # Too many words
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetence(text="Un deux trois quatre cinq six sept")
        assert "max_length" in str(exc_info.value)

        # Multi-line text
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetence(text="Line 1\nLine 2")
        assert "max_length" in str(exc_info.value)


def test_core_competence_language_validation() -> None:
    """Test core competence language validation."""
    with language_context(Language.FRENCH):
        # French text in French context - should pass
        CoreCompetence(text="Gestion")

        # English text in French context - should fail
        with pytest.raises(ValueError) as exc_info:
            CoreCompetence(text="Management")
        assert "language mismatch" in str(exc_info.value)


def test_core_competences_validation() -> None:
    """Test core competences collection validation."""
    with language_context(Language.FRENCH):
        # Valid competences
        competences = CoreCompetences(
            items=[
                CoreCompetence(text="Gestion de projet"),
                CoreCompetence(text="Leadership"),
                CoreCompetence(text="Communication"),
                CoreCompetence(text="Innovation"),
            ]
        )
        assert len(competences) == 4

        # Duplicate competences
        with pytest.raises(ValueError) as exc_info:
            CoreCompetences(
                items=[
                    CoreCompetence(text="Gestion de projet"),
                    CoreCompetence(text="Leadership"),
                    CoreCompetence(text="Gestion de projet"),
                ]
            )
        assert "must be unique" in str(exc_info.value)

        # Too few competences
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetences(items=[CoreCompetence(text="Gestion de projet")])
        assert "min_length" in str(exc_info.value)

        # Too many competences
        with pytest.raises(ValidationError) as exc_info:
            CoreCompetences(
                items=[CoreCompetence(text=f"Competence {i}") for i in range(10)]
            )
        assert "max_length" in str(exc_info.value)
