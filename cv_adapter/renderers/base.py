from abc import ABC, abstractmethod
from pathlib import Path
from typing import Generic, TypeVar

from cv_adapter.dto.cv import CVDTO, MinimalCVDTO


class RendererError(Exception):
    """Base exception for rendering operations."""

    pass


CVDTOType = TypeVar("CVDTOType", CVDTO, MinimalCVDTO)


class BaseRenderer(ABC, Generic[CVDTOType]):
    """Base class for CV renderers."""

    @abstractmethod
    def render_to_string(self, cv_dto: CVDTOType) -> str:
        """Render CV to string representation.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            String representation of the CV in the target format

        Raises:
            RendererError: If rendering fails
        """
        pass

    @abstractmethod
    def render_to_file(self, cv_dto: CVDTOType, file_path: Path) -> None:
        """Render CV to file.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the rendered CV

        Raises:
            RendererError: If rendering or saving fails
        """
        pass
