"""Models for generator inputs and intermediate data structures."""

from typing import Optional

from pydantic import BaseModel, constr, field_validator


class ExperienceGeneratorInput(BaseModel):
    """Input model for experience generation containing all required data."""

    cv_text: constr(strip_whitespace=True, min_length=1)
    job_description: constr(strip_whitespace=True, min_length=1)
    core_competences: constr(strip_whitespace=True, min_length=1)
    notes: Optional[str] = None

    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v