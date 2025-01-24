"""Language context models for CV components."""

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from .constants import (
    BODY_LINE_LENGTH,
    HALF_LINE_LENGTH,
    MAX_CORE_COMPETENCES,
    MAX_EXPERIENCE_DESCRIPTION_LENGTH,
    MAX_WORDS_PER_SUBSUBTITLE,
    MIN_CORE_COMPETENCES,
    MIN_SKILLS_IN_GROUP,
    SUBSUBTITLE_LINE_LENGTH,
    SUBTITLE_LINE_LENGTH,
    TITLE_LINE_LENGTH,
)
from .validators import LanguageValidatedStr


class CoreCompetence(BaseModel):
    """A single core competence with validation."""

    text: LanguageValidatedStr = Field(..., max_length=SUBSUBTITLE_LINE_LENGTH)

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Validate text format and length.

        Args:
            v: The text to validate

        Returns:
            The validated text

        Raises:
            ValueError: If text format is invalid
        """
        v = v.strip()
        if len(v.split()) > MAX_WORDS_PER_SUBSUBTITLE:
            raise ValueError(
                f"core competence must not exceed {MAX_WORDS_PER_SUBSUBTITLE} words"
            )
        if "\n" in v:
            raise ValueError("core competence must be a single line")
        return v

    def __str__(self) -> str:
        return self.text


class CoreCompetences(BaseModel):
    """A collection of core competences with validation."""

    items: List[CoreCompetence] = Field(
        ..., min_length=MIN_CORE_COMPETENCES, max_length=MAX_CORE_COMPETENCES
    )

    @field_validator("items", mode="before")
    @classmethod
    def validate_unique_items(
        cls, v: List[dict | CoreCompetence]
    ) -> List[CoreCompetence]:
        """Validate that all competences are unique.

        Args:
            v: List of competences to validate

        Returns:
            The validated list of competences

        Raises:
            ValueError: If there are duplicate competences
        """
        # Convert dictionaries to CoreCompetence objects
        competences = [
            item if isinstance(item, CoreCompetence) else CoreCompetence(**item)
            for item in v
        ]

        # Check for duplicates
        texts = [item.text for item in competences]
        if len(set(texts)) != len(texts):
            raise ValueError("core competences must be unique")
        return competences

    def __len__(self) -> int:
        return len(self.items)


class Institution(BaseModel):
    """Base model for institutions with language validation."""

    name: LanguageValidatedStr = Field(
        ..., max_length=SUBTITLE_LINE_LENGTH
    )  # H2 - Company/University name
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


class Company(Institution):
    """Represents a company in the CV."""

    pass


class University(Institution):
    """Represents a university in the CV."""

    pass


class Experience(BaseModel):
    """Represents a professional experience entry."""

    company: Company
    position: LanguageValidatedStr = Field(
        ..., max_length=SUBSUBTITLE_LINE_LENGTH
    )  # H3 - Position title
    start_date: date
    end_date: Optional[date]
    description: LanguageValidatedStr = Field(
        ..., max_length=MAX_EXPERIENCE_DESCRIPTION_LENGTH
    )
    technologies: List[str]


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


class Title(BaseModel):
    """Represents a professional title."""

    text: LanguageValidatedStr = Field(
        ..., max_length=TITLE_LINE_LENGTH * 2
    )  # Allow up to 2 lines

    @model_validator(mode="after")
    def validate_text(self) -> "Title":
        """Validate title text length and line count."""
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


class Skill(BaseModel):
    """Represents a single skill."""

    text: LanguageValidatedStr = Field(..., max_length=HALF_LINE_LENGTH)

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        """Validate that the skill is a single line."""
        v = v.strip()
        if "\n" in v:
            raise ValueError("skill must be a single line")
        return v

    def __str__(self) -> str:
        return self.text


class SkillGroup(BaseModel):
    """Represents a group of related skills."""

    name: LanguageValidatedStr = Field(..., max_length=HALF_LINE_LENGTH)
    skills: List[Skill] = Field(..., min_length=MIN_SKILLS_IN_GROUP)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate that the group name is a single line."""
        v = v.strip()
        if "\n" in v:
            raise ValueError("group name must be a single line")
        return v

    @model_validator(mode="after")
    def validate_unique_skills(self) -> "SkillGroup":
        """Validate that skills within the group are unique."""
        texts = [skill.text for skill in self.skills]
        if len(set(texts)) != len(texts):
            raise ValueError("skills within a group must be unique")
        return self


class Skills(BaseModel):
    """Represents a collection of skill groups."""

    groups: List[SkillGroup] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_unique_skills_across_groups(self) -> "Skills":
        """Validate that skills are unique across all groups."""
        all_skills = [skill.text for group in self.groups for skill in group.skills]
        if len(set(all_skills)) != len(all_skills):
            raise ValueError("skills must be unique across all groups")
        return self
