from enum import Enum
from typing import Optional

from fast_langdetect import detect as _detect  # type: ignore[import-untyped]
from pydantic import BaseModel, ValidationInfo, field_validator


class Language(str, Enum):
    """Supported languages for CV generation."""

    ENGLISH = "en"
    FRENCH = "fr"
    GERMAN = "de"
    SPANISH = "es"
    ITALIAN = "it"


class LanguageValidationMixin(BaseModel):
    """Mixin for adding language validation to Pydantic models."""

    language: Language
    text: str

    @field_validator("text")
    def validate_text_language(cls, v: str, info: ValidationInfo) -> str:
        """Validate that the text is in the specified language."""
        v = v.strip()
        if not v:
            return v

        language = info.data.get("language")
        if not language:
            return v

        detected = detect_language(v)
        if detected is None:
            # If we can't detect the language confidently, let it pass
            return v

        if detected != language:
            raise ValueError(
                f"Text language mismatch. Expected {language}, detected {detected}"
            )
        return v


def detect_language(text: str) -> Optional[Language]:
    """Detect language of the given text and return corresponding Language enum value.

    Returns None if:
    - Text is empty or whitespace
    - Language detection confidence is below 0.9
    - Detected language is not supported
    - Detection fails
    """
    if not text or not text.strip():
        return None

    # Replace newlines with spaces to handle multi-line text
    text_single_line = text.replace("\n", " ").strip()

    try:
        result = _detect(text_single_line)
        lang_code = result.get("lang")
        score = result.get("score", 0)

        # Only return language if we're confident enough
        if score >= 0.9:
            try:
                return Language(lang_code)
            except ValueError:
                return None
        return None
    except (ValueError, KeyError, AttributeError):
        return None
