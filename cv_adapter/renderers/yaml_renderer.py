from dataclasses import asdict
from pathlib import Path
from typing import Any

import yaml

from cv_adapter.dto.cv import CVDTO
from cv_adapter.dto.language import Language
from cv_adapter.renderers.base import BaseRenderer, RendererError


class YAMLRenderer(BaseRenderer[CVDTO]):
    """Renderer for CV in YAML format."""

    def _convert_to_dict(self, obj: Any) -> Any:
        """Recursively convert objects to dictionaries.

        Args:
            obj: Object to convert

        Returns:
            Converted dictionary representation
        """
        if isinstance(obj, Language):
            return str(obj)
        elif isinstance(obj, dict):
            return {k: self._convert_to_dict(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_to_dict(item) for item in obj]
        elif hasattr(obj, "__dict__"):
            # Convert dataclass or object to dictionary and recursively convert
            try:
                # First try dataclass conversion
                return {
                    k: self._convert_to_dict(v)
                    for k, v in asdict(obj).items()
                    if not k.startswith("_") and v is not None
                }
            except TypeError:
                # Fallback to __dict__ conversion
                return {
                    k: self._convert_to_dict(v)
                    for k, v in obj.__dict__.items()
                    if not k.startswith("_") and v is not None
                }
        return obj

    def render_to_string(self, cv_dto: CVDTO) -> str:
        """Render CV to YAML string.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            YAML string representation of the CV

        Raises:
            RendererError: If rendering fails
        """
        try:
            # Convert DTO to a dictionary
            cv_dict = self._convert_to_dict(cv_dto)
            return yaml.safe_dump(
                cv_dict,
                default_flow_style=False,
                allow_unicode=True,
                sort_keys=False,
            )
        except Exception as e:
            raise RendererError(f"Error rendering CV to YAML: {e}")

    def render_to_file(self, cv_dto: CVDTO, file_path: Path) -> None:
        """Render CV to YAML file.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the YAML file

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            file_path.write_text(self.render_to_string(cv_dto), encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Error saving CV to YAML file: {e}")
