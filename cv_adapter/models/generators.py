"""Models for generator inputs and intermediate data structures."""

from typing import Annotated, Optional

from pydantic import BaseModel, Field, field_validator


class GeneratorInputBase(BaseModel):
    """Base model for all generator inputs with common fields."""

    cv_text: Annotated[str, Field(min_length=1)]
    job_description: Annotated[str, Field(min_length=1)]
    core_competences: Annotated[str, Field(min_length=1)]
    notes: Optional[str] = None

    @field_validator("cv_text", "job_description", "core_competences", "notes")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        """Strip whitespace from all string fields."""
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v

    @field_validator("cv_text", "job_description", "core_competences")
    @classmethod
    def validate_required(cls, v: Optional[str]) -> str:
        """Validate required fields after stripping whitespace."""
        if not v:
            raise ValueError("This field is required")
        return v


class ExperienceGeneratorInput(GeneratorInputBase):
    """Input model for experience generation containing all required data."""


class TitleGeneratorInput(GeneratorInputBase):
    """Input model for title generation containing all required data."""


class EducationGeneratorInput(GeneratorInputBase):
    """Input model for education generation containing all required data."""


class SkillsGeneratorInput(GeneratorInputBase):
    """Input model for skills generation containing all required data."""
