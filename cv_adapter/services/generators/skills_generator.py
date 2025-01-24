from typing import List

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import SkillGroupDTO, SkillsDTO
from cv_adapter.dto.language import ENGLISH, Language
from cv_adapter.dto.mapper import map_skills
from cv_adapter.models.language_context import get_current_language
from cv_adapter.models.language_context_models import Skills


class SkillsGenerator:
    """Generates a list of skills organized in groups and tailored to a job description.

    Organizes skills into logical groups based on CV content and job requirements."""

    def __init__(self, ai_model: KnownModelName = "openai:gpt-4o") -> None:
        """Initialize the generator with an AI model.

        Args:
            ai_model: AI model to use. Defaults to OpenAI GPT-4o.
        """
        self.agent = Agent(
            ai_model,
            system_prompt=(
                "A professional CV writer that helps organize and adapt skills "
                "to match job requirements and prove core competences. Capable of "
                "generating skills in multiple languages while maintaining "
                "professional terminology and local skill categorization conventions."
            ),
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        notes: str | None = None,
    ) -> SkillsDTO:
        """Generate a list of skills organized in groups and tailored to a job.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to prove
            notes: Optional additional notes for context

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

        # Get the current language from context
        language = get_current_language()

        context = self._prepare_context(
            cv=cv,
            job_description=job_description,
            core_competences=core_competences,
            language=language,
            notes=notes,
        )

        # Use the agent to generate skills
        result = self.agent.run_sync(
            context,
            result_type=Skills,
        )

        # Convert to DTO
        return map_skills(result.data)

    def _prepare_context(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        language: Language,
        notes: str | None = None,
    ) -> str:
        """Prepare context for skills generation.

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
            "Generate a list of skills organized in logical groups based on the CV "
            "and tailored to the job requirements. The skills should demonstrate "
            "the core competences and match the job requirements.\n\n"
            "Guidelines for generating skills:\n"
            "1. Extract skills from CV experiences and education\n"
            "2. Organize skills in logical groups (e.g., 'Programming', 'Analytics')\n"
            "3. Ensure each skill:\n"
            "   - Is relevant to the job requirements\n"
            "   - Helps demonstrate the core competences\n"
            "   - Is specific and clear (e.g., 'Python' instead of 'Programming')\n"
            "   - Is mentioned or implied in the CV\n"
            "4. Keep skills concise (max 40 characters)\n"
            "5. Ensure all skills are unique across all groups\n\n"
        )

        # Add language-specific instructions if not English
        if language != ENGLISH:
            context += (
                "\nLanguage Requirements:\n"
                f"Generate skills in {language.name.title()}, following "
                f"professional skill terminology and categorization conventions "
                f"for that language.\n"
            )

        context += (
            f"CV:\n{cv}\n\n"
            f"Job Description:\n{job_description}\n\n"
            f"Core Competences to Prove:\n{core_competences}\n"
        )

        if notes:
            context += f"\nUser Notes for Consideration:\n{notes}"

        return context
