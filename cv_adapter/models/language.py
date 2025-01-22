from enum import Enum
from typing import Optional

from langdetect import detect, detect_langs
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

        # Skip validation for very short texts
        if len(v) < 10:
            return v

        # Detect language with a lower confidence threshold
        detected = detect_language(v, min_confidence=0.5)

        # If detection fails or is ambiguous, let it pass
        if detected is None:
            return v

        # If detected language doesn't match
        if detected != language:
            raise ValueError(
                f"Text language mismatch. Expected {language}, detected {detected}"
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
        # First, try to detect the language directly
        try:
            lang_code = detect(text_single_line)
            return Language(lang_code)
        except (ValueError, Exception):
            pass

        # If direct detection fails, try probabilistic detection
        lang_results = detect_langs(text_single_line)

        # Find the first language that meets the confidence threshold and is supported
        for result in lang_results:
            # langdetect returns results in format "lang:probability"
            lang_code, confidence = result.split(':')

            # Check if confidence meets the threshold
            if float(confidence) >= min_confidence:
                try:
                    return Language(lang_code)
                except ValueError:
                    # If the language is not supported, continue to next result
                    continue

        # If no language meets the confidence threshold
        return None
    except Exception:
        return None
