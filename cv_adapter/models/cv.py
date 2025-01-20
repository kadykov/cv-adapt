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
from .personal_info import PersonalInfo
from .summary import CVSummary


class CoreCompetence(BaseModel):
    text: str = Field(..., max_length=SUBSUBTITLE_LINE_LENGTH)

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
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
    items: List[CoreCompetence] = Field(
        ..., min_length=MIN_CORE_COMPETENCES, max_length=MAX_CORE_COMPETENCES
    )

    @field_validator("items")
    @classmethod
    def validate_unique_items(cls, v: List[CoreCompetence]) -> List[CoreCompetence]:
        texts = [item.text for item in v]
        if len(set(texts)) != len(texts):
            raise ValueError("core competences must be unique")
        return v

    def __len__(self) -> int:
        return len(self.items)


class Institution(BaseModel):
    name: str = Field(
        ..., max_length=SUBTITLE_LINE_LENGTH
    )  # H2 - Company/University name
    description: Optional[str] = Field(None, max_length=BODY_LINE_LENGTH)
    location: Optional[str] = Field(None, max_length=HALF_LINE_LENGTH)

    @field_validator("name", "description", "location")
    @classmethod
    def validate_single_line(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        v = v.strip()
        if "\n" in v:
            raise ValueError("field must be a single line")
        return v


class Company(Institution):
    pass


class University(Institution):
    pass


class Experience(BaseModel):
    company: Company
    position: str = Field(
        ..., max_length=SUBSUBTITLE_LINE_LENGTH
    )  # H3 - Position title
    start_date: date
    end_date: Optional[date]
    description: str = Field(..., max_length=MAX_EXPERIENCE_DESCRIPTION_LENGTH)
    technologies: List[str]


class Education(BaseModel):
    university: University
    degree: str = Field(..., max_length=SUBSUBTITLE_LINE_LENGTH)  # H3 - Degree title
    start_date: date
    end_date: Optional[date]
    description: str = Field(..., max_length=MAX_EXPERIENCE_DESCRIPTION_LENGTH)

    @field_validator("degree")
    @classmethod
    def validate_degree(cls, v: str) -> str:
        v = v.strip()
        if "\n" in v:
            raise ValueError("degree must be a single line")
        return v


class Title(BaseModel):
    text: str = Field(..., max_length=TITLE_LINE_LENGTH * 2)  # Allow up to 2 lines

    @model_validator(mode="after")
    def validate_text(self) -> "Title":
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
    text: str = Field(..., max_length=HALF_LINE_LENGTH)

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if "\n" in v:
            raise ValueError("skill must be a single line")
        return v

    def __str__(self) -> str:
        return self.text


class SkillGroup(BaseModel):
    name: str = Field(..., max_length=HALF_LINE_LENGTH)
    skills: List[Skill] = Field(..., min_length=MIN_SKILLS_IN_GROUP)

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip()
        if "\n" in v:
            raise ValueError("group name must be a single line")
        return v

    @model_validator(mode="after")
    def validate_unique_skills(self) -> "SkillGroup":
        texts = [skill.text for skill in self.skills]
        if len(set(texts)) != len(texts):
            raise ValueError("skills within a group must be unique")
        return self


class Skills(BaseModel):
    groups: List[SkillGroup] = Field(..., min_length=1)

    @model_validator(mode="after")
    def validate_unique_skills_across_groups(self) -> "Skills":
        all_skills = [skill.text for group in self.groups for skill in group.skills]
        if len(set(all_skills)) != len(all_skills):
            raise ValueError("skills must be unique across all groups")
        return self


class MinimalCV(BaseModel):
    """A minimal CV model containing only the essential parts for summary generation.

    Used by SummaryGenerator to create a focused input for LLM. Contains only the
    key components needed to generate an impactful CV summary, excluding personal
    information and other non-essential details.
    """

    title: Title
    core_competences: CoreCompetences
    experiences: List[Experience]
    education: List[Education]
    skills: Skills


class CV(BaseModel):
    """Complete CV model containing all components of a professional CV.

    This model represents a fully-formed CV with all necessary sections, including
    personal information, professional summary, and detailed experience sections.
    The components are organized in the order they should appear in the final CV.
    """

    personal_info: PersonalInfo
    title: Title
    summary: CVSummary
    core_competences: CoreCompetences
    experiences: List[Experience]
    education: List[Education]
    skills: Skills
