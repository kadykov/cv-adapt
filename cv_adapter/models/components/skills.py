"""Models for skills-related CV components."""

from typing import List

from pydantic import BaseModel, Field, field_validator, model_validator

from ..constants import (
    HALF_LINE_LENGTH,
    MAX_CORE_COMPETENCES,
    MAX_WORDS_PER_SUBSUBTITLE,
    MIN_CORE_COMPETENCES,
    MIN_SKILLS_IN_GROUP,
    SUBSUBTITLE_LINE_LENGTH,
)
from ..validators import LanguageValidatedStr


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
