from pathlib import Path
from typing import Union

from cv_adapter.models.cv import MinimalCV
from cv_adapter.renderers.base import RendererError
from cv_adapter.renderers.markdown.base_markdown_renderer import BaseMarkdownRenderer


class MinimalMarkdownRenderer(BaseMarkdownRenderer[MinimalCV]):
    """Renderer for MinimalCV to Markdown format."""

    def render_to_string(self, cv: MinimalCV) -> str:  # type: ignore[override]
        """Render MinimalCV to Markdown string.

        Args:
            cv: MinimalCV object to render

        Returns:
            Markdown string representation of the MinimalCV

        Raises:
            RendererError: If rendering fails
        """
        try:
            sections = []

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
            raise RendererError(f"Failed to render MinimalCV to Markdown: {e}") from e

    def render_to_file(
        self,
        cv: MinimalCV,
        file_path: Union[str, Path],  # type: ignore[override]
    ) -> None:
        """Render MinimalCV to Markdown file.

        Args:
            cv: MinimalCV object to render
            file_path: Path where to save the rendered MinimalCV

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            markdown = self.render_to_string(cv)
            path = Path(file_path)
            path.write_text(markdown, encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Failed to save MinimalCV to file: {e}") from e
