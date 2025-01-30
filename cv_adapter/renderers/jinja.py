from pathlib import Path
from typing import Generic, Optional, Union

from jinja2 import Environment, FileSystemLoader, select_autoescape

from cv_adapter.dto.cv import CVDTO, MinimalCVDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.renderers.base import (
    BaseRenderer,
    CVDTOType,
    RendererError,
    RenderingConfig,
)


class Jinja2Renderer(BaseRenderer, Generic[CVDTOType]):
    """Renderer for CV using Jinja2 templates."""

    def __init__(
        self,
        template_path: Optional[Path] = None,
        template_name: str = "base.j2",
        config: Optional[RenderingConfig] = None,
    ):
        """Initialize the renderer with optional configuration.

        Args:
            template_path: Optional path to custom templates directory.
                         If not provided, uses default templates.
            template_name: Name of the template file to use (default: base.j2)
            config: Optional rendering configuration
        """
        super().__init__(config or RenderingConfig(language=ENGLISH))

        # Use provided template path or default to package templates
        if template_path:
            self.template_path = template_path
        else:
            self.template_path = Path(__file__).parent / "templates"

        self.template_name = template_name
        self.env = self._create_jinja_env()

    def _create_jinja_env(self) -> Environment:
        """Create and configure Jinja2 environment.

        Returns:
            Configured Jinja2 Environment

        Raises:
            RendererError: If template directory doesn't exist or environment creation
                fails
        """
        if not self.template_path.exists():
            raise RendererError(
                f"Template directory does not exist: {self.template_path}"
            )

        try:
            return Environment(
                loader=FileSystemLoader(str(self.template_path)),
                autoescape=select_autoescape(),
                trim_blocks=True,
                lstrip_blocks=True,
            )
        except Exception as e:
            raise RendererError(f"Failed to create Jinja2 environment: {e}")

    def render_to_string(self, cv_dto: Union[CVDTO, MinimalCVDTO]) -> str:
        """Render CV to string representation using Jinja2 template.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            String representation of the CV in the target format

        Raises:
            RendererError: If rendering fails
        """
        try:
            template = self.env.get_template(self.template_name)
            return template.render(
                cv=cv_dto,
                config=self.config,
            )
        except Exception as e:
            raise RendererError(f"Error rendering CV with Jinja2: {e}")

    def render_to_file(
        self, cv_dto: Union[CVDTO, MinimalCVDTO], file_path: Path
    ) -> None:
        """Render CV to file using Jinja2 template.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the rendered CV

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            content = self.render_to_string(cv_dto)
            file_path.write_text(content, encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Error saving CV to file: {e}")
