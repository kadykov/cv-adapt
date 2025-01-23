from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional

from enum import Enum


class LanguageDTO(str, Enum):
    """Supported languages for CV generation."""

    ENGLISH = "en"
    FRENCH = "fr"
    GERMAN = "de"
    SPANISH = "es"
    ITALIAN = "it"


@dataclass
class ContactDTO:
    """Represents a single contact method with optional metadata."""
    value: str
    type: Optional[str] = None  # e.g., "personal", "work"
    icon: Optional[str] = None  # e.g., "email", "phone", "linkedin"
    url: Optional[str] = None  # Optional URL for the contact (e.g., mailto:, tel:, https://)


@dataclass
class PersonalInfoDTO:
    """Personal information with flexible contact handling."""
    full_name: str
    email: Optional[ContactDTO] = None
    phone: Optional[ContactDTO] = None
    location: Optional[ContactDTO] = None
    linkedin: Optional[ContactDTO] = None
    github: Optional[ContactDTO] = None


@dataclass
class CoreCompetenceDTO:
    text: str


@dataclass
class CoreCompetencesDTO:
    items: List[CoreCompetenceDTO]


@dataclass
class InstitutionDTO:
    name: str
    description: Optional[str] = None
    location: Optional[str] = None


@dataclass
class ExperienceDTO:
    company: InstitutionDTO
    position: str
    start_date: date
    end_date: Optional[date] = None
    description: str = ""
    technologies: List[str] = field(default_factory=list)


@dataclass
class EducationDTO:
    university: InstitutionDTO
    degree: str
    start_date: date
    end_date: Optional[date] = None
    description: str = ""


@dataclass
class SkillDTO:
    text: str


@dataclass
class SkillGroupDTO:
    name: str
    skills: List[SkillDTO]


@dataclass
class SkillsDTO:
    groups: List[SkillGroupDTO]


@dataclass
class TitleDTO:
    text: str


@dataclass
class SummaryDTO:
    text: str


@dataclass
class MinimalCVDTO:
    title: TitleDTO
    core_competences: CoreCompetencesDTO
    experiences: List[ExperienceDTO]
    education: List[EducationDTO]
    skills: SkillsDTO
    language: LanguageDTO


@dataclass
class CVDTO:
    personal_info: PersonalInfoDTO
    title: TitleDTO
    summary: SummaryDTO
    core_competences: CoreCompetencesDTO
    experiences: List[ExperienceDTO]
    education: List[EducationDTO]
    skills: SkillsDTO
    language: LanguageDTO