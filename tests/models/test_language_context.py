"""Tests for language context management."""

import pytest

from cv_adapter.dto.language import FRENCH, GERMAN
from cv_adapter.models.context import get_current_language, language_context


def test_language_context_sets_language() -> None:
    """Test that language context correctly sets and resets language."""
    with language_context(FRENCH):
        assert get_current_language() == FRENCH


def test_language_context_resets_after_exit() -> None:
    """Test that language context resets after exiting context."""
    with pytest.raises(RuntimeError):
        get_current_language()

    with language_context(FRENCH):
        assert get_current_language() == FRENCH

    with pytest.raises(RuntimeError):
        get_current_language()


def test_nested_language_contexts() -> None:
    """Test that nested language contexts work correctly."""
    with language_context(FRENCH):
        assert get_current_language() == FRENCH

        with language_context(GERMAN):
            assert get_current_language() == GERMAN

        assert get_current_language() == FRENCH


def test_get_current_language_without_context() -> None:
    """Test that getting current language without context raises error."""
    with pytest.raises(RuntimeError) as exc_info:
        get_current_language()
    assert "Language context not set" in str(exc_info.value)
