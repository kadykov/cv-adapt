"""Protocol definitions for CV generation services."""

from typing import Dict, List, Optional, Protocol

from cv_adapter.dto.cv import CVDTO, CoreCompetenceDTO, PersonalInfoDTO
from cv_adapter.dto.language import Language

from ...schemas.cv import GeneratedCVResponse


class CVGenerationService(Protocol):
    """Protocol for CV generation services."""

    async def generate_competences(
        self,
        cv_text: str,
        job_description: str,
        notes: Optional[str] = None,
        language: Optional[Language] = None,
    ) -> List[CoreCompetenceDTO]:
        """Generate core competences from CV and job description."""
        ...

    async def generate_cv(
        self,
        cv_text: str,
        job_description: str,
        personal_info: PersonalInfoDTO,
        competences: List[CoreCompetenceDTO],
        notes: Optional[str] = None,
        language: Optional[Language] = None,
    ) -> CVDTO:
        """Generate a complete CV using core competences."""
        ...

    async def generate_and_store_cv(
        self,
        user_id: int,
        detailed_cv_id: int,
        job_description_id: int,
        language_code: str,
        generation_parameters: Optional[Dict] = None,
        notes: Optional[str] = None,
    ) -> GeneratedCVResponse:
        """Generate and save a CV to the database.

        Args:
            user_id: ID of the user requesting generation
            detailed_cv_id: ID of the detailed CV to use as base
            job_description_id: ID of the job description to target
            language_code: Language code for generation context
            generation_parameters: Optional parameters to guide generation
            notes: Optional notes for generation

        Returns:
            GeneratedCVResponse containing the stored CV data

        Raises:
            EntityNotFoundError: If detailed CV or job description not found
            ValidationError: If data validation fails
            GenerationError: If CV generation fails
        """
        ...

    async def update_cv_status(
        self,
        cv_id: int,
        status: str,
    ) -> GeneratedCVResponse:
        """Update the status of a generated CV.

        Args:
            cv_id: ID of the generated CV
            status: New status (draft/approved/rejected)

        Returns:
            Updated GeneratedCVResponse

        Raises:
            EntityNotFoundError: If CV not found
            ValidationError: If status invalid
        """
        ...

    async def update_generation_parameters(
        self,
        cv_id: int,
        parameters: Dict,
    ) -> GeneratedCVResponse:
        """Update generation parameters for a CV.

        Args:
            cv_id: ID of the generated CV
            parameters: New generation parameters

        Returns:
            Updated GeneratedCVResponse

        Raises:
            EntityNotFoundError: If CV not found
            ValidationError: If parameters invalid
        """
        ...
