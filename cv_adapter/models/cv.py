from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

# Text field length constraints
SINGLE_LINE_TEXT_LENGTH = 80  # Standard length for most single-line text fields
SHORT_TEXT_LENGTH = 40  # For shorter text fields like skills and group names
LOCATION_TEXT_LENGTH = 50  # For location fields
CORE_COMPETENCE_LENGTH = 100  # For core competence items

# Description length constraints
EXPERIENCE_DESCRIPTION_LENGTH = 1200  # For detailed experience/education descriptions
CV_DESCRIPTION_LENGTH = 500  # For the main CV description

# List length constraints
MIN_CORE_COMPETENCES = 4
MAX_CORE_COMPETENCES = 6
MIN_SKILLS_IN_GROUP = 1

# Word count limits
MAX_CORE_COMPETENCE_WORDS = 5
MAX_CV_DESCRIPTION_WORDS = 50


class CoreCompetence(BaseModel):
    text: str = Field(..., max_length=CORE_COMPETENCE_LENGTH)

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if len(v.split()) > MAX_CORE_COMPETENCE_WORDS:
            raise ValueError("core competence must not be longer than 5 words")
        if "\n" in v:
            raise ValueError("core competence must be a single line")
        return v


class CoreCompetences(BaseModel):
    items: List[CoreCompetence] = Field(..., min_length=MIN_CORE_COMPETENCES, max_length=MAX_CORE_COMPETENCES)

    @field_validator("items")
    @classmethod
    def validate_unique_items(cls, v: List[CoreCompetence]) -> List[CoreCompetence]:
        texts = [item.text for item in v]
        if len(set(texts)) != len(texts):
            raise ValueError("core competences must be unique")
        return v

    def __len__(self) -> int:
        return len(self.items)

    def to_list(self) -> List[str]:
        return [item.text for item in self.items]


class Institution(BaseModel):
    name: str = Field(..., max_length=SINGLE_LINE_TEXT_LENGTH)
    description: Optional[str] = Field(None, max_length=SINGLE_LINE_TEXT_LENGTH)
    location: Optional[str] = Field(None, max_length=LOCATION_TEXT_LENGTH)

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
    position: str = Field(..., max_length=SINGLE_LINE_TEXT_LENGTH)
    start_date: date
    end_date: Optional[date]
    description: str = Field(..., max_length=EXPERIENCE_DESCRIPTION_LENGTH)
    technologies: List[str]


class Education(BaseModel):
    university: University
    degree: str = Field(..., max_length=SINGLE_LINE_TEXT_LENGTH)
    start_date: date
    end_date: Optional[date]
    description: str = Field(..., max_length=EXPERIENCE_DESCRIPTION_LENGTH)

    @field_validator("degree")
    @classmethod
    def validate_degree(cls, v: str) -> str:
        v = v.strip()
        if "\n" in v:
            raise ValueError("degree must be a single line")
        return v


class CVDescription(BaseModel):
    text: str = Field(..., max_length=CV_DESCRIPTION_LENGTH)

    @model_validator(mode="after")
    def validate_text(self) -> "CVDescription":
        text = self.text.strip()
        if len(text.split()) > MAX_CV_DESCRIPTION_WORDS:
            raise ValueError("CV description must not be longer than 50 words")
        if "\n" in text:
            raise ValueError("CV description must be a single paragraph")
        self.text = text
        return self


class Skill(BaseModel):
    text: str = Field(..., max_length=SHORT_TEXT_LENGTH)

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if "\n" in v:
            raise ValueError("skill must be a single line")
        return v


class SkillGroup(BaseModel):
    name: str = Field(..., max_length=SHORT_TEXT_LENGTH)
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
    """A minimal CV model containing only the essential parts needed for description.

    Used by DescriptionGenerator to create a focused input for LLM.
    """

    core_competences: CoreCompetences
    experiences: List[Experience]
    education: List[Education]
    skills: Skills


class CV(BaseModel):
    full_name: str
    title: str
    description: CVDescription
    core_competences: CoreCompetences
    experiences: List[Experience]
    education: List[Education]
    contacts: dict[str, str]  # email, phone, linkedin, etc.
    skills: Skills
