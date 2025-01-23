from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.generators import SkillsGeneratorInput
from cv_adapter.models.language import Language
from cv_adapter.models.language_context import language_context
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
        language: Language,
        notes: str | None = None,
    ) -> Skills:
        """Generate a list of skills organized in groups and tailored to a job.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to prove
            language: Target language for generation
            notes: Optional additional notes for context

        Returns:
            Skills object containing groups of skills tailored to the job description

        Raises:
            ValueError: If no skill groups are generated
        """
        input_data = SkillsGeneratorInput(
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

            # Use the agent to generate skills
            result = self.agent.run_sync(
                context,
                result_type=Skills,
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
        if language != Language.ENGLISH:
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
