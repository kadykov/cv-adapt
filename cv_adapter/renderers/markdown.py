"""Markdown renderer implementations using Jinja2 templates."""

from pathlib import Path
from typing import Generic, List, Optional, Sequence

from cv_adapter.dto.cv import CVDTO, CoreCompetenceDTO, MinimalCVDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.renderers.base import (
    BaseRenderer,
    CVDTOType,
    ListItem,
    RenderingConfig,
)
from cv_adapter.renderers.jinja import Jinja2Renderer


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
    def render_to_list(core_competences: List[CoreCompetenceDTO]) -> List[str]:
        """Render core competences to a list of strings.

        Args:
            core_competences: Core competences to render

        Returns:
            List of strings representing core competences
        """
        return [item.text for item in core_competences]

    @staticmethod
    def render_to_markdown(core_competences: List[CoreCompetenceDTO]) -> str:
        """Render core competences to Markdown format.

        Args:
            core_competences: Core competences to render

        Returns:
            Core competences in Markdown format
        """
        lines = MarkdownListRenderer.render_bullet_list(core_competences)
        return "\n".join(lines)


class BaseMarkdownRenderer(BaseRenderer, Generic[CVDTOType]):
    """Base class for Markdown renderers using Jinja2 templates."""

    def __init__(self, config: Optional[RenderingConfig] = None):
        """Initialize the renderer with optional configuration.

        Args:
            config: Optional rendering configuration
        """
        super().__init__(config or RenderingConfig(language=ENGLISH))
        self._jinja_renderer = Jinja2Renderer(config=self.config)

    def render_to_string(self, cv_dto: CVDTOType) -> str:
        """Render CV to string representation.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            String representation of the CV in the target format

        Raises:
            RendererError: If rendering fails
        """
        return self._jinja_renderer.render_to_string(cv_dto)

    def render_to_file(self, cv_dto: CVDTOType, file_path: Path) -> None:
        """Render CV to Markdown file.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the rendered CV

        Raises:
            RendererError: If rendering or saving fails
        """
        self._jinja_renderer.render_to_file(cv_dto, file_path)


class MarkdownRenderer(BaseMarkdownRenderer[CVDTO]):
    """Renderer for CV in Markdown format using Jinja2 template."""

    def __init__(self, config: Optional[RenderingConfig] = None):
        """Initialize the renderer with optional configuration.

        Args:
            config: Optional rendering configuration
        """
        super().__init__(config or RenderingConfig(language=ENGLISH))
        self._jinja_renderer = Jinja2Renderer(
            template_name="base.j2",
            config=self.config,
        )


class MinimalMarkdownRenderer(BaseMarkdownRenderer[MinimalCVDTO]):
    """Renderer for MinimalCVDTO to Markdown format using Jinja2 template."""

    def __init__(self, config: Optional[RenderingConfig] = None):
        """Initialize the renderer with optional configuration.

        Args:
            config: Optional rendering configuration
        """
        super().__init__(config or RenderingConfig(language=ENGLISH))
        self._jinja_renderer = Jinja2Renderer(
            template_name="minimal.j2",
            config=self.config,
        )
