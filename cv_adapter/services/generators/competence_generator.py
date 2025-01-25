"""Service for generating core competences based on CV and job description."""

import os
from typing import Any, List, Optional

from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.language import Language
from cv_adapter.dto.mapper import map_core_competences
from cv_adapter.models.language_context import get_current_language
from cv_adapter.models.language_context_models import CoreCompetences
from cv_adapter.services.generators.base_generator import BaseGenerator


class CompetenceGenerator(BaseGenerator[CoreCompetenceDTO]):
    """Generates relevant core competences based on CV and job description."""

    def __init__(
        self,
        ai_model: KnownModelName = "openai:gpt-4o",
        system_prompt_template_path: Optional[str] = None,
        context_template_path: Optional[str] = None,
    ) -> None:
        """
        Initialize the competence generator.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
            system_prompt_template_path: Optional path to system prompt template.
                Defaults to the package's default template.
            context_template_path: Optional path to context generation template.
                Defaults to the package's default template.
        """
        # Set default system prompt template if not provided
        if system_prompt_template_path is None:
            system_prompt_template_path = os.path.join(
                os.path.dirname(__file__), "templates", "competence_system_prompt.j2"
            )

        # Set default context template if not provided
        if context_template_path is None:
            context_template_path = os.path.join(
                os.path.dirname(__file__), "templates", "competence_context.j2"
            )

        super().__init__(
            ai_model,
            system_prompt_template_path,
            context_template_path,
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        language: Optional["Language"] = None,
        notes: Optional[str] = None,
        **kwargs: Any,
    ) -> List[CoreCompetenceDTO]:
        """
        Generate core competences based on CV and job description.

        Args:
            cv: Text of the CV
            job_description: Job description text
            language: Optional language for generation
            notes: Optional additional notes for context

        Returns:
            List of core competence DTOs relevant for the job

        Raises:
            ValueError: If input parameters are invalid
        """
        # Validate input parameters
        if not cv or not cv.strip():
            raise ValueError("CV text is required")
        if not job_description:
            raise ValueError("Job description is required")

        # Use _generate_with_context with mapper and result type
        return self._generate_with_context(
            cv=cv,
            job_description=job_description,
            language=language,
            notes=notes,
            result_type=CoreCompetences,
            mapper_func=map_core_competences,
            **kwargs
        )
