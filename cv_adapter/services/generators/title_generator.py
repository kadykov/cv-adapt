from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.generators import TitleGeneratorInput
from cv_adapter.models.language import Language
from cv_adapter.models.language_context import language_context
from cv_adapter.models.language_context_models import Title


class TitleGenerator:
    """Generates a professional title tailored to a job description."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the generator with an AI model.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "A professional CV writer that helps create impactful professional "
                "titles that match job requirements and highlight core competences. "
                "Capable of generating titles in multiple languages while maintaining "
                "professional terminology and local CV writing conventions."
            ),
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        language: Language,
        notes: str | None = None,
    ) -> Title:
        """Generate a professional title tailored to a job description.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to highlight
            language: Target language for generation
            notes: Optional additional notes for context

        Returns:
            A Title model instance containing the generated title
        """
        input_data = TitleGeneratorInput(
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

            # Use the agent to generate title
            result = self.agent.run_sync(
                context,
                result_type=Title,
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
        """Prepare context for title generation.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to highlight
            language: Target language for generation
            notes: Optional additional notes for context

        Returns:
            Prepared context string for the AI
        """
        context = (
            "Generate a professional title that effectively represents the candidate "
            "for the target job position. The title should be concise, impactful, "
            "and aligned with both the job requirements and core competences.\n\n"
            "Guidelines for generating the title:\n"
            "1. Keep it under 2 lines and within 50 characters per line\n"
            "2. Focus on the most relevant professional identity\n"
            "3. Incorporate key expertise areas that match job requirements\n"
            "4. Ensure it reflects the seniority level appropriately\n"
            "5. Make it memorable but professional\n\n"
        )

        # Add language-specific instructions if not English
        if language != Language.ENGLISH:
            context += (
                "\nLanguage Requirements:\n"
                f"Generate the title in {language.name.title()}, following standard "
                f"CV conventions for that language.\n"
            )

        context += (
            f"CV:\n{cv}\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Core Competences to Highlight:\n{core_competences}\n"
        )

        if notes:
            context += f"\nUser Notes for Consideration:\n{notes}"

        return context
