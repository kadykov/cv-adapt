from typing import List

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import Experience
from cv_adapter.models.generators import ExperienceGeneratorInput
from cv_adapter.models.language import Language


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

    def _prepare_context(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        language: Language,
        notes: str | None,
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
        if language != Language.ENGLISH:
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

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        language: Language,
        notes: str | None = None,
    ) -> List[Experience]:
        """Generate a list of professional experiences tailored to a job description.

        Args:
            cv: CV text to extract experiences from
            job_description: Job description to adapt experiences for
            core_competences: Core competences to demonstrate in experiences
            language: Target language for generation
            notes: Optional notes for generation guidance

        Returns:
            List of experiences tailored to the job description

        Raises:
            ValueError: If any of the required inputs are empty or
            contain only whitespace
        """
        input_data = ExperienceGeneratorInput(
            cv_text=cv,
            job_description=job_description,
            core_competences=core_competences,
            notes=notes,
            language=language,
        )

        context = self._prepare_context(
            cv=input_data.cv_text,
            job_description=input_data.job_description,
            core_competences=input_data.core_competences,
            language=input_data.language,
            notes=input_data.notes,
        )
        result = self.agent.run_sync(
            context,
            result_type=List[Experience],
        )
        return result.data
