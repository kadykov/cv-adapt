from enum import Enum
from typing import Optional

from fast_langdetect import detect
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

        # Detect language with fast-langdetect
        result = detect(v)

        # Extract language and confidence
        detected_lang = result["lang"]
        confidence = result["score"]

        # If detected language doesn't match
        if detected_lang != language:
            raise ValueError(
                f"Text language mismatch. Expected {language}, detected {detected_lang}"
            )

        return v


def detect_language(text: str, min_confidence: float = 0.5) -> Optional[Language]:
    """Detect language of the given text and return corresponding Language enum value.

    Returns None if:
    - Text is empty or whitespace
    - Text is too short (less than 5 characters)
    - Language detection confidence is below the specified threshold
    - Detected language is not supported
    - Detection fails

    Args:
        text: Text to detect language for
        min_confidence: Minimum confidence threshold for language detection (default 0.5)
    """
    if not text or not text.strip():
        return None

    # Skip language detection for very short texts
    if len(text.strip()) < 5:
        return None

    # Replace newlines with spaces to handle multi-line text
    text_single_line = text.replace("\n", " ").strip()

    try:
        # Use fast_langdetect to detect language
        result = detect(text_single_line)

        # If the result is a dictionary with 'lang' and 'score' keys
        if isinstance(result, dict):
            lang_code = result["lang"]
            confidence = result["score"]
        else:
            # If it's a simple string, assume full confidence
            lang_code = result
            confidence = 1.0

        # Check confidence threshold
        if confidence >= min_confidence:
            try:
                return Language(lang_code)
            except ValueError:
                # If the language is not supported
                return None

        # If no language meets the confidence threshold
        return None
    except Exception:
        return None
