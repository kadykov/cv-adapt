from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


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

    def __iter__(self):
        return iter(self.items)

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        return self.items[idx]


class Experience(BaseModel):
    company: str
    position: str
    start_date: date
    end_date: Optional[date]
    description: str
    achievements: List[str]
    technologies: List[str]


class CV(BaseModel):
    full_name: str
    title: str
    summary: str
    core_competences: CoreCompetences
    experiences: List[Experience]
    education: List[str]  # We can expand this later if needed
    contacts: dict[str, str]  # email, phone, linkedin, etc.
