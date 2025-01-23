from pathlib import Path

from cv_adapter.dto.cv import MinimalCVDTO
from cv_adapter.renderers.base import RendererError
from cv_adapter.renderers.markdown.base_markdown_renderer import BaseMarkdownRenderer


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

            # Core Competences
            sections.extend(
                self._render_core_competences(cv.core_competences, cv.language)
            )

            # Experience
            sections.extend(self._render_experiences(cv.experiences, cv.language))

            # Education
            sections.extend(self._render_education(cv.education, cv.language))

            # Skills
            sections.extend(self._render_skills(cv.skills, cv.language))

            return "\n".join(sections)

        except Exception as e:
            raise RendererError(
                f"Failed to render MinimalCVDTO to Markdown: {e}"
            ) from e

    def render_to_file(
        self,
        cv: MinimalCVDTO,
        file_path: Path,  # type: ignore[override]
    ) -> None:
        """Render MinimalCVDTO to Markdown file.

        Args:
            cv: MinimalCVDTO object to render
            file_path: Path where to save the rendered MinimalCVDTO

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            markdown = self.render_to_string(cv)
            file_path.write_text(markdown, encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Failed to save MinimalCVDTO to file: {e}") from e
