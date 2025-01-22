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
    assert detect_language(text) == Language.ENGLISH


def test_detect_language_french() -> None:
    """Test detecting French text."""
    text = "C'est un exemple de texte en français avec des termes techniques."
    assert detect_language(text) == Language.FRENCH


def test_detect_language_german() -> None:
    """Test detecting German text."""
    text = "Dies ist ein Beispieltext auf Deutsch mit einigen technischen Begriffen."
    assert detect_language(text) == Language.GERMAN


def test_detect_language_spanish() -> None:
    """Test detecting Spanish text."""
    text = "Este es un texto de ejemplo en español con algunos términos técnicos."
    assert detect_language(text) == Language.SPANISH


def test_detect_language_italian() -> None:
    """Test detecting Italian text."""
    text = "Questo è un testo di esempio in italiano con alcuni termini tecnici."
    assert detect_language(text) == Language.ITALIAN


def test_detect_language_empty() -> None:
    """Test that empty text returns None."""
    assert detect_language("") is None
    assert detect_language("   ") is None


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
        (Language.ENGLISH, "This is English text.", True),
        (Language.FRENCH, "C'est un texte en français.", True),
        (Language.GERMAN, "Dies ist deutscher Text.", True),
        (Language.SPANISH, "Este es texto en español.", True),
        (Language.ITALIAN, "Questo è testo italiano.", True),
        # Mismatched languages
        (Language.ENGLISH, "C'est un texte en français.", False),
        (Language.FRENCH, "This is English text.", False),
        # Empty text should pass (validation is only for non-empty text)
        (Language.ENGLISH, "", True),
        (Language.FRENCH, "   ", True),
    ],
)
def test_language_validation_mixin(
    language: Language, text: str, should_pass: bool
) -> None:
    """Test LanguageValidationMixin with various language combinations."""
    if should_pass:
        model = SampleModel(language=language, text=text)
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
