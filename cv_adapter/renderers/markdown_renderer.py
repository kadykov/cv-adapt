from pathlib import Path
from typing import List, Union

from cv_adapter.models.cv import CV
from cv_adapter.renderers.base import RendererError
from cv_adapter.renderers.base_markdown_renderer import BaseMarkdownRenderer


class MarkdownRenderer(BaseMarkdownRenderer[CV]):
    """Renderer for CV in Markdown format."""

    def _render_header(self, cv: CV) -> List[str]:
        """Render header section with name, title and description.

        Args:
            cv: CV object to render

        Returns:
            List of lines in Markdown format
        """
        return [
            f"# {cv.full_name}",
            f"## {cv.title}",
            cv.description.text,
            "",
        ]

    def _render_contacts(self, cv: CV) -> List[str]:
        """Render contacts section.

        Args:
            cv: CV object to render

        Returns:
            List of lines in Markdown format
        """
        sections = ["## Contacts\n"]
        sections.extend(f"* {k}: {v}" for k, v in cv.contacts.items())
        sections.append("")
        return sections

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

            # Contacts
            sections.extend(self._render_contacts(cv))

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
