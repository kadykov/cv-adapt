from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class CoreCompetence(BaseModel):
    text: str = Field(..., max_length=100)

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if len(v.split()) > 5:
            raise ValueError("core competence must not be longer than 5 words")
        if "\n" in v:
            raise ValueError("core competence must be a single line")
        return v


class CoreCompetences(BaseModel):
    items: List[CoreCompetence] = Field(..., min_length=4, max_length=6)

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
    name: str = Field(..., max_length=80)
    description: Optional[str] = Field(None, max_length=80)
    location: Optional[str] = Field(None, max_length=50)

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
    position: str = Field(..., max_length=80)
    start_date: date
    end_date: Optional[date]
    description: str = Field(..., max_length=1200)
    technologies: List[str]


class Education(BaseModel):
    university: University
    degree: str = Field(..., max_length=80)
    start_date: date
    end_date: Optional[date]
    description: str = Field(..., max_length=1200)

    @field_validator("degree")
    @classmethod
    def validate_degree(cls, v: str) -> str:
        v = v.strip()
        if "\n" in v:
            raise ValueError("degree must be a single line")
        return v


class CVDescription(BaseModel):
    text: str = Field(..., max_length=500)

    @model_validator(mode="after")
    def validate_text(self) -> "CVDescription":
        text = self.text.strip()
        if len(text.split()) > 50:
            raise ValueError("CV description must not be longer than 50 words")
        if "\n" in text:
            raise ValueError("CV description must be a single paragraph")
        self.text = text
        return self


class Skill(BaseModel):
    text: str = Field(..., max_length=40)

    @field_validator("text")
    @classmethod
    def validate_text(cls, v: str) -> str:
        v = v.strip()
        if "\n" in v:
            raise ValueError("skill must be a single line")
        return v


class SkillGroup(BaseModel):
    name: str = Field(..., max_length=40)
    skills: List[Skill] = Field(..., min_length=1)

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
