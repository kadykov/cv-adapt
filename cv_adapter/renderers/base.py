from abc import ABC, abstractmethod
from pathlib import Path
from typing import Union

from cv_adapter.models.cv import CV


class RendererError(Exception):
    """Base exception for rendering operations."""

    pass


class BaseRenderer(ABC):
    """Base class for CV renderers."""

    @abstractmethod
    def render_to_string(self, cv: CV) -> str:
        """Render CV to string representation.

        Args:
            cv: CV object to render

        Returns:
            String representation of the CV in the target format

        Raises:
            RendererError: If rendering fails
        """
        pass

    @abstractmethod
    def render_to_file(self, cv: CV, file_path: Union[str, Path]) -> None:
        """Render CV to file.

        Args:
            cv: CV object to render
            file_path: Path where to save the rendered CV

        Raises:
            RendererError: If rendering or saving fails
        """
        pass
