"""Service for generating professional experiences based on CV and job description."""

import os
from typing import Any, List, Optional

from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import ExperienceDTO
from cv_adapter.dto.language import Language
from cv_adapter.dto.mapper import map_experience
from cv_adapter.models.language_context import get_current_language
from cv_adapter.models.language_context_models import Experience
from cv_adapter.services.generators.base_generator import BaseGenerator


class ExperienceGenerator(BaseGenerator[ExperienceDTO]):
    """Generates a list of professional experiences tailored to a job description."""

    def __init__(
        self,
        ai_model: KnownModelName = "openai:gpt-4o",
        system_prompt_template_path: Optional[str] = None,
        context_template_path: Optional[str] = None,
    ) -> None:
        """
        Initialize the experience generator.

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
                os.path.dirname(__file__), "templates", "experience_system_prompt.j2"
            )

        # Set default context template if not provided
        if context_template_path is None:
            context_template_path = os.path.join(
                os.path.dirname(__file__), "templates", "experience_context.j2"
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
        language: Optional[Language] = None,
        notes: Optional[str] = None,
        core_competences: Optional[str] = None,
        **kwargs: Any,
    ) -> List[ExperienceDTO]:
        """Generate a list of professional experiences tailored to a job description.

        Args:
            cv: CV text to extract experiences from
            job_description: Job description to adapt experiences for
            language: Optional language for generation
            notes: Optional notes for generation guidance
            core_competences: Optional core competences to demonstrate in experiences
            **kwargs: Additional generation parameters

        Returns:
            List of experiences tailored to the job description

        Raises:
            ValueError: If any of the required inputs are empty or
            contain only whitespace
        """
        # Validate input parameters
        if not cv or not cv.strip():
            raise ValueError("CV text is required")
        if not job_description:
            raise ValueError("Job description is required")

        # Get the current language from context
        language = language or get_current_language()

        # Prepare context for generation
        context = self._prepare_context(
            cv=cv,
            job_description=job_description,
            language=language,
            notes=notes,
            core_competences=core_competences,
            **kwargs,
        )

        # Use the agent to generate experiences
        result = self.agent.run_sync(
            context,
            result_type=list[Experience],
        )

        # Convert to DTO
        return [map_experience(exp) for exp in result.data]
