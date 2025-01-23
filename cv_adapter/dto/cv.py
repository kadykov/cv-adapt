from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field

from cv_adapter.dto.language import Language


class ContactDTO(BaseModel):
    """Represents a single contact method with optional metadata."""
    value: str
    type: Optional[str] = Field(None, description="e.g., 'personal', 'work'")
    icon: Optional[str] = Field(None, description="e.g., 'email', 'phone', 'linkedin'")
    url: Optional[str] = Field(None, description="Optional URL for the contact (e.g., mailto:, tel:, https://)")


class PersonalInfoDTO(BaseModel):
    """Personal information with flexible contact handling."""
    full_name: str
    email: Optional[ContactDTO] = None
    phone: Optional[ContactDTO] = None
    location: Optional[ContactDTO] = None
    linkedin: Optional[ContactDTO] = None
    github: Optional[ContactDTO] = None


class CoreCompetenceDTO(BaseModel):
    text: str


class CoreCompetencesDTO(BaseModel):
    items: List[CoreCompetenceDTO]


class InstitutionDTO(BaseModel):
    name: str
    description: Optional[str] = None
    location: Optional[str] = None


class ExperienceDTO(BaseModel):
    company: InstitutionDTO
    position: str
    start_date: date
    end_date: Optional[date] = None
    description: str = ""
    technologies: List[str] = Field(default_factory=list)


class EducationDTO(BaseModel):
    university: InstitutionDTO
    degree: str
    start_date: date
    end_date: Optional[date] = None
    description: str = ""


class SkillDTO(BaseModel):
    text: str


class SkillGroupDTO(BaseModel):
    name: str
    skills: List[SkillDTO]


class SkillsDTO(BaseModel):
    groups: List[SkillGroupDTO]


class TitleDTO(BaseModel):
    text: str


class SummaryDTO(BaseModel):
    text: str


class MinimalCVDTO(BaseModel):
    title: TitleDTO
    core_competences: CoreCompetencesDTO
    experiences: List[ExperienceDTO]
    education: List[EducationDTO]
    skills: SkillsDTO
    language: Language


class CVDTO(BaseModel):
    personal_info: PersonalInfoDTO
    title: TitleDTO
    summary: SummaryDTO
    core_competences: CoreCompetencesDTO
    experiences: List[ExperienceDTO]
    education: List[EducationDTO]
    skills: SkillsDTO
    language: Language