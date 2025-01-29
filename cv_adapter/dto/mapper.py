from dataclasses import dataclass
from typing import Any, ClassVar, Dict, Mapping, Optional, Union

from cv_adapter.dto import cv as cv_dto
from cv_adapter.models import personal_info as personal_info_models
from cv_adapter.models.components import (
    Company,
    CoreCompetence,
    CoreCompetences,
    CVSummary,
    Education,
    Experience,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)


@dataclass(frozen=True)
class ContactMetadata:
    icon: str
    url_template: Optional[str] = None
    type: str = "primary"

    def create_url(self, value: str) -> Optional[str]:
        return self.url_template.format(value) if self.url_template else None


class ContactTypes:
    EMAIL: ClassVar[ContactMetadata] = ContactMetadata(
        icon="email", url_template="mailto:{}", type="primary"
    )
    PHONE: ClassVar[ContactMetadata] = ContactMetadata(
        icon="phone", url_template="tel:{}", type="primary"
    )
    LINKEDIN: ClassVar[ContactMetadata] = ContactMetadata(
        icon="linkedin", url_template="https://linkedin.com/in/{}", type="social"
    )
    GITHUB: ClassVar[ContactMetadata] = ContactMetadata(
        icon="github", url_template="https://github.com/{}", type="social"
    )
    LOCATION: ClassVar[ContactMetadata] = ContactMetadata(
        icon="location", url_template=None, type="location"
    )

    @classmethod
    def get_metadata(cls, contact_type: str) -> Optional[ContactMetadata]:
        return getattr(cls, contact_type.upper(), None)


def map_personal_info(
    personal_info: Union[personal_info_models.PersonalInfo, cv_dto.PersonalInfoDTO],
) -> cv_dto.PersonalInfoDTO:
    # If already a DTO, return as-is
    if isinstance(personal_info, cv_dto.PersonalInfoDTO):
        return personal_info

    # Extract contacts from the contacts dictionary
    contacts: Mapping[str, Optional[str]] = personal_info.contacts or {}

    # Helper function to create ContactDTO with smart defaults
    def create_contact_dto(
        value: Optional[str], contact_type: str
    ) -> Optional[cv_dto.ContactDTO]:
        if not value:
            return None

        metadata = ContactTypes.get_metadata(contact_type)
        if not metadata:
            return None

        return cv_dto.ContactDTO(
            value=value,
            type=metadata.type,
            icon=metadata.icon,
            url=metadata.create_url(value),
        )

    return cv_dto.PersonalInfoDTO(
        full_name=personal_info.full_name,
        email=create_contact_dto(contacts.get("email"), "email"),
        phone=create_contact_dto(contacts.get("phone"), "phone"),
        location=create_contact_dto(contacts.get("location"), "location"),
        linkedin=create_contact_dto(contacts.get("linkedin"), "linkedin"),
        github=create_contact_dto(contacts.get("github"), "github"),
    )


def map_core_competence(
    core_competence: CoreCompetence,
) -> cv_dto.CoreCompetenceDTO:
    return cv_dto.CoreCompetenceDTO(text=core_competence.text)


def map_core_competences(
    core_competences: CoreCompetences,
) -> list[cv_dto.CoreCompetenceDTO]:
    return [map_core_competence(cc) for cc in core_competences.items]


def map_institution(
    institution: University | Company,
) -> cv_dto.InstitutionDTO:
    return cv_dto.InstitutionDTO(
        name=institution.name,
        description=institution.description,
        location=institution.location,
    )


def map_experience(
    experience: Experience,
) -> cv_dto.ExperienceDTO:
    return cv_dto.ExperienceDTO(
        company=map_institution(experience.company),
        position=experience.position,
        start_date=experience.start_date,
        end_date=experience.end_date,
        description=experience.description,
        technologies=experience.technologies,
    )


def map_education(education: Education) -> cv_dto.EducationDTO:
    return cv_dto.EducationDTO(
        university=map_institution(education.university),
        degree=education.degree,
        start_date=education.start_date,
        end_date=education.end_date,
        description=education.description,
    )


def map_skill(skill: Skill) -> cv_dto.SkillDTO:
    return cv_dto.SkillDTO(text=skill.text)


def map_skill_group(
    skill_group: SkillGroup,
) -> cv_dto.SkillGroupDTO:
    return cv_dto.SkillGroupDTO(
        name=skill_group.name, skills=[map_skill(skill) for skill in skill_group.skills]
    )


def map_skills(skills: Skills) -> list[cv_dto.SkillGroupDTO]:
    return [map_skill_group(group) for group in skills.groups]


def map_title(title: Title) -> cv_dto.TitleDTO:
    return cv_dto.TitleDTO(text=title.text)


def map_summary(summary: CVSummary) -> cv_dto.SummaryDTO:
    return cv_dto.SummaryDTO(text=summary.text)


def map_minimal_cv(minimal_cv: Dict[str, Any]) -> cv_dto.MinimalCVDTO:
    return cv_dto.MinimalCVDTO(
        title=map_title(minimal_cv["title"]),
        core_competences=map_core_competences(minimal_cv["core_competences"]),
        experiences=[map_experience(exp) for exp in minimal_cv["experiences"]],
        education=[map_education(edu) for edu in minimal_cv["education"]],
        skills=map_skills(minimal_cv["skills"]),
        language=minimal_cv["language"],
    )


def map_cv(cv: Dict[str, Any]) -> cv_dto.CVDTO:
    return cv_dto.CVDTO(
        personal_info=map_personal_info(cv["personal_info"]),
        title=map_title(cv["title"]),
        summary=map_summary(cv["summary"]),
        core_competences=map_core_competences(cv["core_competences"]),
        experiences=[map_experience(exp) for exp in cv["experiences"]],
        education=[map_education(edu) for edu in cv["education"]],
        skills=map_skills(cv["skills"]),
        language=cv["language"],
    )
