from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

# Typography-based line length constraints
BODY_LINE_LENGTH = 80  # Standard length for body text
TITLE_LINE_LENGTH = 100  # H1 - Main titles (like full name)
SUBTITLE_LINE_LENGTH = 80  # H2 - Section titles, company/university names
SUBSUBTITLE_LINE_LENGTH = 60  # H3 - Position titles, degrees
HALF_LINE_LENGTH = BODY_LINE_LENGTH // 2  # For short items like skills, locations

# Word and character ratios
AVG_CHARS_PER_WORD = 6  # Average number of characters per word including space
MAX_WORDS_PER_LINE = BODY_LINE_LENGTH // AVG_CHARS_PER_WORD  # ~13 words per line

# Description lengths in number of lines
EXPERIENCE_DESCRIPTION_LINES = 15  # 15 lines for detailed descriptions
CV_DESCRIPTION_LINES = 6  # 6 lines for CV summary

# Derived length constraints
EXPERIENCE_DESCRIPTION_LENGTH = BODY_LINE_LENGTH * EXPERIENCE_DESCRIPTION_LINES
CV_DESCRIPTION_LENGTH = BODY_LINE_LENGTH * CV_DESCRIPTION_LINES
MAX_CV_DESCRIPTION_WORDS = MAX_WORDS_PER_LINE * CV_DESCRIPTION_LINES

# List length constraints
MIN_CORE_COMPETENCES = 4
MAX_CORE_COMPETENCES = 6
MIN_SKILLS_IN_GROUP = 1

# Word limits for specific fields
MAX_CORE_COMPETENCE_WORDS = 5  # Keep core competences concise


class CoreCompetence(BaseModel):
    text: str = Field(..., max_length=BODY_LINE_LENGTH)

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
    name: str = Field(..., max_length=SUBTITLE_LINE_LENGTH)  # H2 - Company/University name
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
    position: str = Field(..., max_length=SUBSUBTITLE_LINE_LENGTH)  # H3 - Position title
    start_date: date
    end_date: Optional[date]
    description: str = Field(..., max_length=EXPERIENCE_DESCRIPTION_LENGTH)
    technologies: List[str]


class Education(BaseModel):
    university: University
    degree: str = Field(..., max_length=SUBSUBTITLE_LINE_LENGTH)  # H3 - Degree title
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
            raise ValueError(f"CV description must not be longer than {MAX_CV_DESCRIPTION_WORDS} words")
        if "\n" in text:
            raise ValueError("CV description must be a single paragraph")
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
