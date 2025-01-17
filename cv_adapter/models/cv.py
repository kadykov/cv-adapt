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


class Experience(BaseModel):
    company: str
    position: str
    start_date: date
    end_date: Optional[date]
    description: str
    achievements: List[str]
    technologies: List[str]


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


class CV(BaseModel):
    full_name: str
    title: str
    description: CVDescription
    core_competences: CoreCompetences
    experiences: List[Experience]
    education: List[str]  # We can expand this later if needed
    contacts: dict[str, str]  # email, phone, linkedin, etc.
