"""Renders CV to PDF format using system-installed Typst."""

import shutil
import subprocess
from pathlib import Path
from typing import Optional, Union

from cv_adapter.dto.cv import CVDTO, MinimalCVDTO
from cv_adapter.renderers.base import (
    BaseRenderer,
    CVDTOType,
    RendererError,
    RenderingConfig,
)
from cv_adapter.renderers.typst import TypstRenderer


class PDFRenderer(BaseRenderer[CVDTOType]):
    """Renderer for CV to PDF format using system-installed Typst.

    This renderer requires the `typst` command-line tool to be installed on your system.
    You can install it via package managers:
        - macOS: `brew install typst`
        - Linux: Download from GitHub releases (https://github.com/typst/typst)
    """

    def __init__(
        self,
        config: Optional[RenderingConfig] = None,
    ):
        """Initialize the renderer with optional configuration.

        Args:
            config: Optional rendering configuration.

        Raises:
            RendererError: If typst is not installed on the system.
        """
        super().__init__(config)
        self.typst_renderer = TypstRenderer()
        self.verify_typst_available()

    @staticmethod
    def verify_typst_available() -> None:
        """Verify that the typst command-line tool is available.

        Raises:
            RendererError: If typst is not found on the system PATH.
        """
        if not shutil.which("typst"):
            raise RendererError(
                "typst command not found. Please install Typst:\n"
                "  - macOS: brew install typst\n"
                "  - Linux: Download from https://github.com/typst/typst"
            )

    def render_to_string(self, cv_dto: Union[CVDTO, MinimalCVDTO]) -> str:
        """Render CV to Typst source string.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            String representation of the CV in Typst format

        Raises:
            RendererError: If rendering fails
        """
        return self.typst_renderer.render_to_string(cv_dto)

    def render_to_bytes(self, cv_dto: Union[CVDTO, MinimalCVDTO]) -> bytes:
        """Render CV to PDF bytes using system typst command.

        Uses stdin/stdout streaming for efficient processing without temporary files.

        Args:
            cv_dto: CV DTO object to render

        Returns:
            PDF content as bytes

        Raises:
            RendererError: If rendering fails or typst is not available
        """
        try:
            typst_source = self.render_to_string(cv_dto)

            # Use subprocess to pipe source to typst and get PDF bytes
            process = subprocess.run(
                ["typst", "compile", "-", "-"],
                input=typst_source.encode(),
                capture_output=True,
                check=True,
            )

            return process.stdout

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr.decode()
            raise RendererError(
                f"Typst compilation failed: {error_msg}\n"
                "Please ensure you have Typst installed correctly."
            )
        except Exception as e:
            raise RendererError(f"Error rendering CV to PDF: {e}")

    def render_to_file(
        self, cv_dto: Union[CVDTO, MinimalCVDTO], file_path: Path
    ) -> None:
        """Render CV to PDF file using system typst command.

        Args:
            cv_dto: CV DTO object to render
            file_path: Path where to save the rendered PDF

        Raises:
            RendererError: If rendering or saving fails
        """
        try:
            pdf_bytes = self.render_to_bytes(cv_dto)
            file_path.write_bytes(pdf_bytes)

        except Exception as e:
            raise RendererError(f"Error rendering CV to PDF: {e}")
