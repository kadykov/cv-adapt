from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from pathlib import Path
from typing import (
    Any,
    Callable,
    Dict,
    Generic,
    List,
    Optional,
    Protocol,
    TypeVar,
)

from cv_adapter.dto.cv import CVDTO, CoreCompetenceDTO, MinimalCVDTO, SkillGroupDTO
from cv_adapter.dto.language import ENGLISH, FRENCH, Language


class RendererError(Exception):
    """Base exception for rendering operations."""

    pass


CVDTOType = TypeVar("CVDTOType", CVDTO, MinimalCVDTO)


class ListItem(Protocol):
    """Protocol for items that can be rendered as list items."""

    def __str__(self) -> str:
        """Convert item to string representation.

        Returns:
            String representation of the item
        """
        ...

    @property
    def text(self) -> str:
        """Get the text representation of the item."""
        return str(self)


@dataclass
class RenderingConfig:
    """Configuration for rendering."""

    # Customizable section rendering strategies
    core_competences_renderer: Optional[
        Callable[[List[CoreCompetenceDTO], Language], List[str]]
    ] = None
    experiences_renderer: Optional[Callable[[List[Any], Language], List[str]]] = None
    education_renderer: Optional[Callable[[List[Any], Language], List[str]]] = None
    skills_renderer: Optional[Callable[[List[SkillGroupDTO], Language], List[str]]] = (
        None
    )

    # Customizable section labels
    section_labels: Dict[Language, Dict[str, str]] = field(
        default_factory=lambda: {
            ENGLISH: {
                "experience": "Professional Experience",
                "education": "Education",
                "skills": "Skills",
                "core_competences": "Core Competences",
            },
            FRENCH: {
                "experience": "Expérience Professionnelle",
                "education": "Formation",
                "skills": "Compétences",
                "core_competences": "Compétences Clés",
            },
        }
    )

    # Rendering options
    include_yaml_header: bool = True
    include_header: bool = True
    include_sections: List[str] = field(
        default_factory=lambda: [
            "core_competences",
            "experience",
            "education",
            "skills",
        ]
    )


class BaseRenderer(ABC, Generic[CVDTOType]):
    """Base class for CV renderers."""

    def __init__(self, config: Optional[RenderingConfig] = None):
        """Initialize the renderer with optional configuration.

        Args:
            config: Optional rendering configuration
        """
        self.config = config or RenderingConfig()

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
