"""Validators for CV models."""

from typing import Annotated

from pydantic import BeforeValidator

from cv_adapter.dto.language import LanguageConfig

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
        expected_config = LanguageConfig.get(current_lang.code)
        detected_config = LanguageConfig.get(detected.code)
        raise ValueError(
            f"Text language mismatch. "
            f"Expected {expected_config.name}, "
            f"detected {detected_config.name}"
        )
    return text.strip()


# Type alias for language-validated string
LanguageValidatedStr = Annotated[str, BeforeValidator(validate_language)]
