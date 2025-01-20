from typing import List

from cv_adapter.models.cv import CoreCompetences
from cv_adapter.renderers.markdown_list_renderer import MarkdownListRenderer


class CoreCompetencesRenderer:
    """Renderer for core competences."""

    @staticmethod
    def render_to_list(core_competences: CoreCompetences) -> List[str]:
        """Render core competences to a list of strings.

        Args:
            core_competences: Core competences to render

        Returns:
            List of strings representing core competences
        """
        return [str(item) for item in core_competences.items]

    @staticmethod
    def render_to_markdown(core_competences: CoreCompetences) -> str:
        """Render core competences to Markdown format.

        Args:
            core_competences: Core competences to render

        Returns:
            Core competences in Markdown format
        """
        lines = MarkdownListRenderer.render_bullet_list(core_competences.items)
        return "\n".join(lines)