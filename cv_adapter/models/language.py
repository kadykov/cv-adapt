from enum import Enum
from typing import Optional

from fast_langdetect import detect  # type: ignore[import-untyped]
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
        """
        Validate that the text is in the specified language.

        Args:
            v (str): Text to validate
            info (ValidationInfo): Validation context

        Returns:
            str: Validated text

        Raises:
            ValueError: If detected language does not match expected language
        """
        language = info.data.get("language")
        if not language:
            return v

        detected_language = detect_language(v, min_confidence=0.6)

        if detected_language is not None and detected_language != language:
            raise ValueError(
                f"Text language mismatch. "
                f"Expected {language}, but detected {detected_language}. "
                "Please ensure the text is in the correct language."
            )

        return v


def detect_language(text: str, min_confidence: float = 0.5) -> Optional[Language]:
    """Detect language of the given text and return corresponding Language enum value.

    Returns None if:
    - Language detection confidence is below the specified threshold
    - Detected language is not supported
    - Detection fails

    Args:
        text: Text to detect language for
        min_confidence: Confidence threshold for language detection (default 0.5)
    """
    # Replace newlines with spaces to handle multi-line text
    text_single_line = text.replace("\n", " ").strip()

    try:
        # Use fast_langdetect to detect language
        result = detect(text_single_line)

        # Extract language code and confidence
        lang_code = result["lang"]
        confidence = result["score"]

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
