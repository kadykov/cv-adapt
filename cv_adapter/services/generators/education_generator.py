from typing import List, Optional

from jinja2 import Environment, FileSystemLoader
from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import EducationDTO
from cv_adapter.dto.language import Language
from cv_adapter.dto.mapper import map_education
from cv_adapter.models.language_context import get_current_language
from cv_adapter.models.language_context_models import Education
from cv_adapter.services.generators.base_generator import BaseGenerator


class EducationGenerator(BaseGenerator[EducationDTO]):
    """Generates a list of educational experiences tailored to a job description."""

    def __init__(
        self,
        ai_model: KnownModelName = "openai:gpt-4o",
        system_prompt_template_path: Optional[str] = None,
        context_template_path: Optional[str] = None,
    ) -> None:
        """Initialize the generator with an AI model and optional template paths.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
            system_prompt_template_path: Optional path to system prompt Jinja2 template
            context_template_path: Optional path to context Jinja2 template
        """
        # Use default templates if not provided
        default_template_dir = self._get_default_template_dir()
        system_prompt_template_path = system_prompt_template_path or (
            f"{default_template_dir}/education_system_prompt.j2"
        )
        context_template_path = context_template_path or (
            f"{default_template_dir}/education_context.j2"
        )

        # Initialize base generator with templates
        super().__init__(
            ai_model=ai_model,
            system_prompt_template_path=system_prompt_template_path,
            context_template_path=context_template_path,
            result_type=list[Education],
            mapper_func=map_education,
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        notes: Optional[str] = None,
        language: Optional[Language] = None,
        **kwargs,
    ) -> List[EducationDTO]:
        """Generate a list of educational experiences tailored to a job description.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to prove
            notes: Optional additional notes for context
            language: Optional language override
            **kwargs: Additional keyword arguments

        Returns:
            List of educational experiences tailored to the job description

        Raises:
            ValueError: If any of the required inputs are empty or
            contain only whitespace
            RuntimeError: If language context is not set
        """
        # Validate input parameters
        if not cv or not cv.strip():
            raise ValueError("CV text is required")
        if not job_description:
            raise ValueError("Job description is required")

        # Use provided language or get from context
        language = language or get_current_language()

        # Prepare context and generate
        return super().generate(
            cv=cv,
            job_description=job_description,
            core_competences=core_competences,
            notes=notes,
            language=language,
            **kwargs,
        )
