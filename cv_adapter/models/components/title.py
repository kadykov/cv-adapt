"""Models for CV title validation."""

from pydantic import Field, model_validator

from ..constants import TITLE_LINE_LENGTH
from ..language import LanguageValidationMixin
from ..validators import LanguageValidatedStr


class Title(LanguageValidationMixin):
    """Represents a professional title."""

    text: LanguageValidatedStr = Field(
        ..., max_length=TITLE_LINE_LENGTH * 2
    )  # Allow up to 2 lines

    @model_validator(mode="after")
    def validate_text(self) -> "Title":
        """Validate title text length and line count.

        Returns:
            Title: The validated instance

        Raises:
            ValueError: If text format is invalid
        """
        text = self.text.strip()
        if len(text.split("\n")) > 2:
            raise ValueError("title must not exceed 2 lines")
        for line in text.split("\n"):
            if len(line.strip()) > TITLE_LINE_LENGTH:
                raise ValueError(
                    f"each line in title must not exceed {TITLE_LINE_LENGTH} chars"
                )
        self.text = text
        return self
