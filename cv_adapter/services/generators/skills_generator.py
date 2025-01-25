import os
from typing import List, Optional

from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import SkillGroupDTO
from cv_adapter.dto.language import Language
from cv_adapter.dto.mapper import map_skills
from cv_adapter.models.language_context import get_current_language
from cv_adapter.models.language_context_models import Skills
from cv_adapter.services.generators.base_generator import BaseGenerator


class SkillsGenerator(BaseGenerator[List[SkillGroupDTO]]):
    """Generates a list of skills organized in groups and tailored to a job description.

    Organizes skills into logical groups based on CV content and job requirements."""

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
        # Set default system prompt template if not provided
        if system_prompt_template_path is None:
            system_prompt_template_path = os.path.join(
                os.path.dirname(__file__), "templates", "skills_system_prompt.j2"
            )

        # Set default context template if not provided
        if context_template_path is None:
            context_template_path = os.path.join(
                os.path.dirname(__file__), "templates", "skills_context.j2"
            )

        # Initialize base generator with templates
        super().__init__(
            ai_model=ai_model,
            system_prompt_template_path=system_prompt_template_path,
            context_template_path=context_template_path,
            result_type=Skills,
            mapper_func=map_skills,
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        notes: Optional[str] = None,
        language: Optional[Language] = None,
        **kwargs,
    ) -> List[SkillGroupDTO]:
        """Generate a list of skills organized in groups and tailored to a job.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to prove
            notes: Optional additional notes for context
            language: Optional language override
            **kwargs: Additional keyword arguments

        Returns:
            DTO containing groups of skills tailored to the job description

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
        return self._generate_list_with_context(
            cv=cv,
            job_description=job_description,
            core_competences=core_competences,
            notes=notes,
            language=language,
            result_type=Skills,
            mapper_func=map_skills,
            **kwargs,
        )
