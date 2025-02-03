"""JSON renderer for CV using Pydantic's native serialization capabilities."""

from pathlib import Path

from cv_adapter.dto.cv import CVDTO
from cv_adapter.renderers.base import BaseRenderer, RendererError


class JSONRenderer(BaseRenderer[CVDTO]):
    """Renderer for CV in JSON format.

    This renderer relies entirely on Pydantic's built-in JSON serialization,
    deserialization, and schema generation capabilities.
    """

    def render_to_string(self, cv_dto: CVDTO) -> str:
        """Render CV to JSON string.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            JSON string representation of the CV

        Raises:
            RendererError: If rendering fails
        """
        try:
            return cv_dto.model_dump_json(indent=2)
        except Exception as e:
            raise RendererError(f"Error rendering CV to JSON: {e}")

    def render_to_file(self, cv_dto: CVDTO, file_path: Path) -> None:
        """Render CV to JSON file.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the JSON file

        Raises:
            RendererError: If rendering fails or if the file cannot be written
        """
        try:
            file_path.write_text(self.render_to_string(cv_dto), encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Error saving CV to JSON file: {e}")

    def load_from_string(self, content: str) -> CVDTO:
        """Load CV from JSON string.

        Args:
            content: JSON string to load from

        Returns:
            Loaded CV DTO

        Raises:
            RendererError: If loading fails or validation fails
        """
        try:
            return CVDTO.model_validate_json(content)
        except Exception as e:
            raise RendererError(f"Error loading CV from JSON: {e}")

    def load_from_file(self, file_path: Path) -> CVDTO:
        """Load CV from JSON file.

        Args:
            file_path: Path to JSON file

        Returns:
            Loaded CV DTO

        Raises:
            RendererError: If loading or validation fails
        """
        try:
            return self.load_from_string(file_path.read_text(encoding="utf-8"))
        except Exception as e:
            raise RendererError(f"Error loading CV from JSON file: {e}")
