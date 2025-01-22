"""Service for generating core competences based on CV and job description."""

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.core_competence import CoreCompetences
from cv_adapter.models.language import Language
from cv_adapter.models.language_context import language_context


class CompetenceGenerator:
    """Generates relevant core competences based on CV and job description."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the generator with an AI model.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "An expert CV analyst that helps identify and describe core "
                "competences. Each competence is a concise phrase (1-5 words) "
                "representing a key skill. Capable of generating competences "
                "in multiple languages with professional standards."
            ),
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        language: Language,
        notes: str | None = None,
    ) -> CoreCompetences:
        """Generate core competences based on CV and job description.

        Args:
            cv: Text of the CV
            job_description: Job description text
            language: Target language for generation
            notes: Optional additional notes for context

        Returns:
            List of core competences relevant for the job

        Raises:
            ValueError: If input parameters are invalid
        """
        # Validate input parameters
        if not cv or not cv.strip():
            raise ValueError("This field is required")
        if not job_description:
            raise ValueError("String should have at least 1 character")

        with language_context(language):
            context = self._prepare_context(
                cv=cv,
                job_description=job_description,
                language=language,
                notes=notes,
            )

            # Use the agent to generate competences
            result = self.agent.run_sync(
                context,
                result_type=CoreCompetences,
            )
            return result.data

    def _prepare_context(
        self,
        cv: str,
        job_description: str,
        language: Language,
        notes: str | None = None,
    ) -> str:
        """Prepare context for core competences generation.

        Args:
            cv: Text of the CV
            job_description: Job description text
            language: Target language for generation
            notes: Optional additional notes for context

        Returns:
            Prepared context string for the AI
        """
        context = (
            "Based on the CV and job description below, identify 4-6 core competences "
            "that best match the requirements. Each competence should be a concise "
            "phrase (1-5 words) that represents a key skill or area of expertise.\n\n"
        )

        # Add language-specific instructions if not English
        if language != Language.ENGLISH:
            context += (
                "\nLanguage Requirements:\n"
                f"Generate all competences in {language.name.title()}, "
                f"following professional terminology conventions.\n"
            )

        context += f"CV:\n{cv}\n\nJob Description:\n{job_description}\n"

        if notes:
            context += f"\nUser Notes for Consideration:\n{notes}"

        return context
