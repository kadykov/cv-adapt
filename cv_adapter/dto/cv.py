from dataclasses import dataclass, field
from datetime import date
from typing import List, Optional

from cv_adapter.models.language import Language


@dataclass
class PersonalInfoDTO:
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None


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
    language: Language


@dataclass
class CVDTO:
    personal_info: PersonalInfoDTO
    title: TitleDTO
    summary: SummaryDTO
    core_competences: CoreCompetencesDTO
    experiences: List[ExperienceDTO]
    education: List[EducationDTO]
    skills: SkillsDTO
    language: Language