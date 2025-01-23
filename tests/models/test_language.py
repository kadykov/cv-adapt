"""Tests for language detection and validation."""

import pytest
from pydantic import ValidationError

from cv_adapter.models.language import (
    Language,
    LanguageValidationMixin,
    detect_language,
)


def test_language_enum_values() -> None:
    """Test that Language enum has expected values."""
    assert Language.ENGLISH == "en"
    assert Language.FRENCH == "fr"
    assert Language.GERMAN == "de"
    assert Language.SPANISH == "es"
    assert Language.ITALIAN == "it"


def test_detect_language_english() -> None:
    """Test detecting English text."""
    text = "This is a sample text in English with some technical terms."
    assert detect_language(text, min_confidence=0.7) == Language.ENGLISH


def test_detect_language_french() -> None:
    """Test detecting French text."""
    text = "C'est un exemple de texte en français avec des termes techniques."
    assert detect_language(text, min_confidence=0.7) == Language.FRENCH


def test_detect_language_german() -> None:
    """Test detecting German text."""
    text = "Dies ist ein Beispieltext auf Deutsch mit einigen technischen Begriffen."
    assert detect_language(text, min_confidence=0.7) == Language.GERMAN


def test_detect_language_spanish() -> None:
    """Test detecting Spanish text."""
    text = "Este es un texto de ejemplo en español con algunos términos técnicos."
    assert detect_language(text, min_confidence=0.7) == Language.SPANISH


def test_detect_language_italian() -> None:
    """Test detecting Italian text."""
    text = "Questo è un testo di esempio in italiano con alcuni termini tecnici."
    assert detect_language(text, min_confidence=0.7) == Language.ITALIAN


def test_detect_language_low_confidence() -> None:
    """Test that low confidence detection returns None."""
    # Use a very short text or mixed language text to test low confidence
    text = "Hi"
    assert detect_language(text, min_confidence=0.9) is None


def test_detect_language_unsupported() -> None:
    """Test that unsupported language returns None."""
    # Russian text
    text = "Это пример текста на русском языке."
    assert detect_language(text) is None


class SampleModel(LanguageValidationMixin):
    """Sample model for testing LanguageValidationMixin."""


@pytest.mark.parametrize(
    "language,text,should_pass",
    [
        # Texts with high confidence in the specified language
        (
            Language.ENGLISH,
            "This is a clear English text with multiple sentences.",
            True,
        ),
        (Language.FRENCH, "C'est un texte en français avec plusieurs phrases.", True),
        (Language.GERMAN, "Dies ist ein deutscher Text mit mehreren Sätzen.", True),
        (Language.SPANISH, "Este es un texto en español con varias oraciones.", True),
        (Language.ITALIAN, "Questo è un testo in italiano con più frasi.", True),
        # Mismatched languages (high confidence)
        (Language.ENGLISH, "C'est un texte en français.", False),
        (Language.FRENCH, "This is a clear English text.", False),
        # Short texts with potential ambiguity
        (Language.ENGLISH, "Communication", True),
        (Language.FRENCH, "Communication", True),
        (Language.ENGLISH, "Python", True),
        (Language.FRENCH, "Python", True),
        (Language.ENGLISH, "SQL", True),
        (Language.FRENCH, "SQL", True),
        # Proper nouns and technical terms
        (Language.ENGLISH, "Paris, France", True),
        (Language.FRENCH, "Paris, France", True),
        # Slightly longer ambiguous texts
        (Language.ENGLISH, "Excellent Communication Skills", True),
        (Language.FRENCH, "Compétences en Communication Excellentes", True),
        (Language.ENGLISH, "Strong Collaboration Experience", True),
        (Language.FRENCH, "Expérience de Collaboration Solide", True),
        # Technical skill descriptions
        (Language.ENGLISH, "Python Programming", True),
        (Language.FRENCH, "Programmation Python", True),
        (Language.ENGLISH, "SQL Database Management", True),
        (Language.FRENCH, "Gestion de Base de Données SQL", True),
        # Multiline text with single language
        (
            Language.ENGLISH,
            "This is a multi-line text.\nWith multiple sentences.\nTesting language detection.",
            True,
        ),
        (
            Language.FRENCH,
            "C'est un texte multi-ligne.\nAvec plusieurs phrases.\nTest de détection de langue.",
            True,
        ),
        # Mixed language multiline text (should fail)
        (
            Language.ENGLISH,
            "This is an English sentence.\nC'est une phrase en français.",
            False,
        ),
        (
            Language.FRENCH,
            "C'est une phrase en français.\nThis is an English sentence.",
            False,
        ),
        # Multiline text with different languages in each line
        (
            Language.ENGLISH,
            "Excellent Communication Skills\nPython Programming\nDatabase Management",
            True,
        ),
        (
            Language.FRENCH,
            "Compétences en Communication Excellentes\nProgrammation Python\nGestion de Base de Données",
            True,
        ),
    ],
)
def test_language_validation_mixin(
    language: Language, text: str, should_pass: bool
) -> None:
    """Test LanguageValidationMixin with various language combinations."""
    if should_pass:
        model: SampleModel = SampleModel(language=language, text=text)
        assert model.language == language
        assert model.text == text.strip()
    else:
        with pytest.raises(ValidationError) as exc_info:
            SampleModel(language=language, text=text)
        assert "Text language mismatch" in str(exc_info.value)


def test_language_validation_mixin_invalid_language() -> None:
    """Test LanguageValidationMixin with invalid language value."""
    with pytest.raises(ValidationError) as exc_info:
        SampleModel(language="invalid", text="Some text")  # type: ignore[arg-type]
    assert "Input should be 'en', 'fr', 'de', 'es' or 'it'" in str(exc_info.value)


def test_language_validation_mixin_multi_line_language_mismatch() -> None:
    """Test language validation with multi-line text and language mismatch."""
    with pytest.raises(ValidationError) as exc_info:
        SampleModel(
            language=Language.ENGLISH,
            text="C'est un texte\nen français avec\nplusieurs phrases.",
        )
    assert "Text language mismatch" in str(exc_info.value)
