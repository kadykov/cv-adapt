from typing import Optional, Union

from cv_adapter.dto import cv as cv_dto
from cv_adapter.models import language_context_models
from cv_adapter.models import personal_info as personal_info_models


def map_personal_info(
    personal_info: Union[personal_info_models.PersonalInfo, cv_dto.PersonalInfoDTO],
) -> cv_dto.PersonalInfoDTO:
    # If already a DTO, return as-is
    if isinstance(personal_info, cv_dto.PersonalInfoDTO):
        return personal_info

    # Extract contacts from the contacts dictionary
    contacts = personal_info.contacts or {}

    # Helper function to create ContactDTO with smart defaults
    def create_contact_dto(
        value: Optional[str], contact_type: str
    ) -> Optional[cv_dto.ContactDTO]:
        if not value:
            return None

        # Define contact-specific metadata
        contact_metadata = {
            "email": {"icon": "email", "url": f"mailto:{value}", "type": "primary"},
            "phone": {"icon": "phone", "url": f"tel:{value}", "type": "primary"},
            "linkedin": {
                "icon": "linkedin",
                "url": f"https://linkedin.com/in/{value}",
                "type": "social",
            },
            "github": {
                "icon": "github",
                "url": f"https://github.com/{value}",
                "type": "social",
            },
            "location": {"icon": "location", "type": "location"},
        }

        metadata = contact_metadata.get(contact_type, {})
        return cv_dto.ContactDTO(
            value=value,
            type=metadata.get("type"),
            icon=metadata.get("icon"),
            url=metadata.get("url"),
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
    core_competence: language_context_models.CoreCompetence,
) -> cv_dto.CoreCompetenceDTO:
    return cv_dto.CoreCompetenceDTO(text=core_competence.text)


def map_core_competences(
    core_competences: language_context_models.CoreCompetences,
) -> cv_dto.CoreCompetencesDTO:
    return cv_dto.CoreCompetencesDTO(
        items=[map_core_competence(cc) for cc in core_competences.items]
    )


def map_institution(
    institution: language_context_models.Institution,
) -> cv_dto.InstitutionDTO:
    return cv_dto.InstitutionDTO(
        name=institution.name,
        description=institution.description,
        location=institution.location,
    )


def map_experience(
    experience: language_context_models.Experience,
) -> cv_dto.ExperienceDTO:
    return cv_dto.ExperienceDTO(
        company=map_institution(experience.company),
        position=experience.position,
        start_date=experience.start_date,
        end_date=experience.end_date,
        description=experience.description,
        technologies=experience.technologies,
    )


def map_education(education: language_context_models.Education) -> cv_dto.EducationDTO:
    return cv_dto.EducationDTO(
        university=map_institution(education.university),
        degree=education.degree,
        start_date=education.start_date,
        end_date=education.end_date,
        description=education.description,
    )


def map_skill(skill: language_context_models.Skill) -> cv_dto.SkillDTO:
    return cv_dto.SkillDTO(text=skill.text)


def map_skill_group(
    skill_group: language_context_models.SkillGroup,
) -> cv_dto.SkillGroupDTO:
    return cv_dto.SkillGroupDTO(
        name=skill_group.name, skills=[map_skill(skill) for skill in skill_group.skills]
    )


def map_skills(skills: language_context_models.Skills) -> cv_dto.SkillsDTO:
    return cv_dto.SkillsDTO(groups=[map_skill_group(group) for group in skills.groups])


def map_title(title: language_context_models.Title) -> cv_dto.TitleDTO:
    return cv_dto.TitleDTO(text=title.text)


def map_summary(summary: str) -> cv_dto.SummaryDTO:
    return cv_dto.SummaryDTO(text=summary)


def map_minimal_cv(minimal_cv: dict) -> cv_dto.MinimalCVDTO:
    return cv_dto.MinimalCVDTO(
        title=map_title(minimal_cv["title"]),
        core_competences=map_core_competences(minimal_cv["core_competences"]),
        experiences=[map_experience(exp) for exp in minimal_cv["experiences"]],
        education=[map_education(edu) for edu in minimal_cv["education"]],
        skills=map_skills(minimal_cv["skills"]),
        language=minimal_cv["language"],
    )


def map_cv(cv: dict) -> cv_dto.CVDTO:
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
