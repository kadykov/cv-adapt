"""Models for education-related CV components."""

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator

from ..constants import (
    BODY_LINE_LENGTH,
    HALF_LINE_LENGTH,
    MAX_EXPERIENCE_DESCRIPTION_LENGTH,
    SUBSUBTITLE_LINE_LENGTH,
    SUBTITLE_LINE_LENGTH,
)
from ..validators import LanguageValidatedStr


class University(BaseModel):
    """Represents a university in the CV."""

    name: LanguageValidatedStr = Field(
        ..., max_length=SUBTITLE_LINE_LENGTH
    )  # H2 - University name
    description: Optional[LanguageValidatedStr] = Field(
        None, max_length=BODY_LINE_LENGTH
    )
    location: Optional[LanguageValidatedStr] = Field(None, max_length=HALF_LINE_LENGTH)

    @field_validator("name", "description", "location")
    @classmethod
    def validate_single_line(cls, v: Optional[str]) -> Optional[str]:
        """Validate that the field is a single line."""
        if v is None:
            return v
        v = v.strip()
        if "\n" in v:
            raise ValueError("field must be a single line")
        return v


class Education(BaseModel):
    """Represents an educational experience entry."""

    university: University
    degree: LanguageValidatedStr = Field(
        ..., max_length=SUBSUBTITLE_LINE_LENGTH
    )  # H3 - Degree title
    start_date: date
    end_date: Optional[date]
    description: LanguageValidatedStr = Field(
        ..., max_length=MAX_EXPERIENCE_DESCRIPTION_LENGTH
    )

    @field_validator("degree")
    @classmethod
    def validate_degree(cls, v: str) -> str:
        """Validate that the degree is a single line."""
        v = v.strip()
        if "\n" in v:
            raise ValueError("degree must be a single line")
        return v
