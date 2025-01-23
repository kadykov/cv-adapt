from typing import List

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.generators import EducationGeneratorInput
from cv_adapter.models.language import Language
from cv_adapter.models.language_context import language_context
from cv_adapter.models.language_context_models import Education


class EducationGenerator:
    """Generates a list of educational experiences tailored to a job description."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the generator with an AI model.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "A professional CV writer that helps adapt educational experiences "
                "to match job requirements and prove core competences. Capable of "
                "generating education sections in multiple languages while maintaining "
                "professional terminology and local academic conventions."
            ),
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        language: Language,
        notes: str | None = None,
    ) -> List[Education]:
        """Generate a list of educational experiences tailored to a job description.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to prove
            language: Target language for generation
            notes: Optional additional notes for context

        Returns:
            List of educational experiences tailored to the job description

        Raises:
            ValueError: If no education entries are generated
        """
        input_data = EducationGeneratorInput(
            cv_text=cv,
            job_description=job_description,
            core_competences=core_competences,
            notes=notes,
            language=language,
        )

        with language_context(language):
            context = self._prepare_context(
                cv=input_data.cv_text,
                job_description=input_data.job_description,
                core_competences=input_data.core_competences,
                language=input_data.language,
                notes=input_data.notes,
            )

            # Use the agent to generate education entries
            result = self.agent.run_sync(
                context,
                result_type=List[Education],
            )
            return result.data

    def _prepare_context(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        language: Language,
        notes: str | None = None,
    ) -> str:
        """Prepare context for education generation.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to prove
            language: Target language for generation
            notes: Optional additional notes for context

        Returns:
            Prepared context string for the AI
        """
        context = (
            "Generate a list of educational experiences tailored to the job. "
            "The experiences should be selected from the CV and adapted to match "
            "the job requirements and prove the core competences.\n\n"
            "Guidelines for generating education section:\n"
            "1. Select relevant educational experiences that match job requirements\n"
            "2. For each education entry, write a description that:\n"
            "   - Focuses on relevant coursework, research, and projects\n"
            "   - Demonstrates the core competences provided\n"
            "   - Highlights academic achievements and specializations\n"
            "   - Is clear and concise\n"
            "3. Keep descriptions focused and relevant, avoiding unnecessary details\n"
            "4. Ensure all dates, university names and degrees match the original CV\n"
            "5. Do not modify the official degree titles\n\n"
        )

        # Add language-specific instructions if not English
        if language != Language.ENGLISH:
            context += (
                "\nLanguage Requirements:\n"
                f"Generate the education section in {language.name.title()}, "
                f"following academic terminology and conventions for that language.\n"
            )

        context += (
            f"CV:\n{cv}\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Core Competences to Prove:\n{core_competences}\n"
        )

        if notes:
            context += f"\nUser Notes for Consideration:\n{notes}"

        return context
