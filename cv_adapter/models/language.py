from typing import Optional

from fast_langdetect import detect  # type: ignore[import-untyped]
from pydantic import BaseModel, ValidationInfo, field_validator

from cv_adapter.dto.language import Language, LanguageCode


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

        # Replace newlines with spaces to handle multi-line text
        text_single_line = v.replace("\n", " ").strip()

        try:
            # Detect language for the entire text
            detected_text_language = detect_language(
                text_single_line, min_confidence=0.7
            )

            # If detected language is different, raise error
            if (
                detected_text_language is not None
                and detected_text_language != language
            ):
                raise ValueError(
                    f"Text language mismatch. "
                    f"Expected {language}, but detected {detected_text_language}. "
                    "Please ensure the text is in the correct language."
                )

            # Always check each line for language
            lines = v.split("\n")
            line_languages = [
                detect_language(line.strip(), min_confidence=0.7) for line in lines
            ]

            # If any line has a different language, raise an error
            detected_languages = set(
                lang for lang in line_languages if lang is not None
            )
            if len(detected_languages) > 1 or (
                detected_languages and list(detected_languages)[0] != language
            ):
                raise ValueError(
                    f"Text language mismatch. "
                    f"Expected {language}, but detected mixed or different languages. "
                    "Please ensure the text is in the correct language."
                )

        except Exception as e:
            # If detection fails or language mismatch is detected, raise an error
            raise ValueError(
                f"Text language mismatch. "
                f"Expected {language}. "
                "Please ensure the text is in the correct language."
            ) from e

        return v


def detect_language(text: str, min_confidence: float = 0.7) -> Optional[Language]:
    """Detect language of the given text and return corresponding Language enum value.

    Returns None if:
    - Language detection confidence is below the specified threshold
    - Detected language is not supported
    - Detection fails

    Args:
        text: Text to detect language for
        min_confidence: Confidence threshold for language detection (default 0.7)
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
                # Convert the detected language code to LanguageCode
                language_code = LanguageCode(lang_code)
                # Retrieve the corresponding Language instance
                return Language.get(language_code)
            except (ValueError, KeyError):
                # If the language is not supported
                return None

        # If no language meets the confidence threshold
        return None
    except Exception:
        return None
