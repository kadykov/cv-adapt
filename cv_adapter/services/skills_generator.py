from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import Skills
from cv_adapter.models.generators import SkillsGeneratorInput


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
                "to match job requirements and prove core competences."
            ),
        )

    def generate(self, input_data: SkillsGeneratorInput) -> Skills:
        """Generate a list of skills organized in groups and tailored to a job.

        Args:
            input_data: Input data containing CV text, job description, core competences
                and optional notes.

        Returns:
            Skills object containing groups of skills tailored to the job description

        Raises:
            ValueError: If no skill groups are generated
        """
        # Prepare context for the AI
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
            f"CV:\n{input_data.cv_text}\n\n"
            f"Job Description:\n{input_data.job_description}\n\n"
            f"Core Competences to Prove:\n{input_data.core_competences}\n"
        )
        if input_data.notes:
            context += f"\nUser Notes for Consideration:\n{input_data.notes}"

        # Use the agent to generate skills
        result = self.agent.run_sync(
            context,
            result_type=Skills,
        )
        skills = result.data
        if not skills.groups:
            raise ValueError("At least one skill group must be generated")
        return skills
