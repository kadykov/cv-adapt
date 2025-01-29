"""Validators for CV models."""

from typing import Annotated

from pydantic import BeforeValidator

from .context import get_current_language
from .language import detect_language


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
            f"Text language mismatch. "
            f"Expected {current_lang.name}, "
            f"detected {detected.name}"
        )
    return text.strip()


# Type alias for language-validated string
LanguageValidatedStr = Annotated[str, BeforeValidator(validate_language)]
