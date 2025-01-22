"""Validators for CV models."""

from typing import Annotated

from pydantic import BeforeValidator

from .language import detect_language
from .language_context import get_current_language


def validate_language(text: str) -> str:
    """Validate text language against current context language.

    Args:
        text: The text to validate

    Returns:
        The validated text

    Raises:
        ValueError: If text language doesn't match context language
        RuntimeError: If language context is not set
    """
    if not text.strip():
        return text

    current_lang = get_current_language()
    detected = detect_language(text)

    if detected is not None and detected != current_lang:
        raise ValueError(
            f"Text language mismatch. Expected {current_lang.value}, detected {detected.value}"
        )
    return text.strip()


# Type alias for language-validated string
LanguageValidatedStr = Annotated[str, BeforeValidator(validate_language)]
