from pathlib import Path
from typing import Any, Generic, List, Optional, Sequence

import yaml

from cv_adapter.dto.cv import CVDTO, CoreCompetencesDTO, MinimalCVDTO, SkillsDTO
from cv_adapter.dto.language import ENGLISH, FRENCH, Language
from cv_adapter.renderers.base import (
    BaseRenderer,
    CVDTOType,
    ListItem,
    RendererError,
    RenderingConfig,
)


class MarkdownListRenderer:
    """Renderer for Markdown lists."""

    @staticmethod
    def render_bullet_list(items: Sequence[ListItem]) -> List[str]:
        """Render items as a bullet point list.

        Args:
            items: Sequence of items to render

        Returns:
            List of lines in Markdown bullet point format
        """
        return [f"* {item.text}" for item in items]


class CoreCompetencesRenderer:
    """Renderer for core competences."""

    @staticmethod
    def render_to_list(core_competences: CoreCompetencesDTO) -> List[str]:
        """Render core competences to a list of strings.

        Args:
            core_competences: Core competences to render

        Returns:
            List of strings representing core competences
        """
        return [item.text for item in core_competences.items]

    @staticmethod
    def render_to_markdown(core_competences: CoreCompetencesDTO) -> str:
        """Render core competences to Markdown format.

        Args:
            core_competences: Core competences to render

        Returns:
            Core competences in Markdown format
        """
        lines = MarkdownListRenderer.render_bullet_list(core_competences.items)
        return "\n".join(lines)


