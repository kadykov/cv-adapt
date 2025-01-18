from pathlib import Path
from typing import Union

import yaml

from cv_adapter.models.cv import CV
from cv_adapter.renderers.base import BaseRenderer, RendererError


class YAMLRenderer(BaseRenderer):
    """Renderer for CV in YAML format."""

    def render_to_string(self, cv: CV) -> str:
        """Render CV to YAML string.

        Args:
            cv: CV object to render

        Returns:
            YAML string representation of the CV

        Raises:
            RendererError: If rendering fails
        """
        try:
            return yaml.safe_dump(
                cv.model_dump(mode="json"),
                default_flow_style=False,
                allow_unicode=True,
                sort_keys=False,
            )
        except Exception as e:
            raise RendererError(f"Error rendering CV to YAML: {e}")

    def render_to_file(self, cv: CV, file_path: Union[str, Path]) -> None:
        """Render CV to YAML file.

        Args:
            cv: CV object to render
            file_path: Path where to save the YAML file

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            with open(file_path, "w") as f:
                f.write(self.render_to_string(cv))
        except Exception as e:
            raise RendererError(f"Error saving CV to YAML file: {e}")
