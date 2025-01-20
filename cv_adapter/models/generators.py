"""Models for generator inputs and intermediate data structures."""

from typing import Annotated, Optional

from pydantic import BaseModel, Field, field_validator


class ExperienceGeneratorInput(BaseModel):
    """Input model for experience generation containing all required data."""

    cv_text: Annotated[str, Field(min_length=1, strip_whitespace=True)]
    job_description: Annotated[str, Field(min_length=1, strip_whitespace=True)]
    core_competences: Annotated[str, Field(min_length=1, strip_whitespace=True)]
    notes: Optional[str] = None

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v