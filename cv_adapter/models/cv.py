from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class CoreCompetence(BaseModel):
    name: str
    description: str
    keywords: List[str]


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
    core_competences: List[CoreCompetence]
    experiences: List[Experience]
    education: List[str]  # We can expand this later if needed
    contacts: dict[str, str]  # email, phone, linkedin, etc.
