from pathlib import Path
from typing import Generic, List, TypeVar, Union

from cv_adapter.dto.cv import CVDTO, MinimalCVDTO
from cv_adapter.models.language import Language
from cv_adapter.renderers.base import BaseRenderer, RendererError
from cv_adapter.renderers.markdown.markdown_list_renderer import MarkdownListRenderer

CVDTOType = TypeVar("CVDTOType", CVDTO, MinimalCVDTO)


class BaseMarkdownRenderer(BaseRenderer, Generic[CVDTOType]):
    """Base class for Markdown renderers with common rendering logic."""

    def _get_section_label(self, section: str, language: Language) -> str:
        """Get language-specific section labels.

        Args:
            section: Section name
            language: Language for the label

        Returns:
            Localized section label
        """
        labels = {
            Language.EN: {
                'experience': 'Experience',
                'education': 'Education',
                'skills': 'Skills',
                'core_competences': 'Core Competences'
            },
            Language.FR: {
                'experience': 'Expérience',
                'education': 'Formation',
                'skills': 'Compétences',
                'core_competences': 'Compétences Clés'
            },
            # Add more languages as needed
        }
        return labels.get(language, labels[Language.EN])[section]

    def _render_core_competences(self, core_competences, language: Language) -> List[str]:
        """Render core competences section.

        Args:
            core_competences: Core competences to render
            language: Language for section label

        Returns:
            List of lines in Markdown format
        """
        sections = [f"## {self._get_section_label('core_competences', language)}\n"]
        sections.extend(MarkdownListRenderer.render_bullet_list(core_competences.items))
        sections.append("")
        return sections

    def _render_experiences(self, experiences, language: Language) -> List[str]:
        """Render experiences section.

        Args:
            experiences: List of experiences to render
            language: Language for section label

        Returns:
            List of lines in Markdown format
        """
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

    def _render_education(self, education, language: Language) -> List[str]:
        """Render education section.

        Args:
            education: List of education entries to render
            language: Language for section label

        Returns:
            List of lines in Markdown format
        """
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

    def _render_skills(self, skills, language: Language) -> List[str]:
        """Render skills section.

        Args:
            skills: Skills to render
            language: Language for section label

        Returns:
            List of lines in Markdown format
        """
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

    def render_to_file(self, cv_dto: CVDTOType, file_path: Union[str, Path]) -> None:
        """Render CV to Markdown file.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the rendered CV

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            markdown = self.render_to_string(cv_dto)
            path = Path(file_path)
            path.write_text(markdown, encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Error saving CV to Markdown file: {e}")
