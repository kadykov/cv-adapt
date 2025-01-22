"""Tests for model validators."""

import pytest

from cv_adapter.models.language import Language
from cv_adapter.models.language_context import language_context
from cv_adapter.models.validators import validate_language


def test_validate_language_with_matching_language() -> None:
    """Test validation of text in matching language."""
    with language_context(Language.FRENCH):
        # French text should pass validation
        text = "Bonjour le monde"
        assert validate_language(text) == text


def test_validate_language_with_mismatched_language() -> None:
    """Test validation of text in wrong language."""
    with language_context(Language.FRENCH):
        # English text should fail validation
        with pytest.raises(ValueError) as exc_info:
            validate_language("Hello world")
        assert "language mismatch" in str(exc_info.value)


def test_validate_language_with_empty_text() -> None:
    """Test validation of empty text."""
    with language_context(Language.FRENCH):
        # Empty text should pass validation
        assert validate_language("") == ""
        assert validate_language("   ") == "   "


def test_validate_language_without_context() -> None:
    """Test validation without language context."""
    with pytest.raises(RuntimeError) as exc_info:
        validate_language("Hello world")
    assert "Language context not set" in str(exc_info.value)
