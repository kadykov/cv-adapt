"""Renders CV to Typst format."""

from pathlib import Path
from typing import Optional

from cv_adapter.renderers.base import CVDTOType, RenderingConfig
from cv_adapter.renderers.jinja import Jinja2Renderer


class TypstRenderer(Jinja2Renderer[CVDTOType]):
    """Renderer for CV to Typst format, using Jinja2 templates."""

    def __init__(
        self,
        template_path: Optional[Path] = None,
        template_name: Optional[str] = "typst.typ.j2",
        config: Optional[RenderingConfig] = None,
    ):
        """Initialize the renderer with optional configuration.

        Args:
            template_path: Optional path to custom templates directory.
                       If not provided, uses default templates.
            template_name: Optional name of the template file to use.
                       Defaults to typst.typ.j2.
            config: Optional rendering configuration.
        """
        super().__init__(template_path, template_name, config)
