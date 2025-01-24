from pathlib import Path
from typing import Any

import yaml

from cv_adapter.dto.cv import CVDTO
from cv_adapter.dto.language import Language, LanguageCode
from cv_adapter.renderers.base import BaseRenderer, RendererError


class YAMLRenderer(BaseRenderer[CVDTO]):
    """Renderer for CV in YAML format."""

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
            # Convert DTO to a dictionary using Pydantic's model_dump
            cv_dict = cv_dto.model_dump(
                exclude_unset=True,  # Exclude fields not explicitly set
                exclude_none=True,  # Exclude None values
                by_alias=False,  # Use original field names
            )

            # Recursively convert Language objects and Enum to strings
            def convert_language(obj: Any) -> Any:
                if isinstance(obj, Language):
                    return str(obj)
                elif isinstance(obj, LanguageCode):
                    return obj.value
                elif isinstance(obj, dict):
                    return {k: convert_language(v) for k, v in obj.items()}
                elif isinstance(obj, list):
                    return [convert_language(item) for item in obj]
                return obj

            cv_dict = convert_language(cv_dict)

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