class BaseMarkdownRenderer(BaseRenderer, Generic[CVDTOType]):
    """Base class for Markdown renderers with common rendering logic."""

    def __init__(self, config: Optional[RenderingConfig] = None):
        """Initialize the renderer with optional configuration.

        Args:
            config: Optional rendering configuration
        """
        self.config = config or RenderingConfig()

    def _get_section_label(self, section: str, language: Language) -> str:
        """Get language-specific section labels.

        Args:
            section: Section name
            language: Language for the label

        Returns:
            Localized section label
        """
        return self.config.section_labels.get(
            language, self.config.section_labels[ENGLISH]
        )[section]

    def _render_core_competences(
        self, core_competences: CoreCompetencesDTO, language: Language
    ) -> List[str]:
        """Render core competences section.

        Args:
            core_competences: Core competences to render
            language: Language for section label

        Returns:
            List of lines in Markdown format
        """
        if self.config.core_competences_renderer:
            return self.config.core_competences_renderer(core_competences, language)

        sections = [f"## {self._get_section_label('core_competences', language)}"]
        sections.extend(MarkdownListRenderer.render_bullet_list(core_competences.items))
        sections.append("")
        return sections

    def _render_experiences(
        self, experiences: List[Any], language: Language
    ) -> List[str]:
        """Render experiences section.

        Args:
            experiences: List of experiences to render
            language: Language for section label

        Returns:
            List of lines in Markdown format
        """
        if self.config.experiences_renderer:
            return self.config.experiences_renderer(experiences, language)

        sections = [f"## {self._get_section_label('experience', language)}\n"]
        for exp in experiences:
            sections.append(f"### {exp.position} at {exp.company.name}")
            if exp.company.location:
                sections.append(f"Location: {exp.company.location}")
            sections.append(
                f"Duration: {exp.start_date.strftime('%B %Y')} - "
                f"{exp.end_date.strftime('%B %Y') if exp.end_date else 'Present'}"
            )
            sections.append(exp.description)
            if exp.technologies:
                sections.append("\nTechnologies: " + ", ".join(exp.technologies))
            sections.append("")
        return sections

    def _render_education(self, education: List[Any], language: Language) -> List[str]:
        """Render education section.

        Args:
            education: List of education entries to render
            language: Language for section label

        Returns:
            List of lines in Markdown format
        """
        if self.config.education_renderer:
            return self.config.education_renderer(education, language)

        sections = [f"## {self._get_section_label('education', language)}\n"]
        for edu in education:
            sections.append(f"### {edu.degree}")
            sections.append(f"Institution: {edu.university.name}")
            if edu.university.location:
                sections.append(f"Location: {edu.university.location}")
            sections.append(
                f"Duration: {edu.start_date.strftime('%B %Y')} - "
                f"{edu.end_date.strftime('%B %Y') if edu.end_date else 'Present'}"
            )
            sections.append(edu.description)
            sections.append("")
        return sections

    def _render_skills(self, skills: SkillsDTO, language: Language) -> List[str]:
        """Render skills section.

        Args:
            skills: Skills to render
            language: Language for section label

        Returns:
            List of lines in Markdown format
        """
        if self.config.skills_renderer:
            return self.config.skills_renderer(skills, language)

        sections = [f"## {self._get_section_label('skills', language)}\n"]
        for group in skills.groups:
            sections.append(f"### {group.name}")
            sections.extend(MarkdownListRenderer.render_bullet_list(group.skills))
            sections.append("")
        return sections

    def render_to_string(self, cv_dto: CVDTOType) -> str:
        """Render CV to string representation.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            String representation of the CV in the target format

        Raises:
            RendererError: If rendering fails
        """
        raise NotImplementedError("Subclasses must implement render_to_string")

    def render_to_file(self, cv_dto: CVDTOType, file_path: Path) -> None:
        """Render CV to Markdown file.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the rendered CV

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            markdown = self.render_to_string(cv_dto)
            file_path.write_text(markdown, encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Error saving CV to Markdown file: {e}")


class MarkdownRenderer(BaseMarkdownRenderer[CVDTO]):
    """Renderer for CV in Markdown format."""

    def __init__(self, config: Optional[RenderingConfig] = None):
        """Initialize the renderer with optional configuration.

        Args:
            config: Optional rendering configuration
        """
        if config is None:
            config = RenderingConfig(
                section_labels={
                    ENGLISH: {
                        "experience": "Professional Experience",
                        "education": "Education",
                        "skills": "Skills",
                        "core_competences": "Core Competences",
                    },
                    FRENCH: {
                        "experience": "Expérience Professionnelle",
                        "education": "Formation",
                        "skills": "Compétences",
                        "core_competences": "Compétences Clés",
                    },
                }
            )
        super().__init__(config)

    def _render_yaml_header(self, cv_dto: CVDTO) -> List[str]:
        """Render YAML header with personal information.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            List of lines in YAML format
        """
        if not self.config.include_yaml_header:
            return []

        personal_info = {
            "full_name": cv_dto.personal_info.full_name,
            "contacts": {
                k: v.value
                for k, v in {
                    "email": cv_dto.personal_info.email,
                    "phone": cv_dto.personal_info.phone,
                    "location": cv_dto.personal_info.location,
                    "linkedin": cv_dto.personal_info.linkedin,
                    "github": cv_dto.personal_info.github,
                }.items()
                if v is not None
            },
        }
        yaml_str = yaml.safe_dump(personal_info, default_flow_style=False)
        return ["---", yaml_str.rstrip(), "---", ""]

    def _render_header(self, cv_dto: CVDTO) -> List[str]:
        """Render header section with title and professional summary.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            List of lines in Markdown format
        """
        if not self.config.include_header:
            return []

        return [
            f"## {cv_dto.title.text}",
            cv_dto.summary.text,
            "",
        ]

    def render_to_string(self, cv_dto: CVDTO) -> str:
        """Render CV to Markdown string.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            Markdown string representation of the CV

        Raises:
            RendererError: If rendering fails
        """
        try:
            sections = []

            # YAML Header with Personal Info
            sections.extend(self._render_yaml_header(cv_dto))

            # Header
            sections.extend(self._render_header(cv_dto))

            # Render sections based on configuration
            for section in self.config.include_sections:
                if section == "core_competences":
                    sections.append(
                        f"## {self._get_section_label('core_competences', cv_dto.language)}"
                    )
                    sections.extend(
                        [f"- {cc.text}" for cc in cv_dto.core_competences.items]
                    )
                    sections.append("")
                elif section == "experience":
                    sections.append(
                        f"## {self._get_section_label('experience', cv_dto.language)}"
                    )
                    for exp in cv_dto.experiences:
                        end_year = exp.end_date.year if exp.end_date else "Present"
                        date_str = f"{exp.start_date.year} - {end_year}"
                        sections.append(f"### {exp.position} | {exp.company.name}")
                        sections.append(f"*{date_str}*")
                        sections.append(exp.description)
                        if exp.technologies:
                            sections.append(
                                "**Technologies:** " + ", ".join(exp.technologies)
                            )
                        sections.append("")
                elif section == "education":
                    sections.append(
                        f"## {self._get_section_label('education', cv_dto.language)}"
                    )
                    for edu in cv_dto.education:
                        end_year = edu.end_date.year if edu.end_date else "Present"
                        date_str = f"{edu.start_date.year} - {end_year}"
                        sections.append(f"### {edu.degree} | {edu.university.name}")
                        sections.append(f"*{date_str}*")
                        sections.append(edu.description)
                        sections.append("")
                elif section == "skills":
                    sections.append(
                        f"## {self._get_section_label('skills', cv_dto.language)}"
                    )
                    for group in cv_dto.skills.groups:
                        sections.append(f"### {group.name}")
                        sections.append(", ".join(skill.text for skill in group.skills))
                        sections.append("")

            return "\n".join(sections)

        except Exception as e:
            raise RendererError(f"Error rendering CV to Markdown: {e}")


class MinimalMarkdownRenderer(BaseMarkdownRenderer[MinimalCVDTO]):
    """Renderer for MinimalCVDTO to Markdown format."""

    def render_to_string(self, cv: MinimalCVDTO) -> str:  # type: ignore[override]
        """Render MinimalCVDTO to Markdown string.

        Args:
            cv: MinimalCVDTO object to render

        Returns:
            Markdown string representation of the MinimalCVDTO

        Raises:
            RendererError: If rendering fails
        """
        try:
            sections = []

            # Render sections based on configuration
            for section in self.config.include_sections:
                if section == "core_competences":
                    sections.extend(
                        self._render_core_competences(cv.core_competences, cv.language)
                    )
                elif section == "experience":
                    sections.extend(
                        self._render_experiences(cv.experiences, cv.language)
                    )
                elif section == "education":
                    sections.extend(self._render_education(cv.education, cv.language))
                elif section == "skills":
                    sections.extend(self._render_skills(cv.skills, cv.language))

            return "\n".join(sections)

        except Exception as e:
            raise RendererError(
                f"Failed to render MinimalCVDTO to Markdown: {e}"
            ) from e
