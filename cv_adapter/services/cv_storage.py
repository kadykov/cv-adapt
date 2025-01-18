from pathlib import Path
from typing import Union

import yaml
from pydantic import ValidationError

from cv_adapter.models.cv import CV
from cv_adapter.renderers import RendererError, YAMLRenderer


class CVStorageError(Exception):
    """Base exception for CV storage operations."""

    pass


class CVStorage:
    """Service for loading and saving CV data in YAML format."""

    def __init__(self, cv_dir: Union[str, Path]):
        """Initialize CV storage with a directory for CV files.

        Args:
            cv_dir: Directory path where CV files are stored
        """
        self.cv_dir = Path(cv_dir)
        self._yaml_renderer = YAMLRenderer()

    def load_cv(self, file_path: Union[str, Path]) -> CV:
        """Load a CV from a YAML file.

        Args:
            file_path: Path to the YAML file containing CV data

        Returns:
            CV object with the loaded data

        Raises:
            CVStorageError: If file doesn't exist, has invalid YAML, or invalid CV data
        """
        file_path = Path(file_path)
        if not file_path.exists():
            raise CVStorageError(f"File not found: {file_path}")

        try:
            with open(file_path) as f:
                data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            raise CVStorageError(f"YAML parsing error: {e}")

        try:
            return CV.model_validate(data)
        except ValidationError as e:
            raise CVStorageError(f"Validation error: {e}")

    def save_cv(self, cv: CV, file_path: Union[str, Path]) -> None:
        """Save a CV to a YAML file.

        Args:
            cv: CV object to save
            file_path: Path where to save the YAML file

        Raises:
            CVStorageError: If there's an error writing the file
        """
        try:
            self._yaml_renderer.render_to_file(cv, file_path)
        except RendererError as e:
            raise CVStorageError(f"Error saving CV: {e}")
