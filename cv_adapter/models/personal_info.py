from typing import Dict

from pydantic import BaseModel, Field, field_validator

from .constants import TITLE_LINE_LENGTH


class PersonalInfo(BaseModel):
    """Personal information model for CV."""

    full_name: str = Field(..., max_length=TITLE_LINE_LENGTH)
    contacts: Dict[str, str]  # email, phone, linkedin, etc.

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if "\n" in v:
            raise ValueError("full name must be a single line")
        return v
