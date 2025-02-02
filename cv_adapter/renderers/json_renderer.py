import json
from datetime import date
from pathlib import Path
from typing import Any

from cv_adapter.dto.cv import CVDTO
from cv_adapter.renderers.base import BaseRenderer, RendererError


class JSONRenderer(BaseRenderer[CVDTO]):
    """Renderer for CV in JSON format.

    This renderer converts CV data to JSON, with special handling for:
    - Language objects: Converted to their language code (e.g. "en", "fr")
    - Date objects: Converted to ISO format strings (e.g. "2023-01-01")
    """

    def render_to_string(self, cv_dto: CVDTO) -> str:
        """Render CV to JSON string.

        The rendering process:
        1. Converts Language objects to their code values
           (e.g. Language(ENGLISH) -> "en")
        2. Converts the DTO to a dictionary using model_dump()
        3. Recursively transforms date objects to ISO format strings
        4. Serializes to a JSON string with proper formatting

        Args:
            cv_dto: CV DTO object to render

        Returns:
            JSON string representation of the CV with transformed types:
            - Language objects become language code strings (e.g. "en")
            - Dates become ISO format strings (e.g. "2023-01-01")
            - All other types are serialized normally

        Raises:
            RendererError: If rendering fails (e.g. unsupported types)
        """
        try:
            # Convert DTO to dictionary
            cv_dict = cv_dto.model_dump(
                exclude_unset=True,  # Exclude fields not explicitly set
                exclude_none=True,  # Exclude None values
                by_alias=False,  # Use original field names
            )

            # Convert Language object to code string
            if "language" in cv_dict and cv_dict["language"]:
                cv_dict["language"] = cv_dict["language"]["code"]

            # Helper function to transform remaining objects
            def transform_dates(value: Any) -> Any:
                if isinstance(value, date):
                    return value.isoformat()
                elif isinstance(value, dict):
                    return {k: transform_dates(v) for k, v in value.items()}
                elif isinstance(value, list):
                    return [transform_dates(item) for item in list(value)]
                return value

            # Transform dates in the dictionary
            cv_dict = transform_dates(cv_dict)

            return json.dumps(
                cv_dict,
                indent=2,
                ensure_ascii=False,  # Allow non-ASCII characters
            )
        except Exception as e:
            raise RendererError(f"Error rendering CV to JSON: {e}")

    def render_to_file(self, cv_dto: CVDTO, file_path: Path) -> None:
        """Render CV to JSON file.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the JSON file. The file will be encoded
                in UTF-8.

        Raises:
            RendererError: If rendering fails or if the file cannot be written
                (e.g. permission denied, invalid path)
        """
        try:
            file_path.write_text(self.render_to_string(cv_dto), encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Error saving CV to JSON file: {e}")
