import json
from datetime import date
from pathlib import Path
from typing import Any, Dict, List, Union

import jsonschema
from pydantic import TypeAdapter

from cv_adapter.dto.cv import CVDTO
from cv_adapter.dto.language import LanguageCode
from cv_adapter.renderers.base import BaseRenderer, RendererError

JsonType = Union[Dict[str, Any], List[Any], str, int, float, bool, None]


class JSONRenderer(BaseRenderer[CVDTO]):
    """Renderer for CV in JSON format with schema support.

    This renderer provides:
    - JSON schema generation for CV structure
    - Schema validation for input data
    - Special type handling for:
        - Language objects: Converted to language code (e.g. "en", "fr")
        - Date objects: Converted to ISO format strings (e.g. "2023-01-01")
    """

    _schema: Dict[str, Any] = {}

    @classmethod
    def get_json_schema(cls) -> Dict[str, Any]:
        """Generate JSON Schema for CV structure.

        Returns:
            JSON Schema as a dictionary with custom transformations for:
            - Language objects (converted to enum of language codes)
            - Date objects (converted to ISO format date strings)
        """
        if not cls._schema:
            # Get base schema from Pydantic
            adapter = TypeAdapter(CVDTO)
            schema = adapter.json_schema()

            # Add schema metadata and type info
            schema.update(
                {
                    "$schema": "http://json-schema.org/draft-07/schema#",
                    "title": "CV",
                    "description": "CV data with multilingual support",
                }
            )

            # Replace Language object schema with enum of language codes
            schema["properties"]["language"] = {
                "type": "string",
                "enum": [code.value for code in LanguageCode],
                "description": "Language code (e.g. 'en', 'fr')",
            }

            # Helper function to transform schema
            def transform_schema(obj: Dict[str, Any]) -> None:
                """Transform schema objects to handle dates and references."""
                if not isinstance(obj, dict):
                    return

                # Handle $ref by inlining the referenced schema
                if "$ref" in obj:
                    ref_path = obj["$ref"]
                    if ref_path.startswith("#/$defs/"):
                        ref_name = ref_path[8:]  # Remove "#/$defs/"
                        ref_schema = schema.get("$defs", {}).get(ref_name, {})
                        obj.clear()  # Remove $ref
                        obj.update(ref_schema)  # Inline referenced schema

                # Handle dictionary entries
                for key, value in list(
                    obj.items()
                ):  # Use list() to allow dict modification
                    # Transform date fields
                    if isinstance(value, dict):
                        if key.endswith("_date"):
                            value.update(
                                {
                                    "type": "string",
                                    "format": "date",
                                    "pattern": r"^\d{4}-\d{2}-\d{2}$",
                                }
                            )
                        # Recursively process other dictionaries
                        transform_schema(value)
                    elif isinstance(value, list):
                        for item in value:
                            if isinstance(item, dict):
                                transform_schema(item)

            # Transform the entire schema
            transform_schema(schema)
            cls._schema = schema

        return cls._schema

    def validate_json(self, data: JsonType) -> None:
        """Validate JSON data against the CV schema.

        Args:
            data: JSON data to validate

        Raises:
            RendererError: If validation fails with detailed error message
        """
        try:
            jsonschema.validate(instance=data, schema=self.get_json_schema())
        except jsonschema.exceptions.ValidationError as e:
            raise RendererError(f"JSON validation error: {e.message}")

    def render_to_string(self, cv_dto: CVDTO) -> str:
        """Render CV to JSON string with schema validation.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            JSON string representation of the CV with transformed types:
            - Language objects become language code strings (e.g. "en")
            - Dates become ISO format strings (e.g. "2023-01-01")

        Raises:
            RendererError: If rendering fails or validation fails
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

            # Validate the transformed data against schema
            self.validate_json(cv_dict)

            # Convert to JSON string
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
