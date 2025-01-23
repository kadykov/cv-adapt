from pathlib import Path
from typing import List

import yaml

from cv_adapter.dto.cv import CVDTO, LanguageDTO
from cv_adapter.renderers.base import RendererError
from cv_adapter.renderers.markdown.base_markdown_renderer import BaseMarkdownRenderer


class MarkdownRenderer(BaseMarkdownRenderer[CVDTO]):
    """Renderer for CV in Markdown format."""

    def _get_section_label(self, section: str, language: LanguageDTO) -> str:
        """Get language-specific section labels.

        Args:
            section: Section name
            language: Language for the label

        Returns:
            Localized section label
        """
        labels = {
            LanguageDTO.ENGLISH: {
                "experience": "Professional Experience",
                "education": "Education",
                "skills": "Skills",
                "core_competences": "Core Competences",
            },
            LanguageDTO.FRENCH: {
                "experience": "Expérience Professionnelle",
                "education": "Formation",
                "skills": "Compétences",
                "core_competences": "Compétences Clés",
            },
            # Add more languages as needed
        }
        return labels.get(language, labels[LanguageDTO.ENGLISH])[section]

    def _render_yaml_header(self, cv_dto: CVDTO) -> List[str]:
        """Render YAML header with personal information.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            List of lines in YAML format
        """
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

            # Core Competences
            sections.append(
                f"## {self._get_section_label('core_competences', cv_dto.language)}"
            )
            sections.extend([f"- {cc.text}" for cc in cv_dto.core_competences.items])
            sections.append("")

            # Experience
            sections.append(
                f"## {self._get_section_label('experience', cv_dto.language)}"
            )
            for exp in cv_dto.experiences:
                # Render experience details
                end_year = exp.end_date.year if exp.end_date else "Present"
                date_str = f"{exp.start_date.year} - {end_year}"
                sections.append(f"### {exp.position} | {exp.company.name}")
                sections.append(f"*{date_str}*")
                sections.append(exp.description)
                if exp.technologies:
                    sections.append("**Technologies:** " + ", ".join(exp.technologies))
                sections.append("")

            # Education
            sections.append(
                f"## {self._get_section_label('education', cv_dto.language)}"
            )
            for edu in cv_dto.education:
                # Render education details
                end_year = edu.end_date.year if edu.end_date else "Present"
                date_str = f"{edu.start_date.year} - {end_year}"
                sections.append(f"### {edu.degree} | {edu.university.name}")
                sections.append(f"*{date_str}*")
                sections.append(edu.description)
                sections.append("")

            # Skills
            sections.append(f"## {self._get_section_label('skills', cv_dto.language)}")
            for group in cv_dto.skills.groups:
                sections.append(f"### {group.name}")
                sections.append(", ".join(skill.text for skill in group.skills))
                sections.append("")

            return "\n".join(sections)

        except Exception as e:
            raise RendererError(f"Error rendering CV to Markdown: {e}")

    def render_to_file(self, cv_dto: CVDTO, file_path: Path) -> None:
        """Render CV to Markdown file.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the Markdown file

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            markdown = self.render_to_string(cv_dto)
            file_path.write_text(markdown, encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Error saving CV to Markdown file: {e}")
