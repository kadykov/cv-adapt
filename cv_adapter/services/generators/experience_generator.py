"""Service for generating professional experiences based on CV and job description."""

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from typing import List

from cv_adapter.dto.cv import ExperienceDTO
from cv_adapter.dto.language import ENGLISH, Language
from cv_adapter.dto.mapper import map_experience
from cv_adapter.models.language_context import get_current_language
from cv_adapter.models.language_context_models import Experience


class ExperienceGenerator:
    """Generates a list of professional experiences tailored to a job description."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the generator with an AI model.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "A professional CV writer that helps adapt professional experiences "
                "to match job requirements and prove core competences. Capable of "
                "generating content in multiple languages while maintaining "
                "professional terminology and local CV writing conventions."
            ),
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        notes: str | None = None,
    ) -> List[ExperienceDTO]:
        """Generate a list of professional experiences tailored to a job description.

        Args:
            cv: CV text to extract experiences from
            job_description: Job description to adapt experiences for
            core_competences: Core competences to demonstrate in experiences
            notes: Optional notes for generation guidance

        Returns:
            List of experiences tailored to the job description

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

        # Get the current language from context
        language = get_current_language()

        context = self._prepare_context(
            cv=cv,
            job_description=job_description,
            core_competences=core_competences,
            language=language,
            notes=notes,
        )

        result = self.agent.run_sync(
            context,
            result_type=list[Experience],
        )

        # Convert to DTO
        return [map_experience(exp) for exp in result.data]

    def _prepare_context(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        language: Language,
        notes: str | None = None,
    ) -> str:
        """Prepare context for the LLM to generate experiences.

        Args:
            cv: CV text to extract experiences from
            job_description: Job description to adapt experiences for
            core_competences: Core competences to demonstrate in experiences
            language: Target language for generation
            notes: Optional notes for generation guidance

        Returns:
            Context string for LLM
        """
        context = (
            "Generate a list of professional experiences tailored to the job. "
            "The experiences should be selected from the CV and adapted to match "
            "the job requirements and prove the core competences.\n\n"
            "Guidelines for generating experiences:\n"
            "1. Select only relevant experiences that demonstrate required skills\n"
            "2. For each experience, write a description that:\n"
            "   - Focuses on achievements and responsibilities matching requirements\n"
            "   - Demonstrates the core competences provided\n"
            "   - Uses action verbs and quantifies results where possible\n"
            "   - Is clear and concise\n"
            "3. Keep descriptions focused and relevant, avoiding unnecessary details\n"
            "4. Ensure all dates, company names and positions match the original CV\n"
            "5. Include only technologies actually used and relevant to the job\n"
        )

        # Add language-specific instructions if not English
        if language != ENGLISH:
            context += (
                "\nLanguage Requirements:\n"
                f"Generate all content in {language.name.title()}, following standard "
                f"CV conventions for that language.\n"
            )

        context += (
            f"\nCV:\n{cv}\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Core Competences to Prove:\n{core_competences}\n"
        )

        if notes:
            context += f"\nUser Notes for Consideration:\n{notes}"

        return context
