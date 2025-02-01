import asyncio
from typing import List, Optional

from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import (
    CVDTO,
    CoreCompetenceDTO,
    PersonalInfoDTO,
)

from .async_application import AsyncCVAdapterApplication


class CVAdapterApplication:
    """Main application class that orchestrates the CV adaptation workflow.

    Note: This class provides a synchronous API that internally uses async operations.
    For better performance with concurrent operations, use AsyncCVAdapterApplication.

    This class provides two ways to generate a CV:

    1. Single-step generation using `generate_cv`:
       ```python
       cv = app.generate_cv(cv_text, job_description, personal_info)
       ```

    2. Two-step generation with core competences review:
       ```python
       # First generate core competences for review
       core_competences = app.generate_core_competences(cv_text, job_description)

       # After reviewing/modifying core competences, generate complete CV
       cv = app.generate_cv_with_competences(
           cv_text, job_description, personal_info, core_competences
       )
       ```

    The two-step approach allows users to review and potentially modify the generated
    core competences before they are used to generate the rest of the CV components.
    """

    def __init__(
        self,
        ai_model: KnownModelName = "openai:gpt-4o",
    ) -> None:
        """Initialize the application with an AI model.

        Args:
            ai_model: AI model to use for all generators. Defaults to OpenAI GPT-4o.
        """
        self._async_app = AsyncCVAdapterApplication(ai_model=ai_model)
        # Initialize generators synchronously
        asyncio.run(self._async_app._initialize_generators())

    def generate_core_competences(
        self,
        cv_text: str,
        job_description: str,
        notes: Optional[str] = None,
    ) -> List[CoreCompetenceDTO]:
        """Generate core competences for review.

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            notes: Optional user notes to guide the generation process

        Returns:
            List of generated core competences for review

        Raises:
            RuntimeError: If language context is not set
        """
        from cv_adapter.models.context import get_current_language

        if not get_current_language():
            raise RuntimeError("Language context not set")

        async def _run() -> List[CoreCompetenceDTO]:
            return await self._async_app.generate_core_competences(
                cv_text=cv_text,
                job_description=job_description,
                notes=notes,
            )

        return asyncio.run(_run())

    def generate_cv_with_competences(
        self,
        cv_text: str,
        job_description: str,
        personal_info: PersonalInfoDTO,
        core_competences: List[CoreCompetenceDTO],
        notes: Optional[str] = None,
    ) -> CVDTO:
        """Generate a complete CV using provided core competences.

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            personal_info: Personal information to include in the CV
            core_competences: Pre-generated and confirmed core competences
            notes: Optional user notes to guide the generation process

        Returns:
            A new CV DTO adapted to the job description

        Raises:
            RuntimeError: If language context is not set
        """
        from cv_adapter.models.context import get_current_language

        if not get_current_language():
            raise RuntimeError("Language context not set")

        async def _run() -> CVDTO:
            return await self._async_app.generate_cv_with_competences(
                cv_text=cv_text,
                job_description=job_description,
                personal_info=personal_info,
                core_competences=core_competences,
                notes=notes,
            )

        return asyncio.run(_run())

    def generate_cv(
        self,
        cv_text: str,
        job_description: str,
        personal_info: PersonalInfoDTO,
        notes: Optional[str] = None,
    ) -> CVDTO:
        """Generate a new CV adapted to the job description in a single step.

        This method generates the complete CV in one step without the opportunity to
        review core competences. If you need to review and potentially modify the
        core competences before generating the complete CV, use the two-step process:
        1. `generate_core_competences()`
        2. `generate_cv_with_competences()`

        Args:
            cv_text: The original detailed CV text
            job_description: The job description to adapt the CV for
            personal_info: Personal information to include in the CV
            notes: Optional user notes to guide the generation process

        Returns:
            A new CV DTO adapted to the job description
        """
        from cv_adapter.models.context import get_current_language

        if not get_current_language():
            raise RuntimeError("Language context not set")

        async def _run() -> CVDTO:
            return await self._async_app.generate_cv(
                cv_text=cv_text,
                job_description=job_description,
                personal_info=personal_info,
                notes=notes,
            )

        return asyncio.run(_run())
