"""Models for CV summary generation and validation."""

from pydantic import Field, model_validator

from .constants import MAX_CV_SUMMARY_LENGTH, MAX_CV_SUMMARY_WORDS
from .language import LanguageValidationMixin


class CVSummary(LanguageValidationMixin):
    """A concise summary of the CV that appears at the beginning."""

    text: str = Field(..., max_length=MAX_CV_SUMMARY_LENGTH)

    @model_validator(mode="after")
    def validate_text(self) -> "CVSummary":
        text = self.text.strip()
        if len(text.split()) > MAX_CV_SUMMARY_WORDS:
            raise ValueError(f"CV summary must not exceed {MAX_CV_SUMMARY_WORDS} words")
        if "\n" in text:
            raise ValueError("CV summary must be a single paragraph")
        self.text = text
        return self
