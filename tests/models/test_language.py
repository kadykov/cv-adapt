"""Tests for language detection and validation."""

import pytest
from pydantic import ValidationError

from cv_adapter.dto.language import (
    ENGLISH,
    FRENCH,
    GERMAN,
    ITALIAN,
    SPANISH,
    Language,
    LanguageCode,
)
from cv_adapter.models.language import (
    LanguageValidationMixin,
    detect_language,
)


def test_language_enum_values() -> None:
    """Test that Language enum has expected values."""
    assert str(ENGLISH) == "en"
    assert str(FRENCH) == "fr"
    assert str(GERMAN) == "de"
    assert str(SPANISH) == "es"
    assert str(ITALIAN) == "it"


def test_detect_language_english() -> None:
    """Test detecting English text."""
    text = "This is a sample text in English with some technical terms."
    assert detect_language(text, min_confidence=0.7) == ENGLISH


def test_detect_language_french() -> None:
    """Test detecting French text."""
    text = "C'est un exemple de texte en français avec des termes techniques."
    assert detect_language(text, min_confidence=0.7) == FRENCH


def test_detect_language_german() -> None:
    """Test detecting German text."""
    text = "Dies ist ein Beispieltext auf Deutsch mit einigen technischen Begriffen."
    assert detect_language(text, min_confidence=0.7) == GERMAN


def test_detect_language_spanish() -> None:
    """Test detecting Spanish text."""
    text = "Este es un texto de ejemplo en español con algunos términos técnicos."
    assert detect_language(text, min_confidence=0.7) == SPANISH


def test_detect_language_italian() -> None:
    """Test detecting Italian text."""
    text = "Questo è un testo di esempio in italiano con alcuni termini tecnici."
    assert detect_language(text, min_confidence=0.7) == ITALIAN


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
            ENGLISH,
            "This is a clear English text with multiple sentences.",
            True,
        ),
        (FRENCH, "C'est un texte en français avec plusieurs phrases.", True),
        (GERMAN, "Dies ist ein deutscher Text mit mehreren Sätzen.", True),
        (SPANISH, "Este es un texto en español con varias oraciones.", True),
        (ITALIAN, "Questo è un testo in italiano con più frasi.", True),
        # Mismatched languages (high confidence)
        (ENGLISH, "C'est un texte en français.", False),
        (FRENCH, "This is a clear English text.", False),
        # Short texts with potential ambiguity
        (ENGLISH, "Communication", True),
        (FRENCH, "Communication", True),
        (ENGLISH, "Python", True),
        (FRENCH, "Python", True),
        (ENGLISH, "SQL", True),
        (FRENCH, "SQL", True),
        # Proper nouns and technical terms
        (ENGLISH, "Paris, France", True),
        (FRENCH, "Paris, France", True),
        # Slightly longer ambiguous texts
        (ENGLISH, "Excellent Communication Skills", True),
        (FRENCH, "Compétences en Communication Excellentes", True),
        (ENGLISH, "Strong Collaboration Experience", True),
        (FRENCH, "Expérience de Collaboration Solide", True),
        # Technical skill descriptions
        (ENGLISH, "Python Programming", True),
        (FRENCH, "Programmation Python", True),
        (ENGLISH, "SQL Database Management", True),
        (FRENCH, "Gestion de Base de Données SQL", True),
        # Multiline text with single language
        (
            ENGLISH,
            (
                "This is a multi-line text.\n"
                "With multiple sentences.\n"
                "Testing language detection."
            ),
            True,
        ),
        (
            FRENCH,
            (
                "C'est un texte multi-ligne.\n"
                "Avec plusieurs phrases.\n"
                "Test de détection de langue."
            ),
            True,
        ),
        # Mixed language multiline text (should fail)
        (
            ENGLISH,
            "This is an English sentence.\nC'est une phrase en français.",
            False,
        ),
        (
            FRENCH,
            "C'est une phrase en français.\nThis is an English sentence.",
            False,
        ),
        # Multiline text with different languages in each line
        (
            ENGLISH,
            "Excellent Communication Skills\nPython Programming\nDatabase Management",
            True,
        ),
        (
            FRENCH,
            (
                "Compétences en Communication Excellentes\n"
                "Programmation Python\n"
                "Gestion de Base de Données"
            ),
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
    assert "Input should be a valid dictionary or instance of Language" in str(
        exc_info.value
    )


def test_language_validation_mixin_multi_line_language_mismatch() -> None:
    """Test language validation with multi-line text and language mismatch."""
    with pytest.raises(ValidationError) as exc_info:
        SampleModel(
            language=Language.get(LanguageCode.ENGLISH),
            text="C'est un texte\nen français avec\nplusieurs phrases.",
        )
    assert "Text language mismatch" in str(exc_info.value)
