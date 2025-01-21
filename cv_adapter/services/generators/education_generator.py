from typing import List

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.models.cv import Education
from cv_adapter.models.generators import EducationGeneratorInput


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
                "to match job requirements and prove core competences."
            ),
        )

    def generate(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        notes: str | None = None,
    ) -> List[Education]:
        """Generate a list of educational experiences tailored to a job description.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to prove
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
        )
        context = self._prepare_context(
            cv=input_data.cv_text,
            job_description=input_data.job_description,
            core_competences=input_data.core_competences,
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
        notes: str | None = None,
    ) -> str:
        """Prepare context for education generation.

        Args:
            cv: Text of the CV
            job_description: Job description text
            core_competences: Core competences to prove
            notes: Optional additional notes for context

        Returns:
            Prepared context string for the AI
        """
        input_data = EducationGeneratorInput(
            cv_text=cv,
            job_description=job_description,
            core_competences=core_competences,
            notes=notes,
        )
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
            f"CV:\n{input_data.cv_text}\n\n"
            f"Job Description:\n{input_data.job_description}\n\n"
            f"Core Competences to Prove:\n{input_data.core_competences}\n"
        )
        if input_data.notes:
            context += f"\nUser Notes for Consideration:\n{input_data.notes}"

        return context
