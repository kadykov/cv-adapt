from pathlib import Path
from typing import List, Union

import yaml

from cv_adapter.models.cv import CV
from cv_adapter.renderers.base import RendererError
from cv_adapter.renderers.base_markdown_renderer import BaseMarkdownRenderer


class MarkdownRenderer(BaseMarkdownRenderer[CV]):
    """Renderer for CV in Markdown format."""

    def _render_yaml_header(self, cv: CV) -> List[str]:
        """Render YAML header with personal information.

        Args:
            cv: CV object to render

        Returns:
            List of lines in YAML format
        """
        personal_info = {
            "full_name": cv.personal_info.full_name,
            "contacts": cv.personal_info.contacts,
        }
        yaml_str = yaml.safe_dump(personal_info, default_flow_style=False)
        return ["---", yaml_str.rstrip(), "---", ""]

    def _render_header(self, cv: CV) -> List[str]:
        """Render header section with title and description.

        Args:
            cv: CV object to render

        Returns:
            List of lines in Markdown format
        """
        return [
            f"## {cv.title}",
            cv.description.text,
            "",
        ]

    def render_to_string(self, cv: CV) -> str:
        """Render CV to Markdown string.

        Args:
            cv: CV object to render

        Returns:
            Markdown string representation of the CV

        Raises:
            RendererError: If rendering fails
        """
        try:
            sections = []

            # YAML Header with Personal Info
            sections.extend(self._render_yaml_header(cv))

            # Header
            sections.extend(self._render_header(cv))

            # Core Competences
            sections.extend(self._render_core_competences(cv.core_competences))

            # Experience
            sections.extend(self._render_experiences(cv.experiences))

            # Education
            sections.extend(self._render_education(cv.education))

            # Skills
            sections.extend(self._render_skills(cv.skills))

            return "\n".join(sections)

        except Exception as e:
            raise RendererError(f"Error rendering CV to Markdown: {e}")

    def render_to_file(self, cv: CV, file_path: Union[str, Path]) -> None:
        """Render CV to Markdown file.

        Args:
            cv: CV object to render
            file_path: Path where to save the Markdown file

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            markdown = self.render_to_string(cv)
            path = Path(file_path)
            path.write_text(markdown, encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Error saving CV to Markdown file: {e}")
