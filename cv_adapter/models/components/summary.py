"""Models for CV summary generation and validation."""

from pydantic import Field, model_validator

from ..constants import MAX_CV_SUMMARY_LENGTH, MAX_CV_SUMMARY_WORDS
from ..language import LanguageValidationMixin
from ..validators import LanguageValidatedStr


class CVSummary(LanguageValidationMixin):
    """A concise summary of the CV that appears at the beginning."""

    text: LanguageValidatedStr = Field(..., max_length=MAX_CV_SUMMARY_LENGTH)

    @model_validator(mode="after")
    def validate_text(self) -> "CVSummary":
        """Validate summary text length and format.

        Returns:
            CVSummary: The validated instance

        Raises:
            ValueError: If text format is invalid
        """
        text = self.text.strip()
        if len(text.split()) > MAX_CV_SUMMARY_WORDS:
            raise ValueError(f"CV summary must not exceed {MAX_CV_SUMMARY_WORDS} words")
        if "\n" in text:
            raise ValueError("CV summary must be a single paragraph")
        self.text = text
        return self
