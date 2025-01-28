from datetime import date
from typing import List

from cv_adapter.dto.cv import ExperienceDTO, InstitutionDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.services.generators.experience_generator import create_experience_generator
from cv_adapter.services.generators.protocols import ComponentGenerationContext


def test_experience_generator_dto_output() -> None:
    """Test that the experience generator returns a valid ExperiencesDTO."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Create generator creator
        generator = create_experience_generator(ai_model="test")

        # Create context
        context = ComponentGenerationContext(
            cv="Experienced software engineer with 10 years of expertise",
            job_description="Seeking a senior software engineer with leadership skills",
            core_competences="Technical Leadership, Strategic Problem Solving",
            language=ENGLISH,
        )

        # Generate experiences
        result = generator(context)

        # Verify the result is a list of ExperienceDTO
        assert isinstance(result, list)
        assert len(result) > 0

        # Verify the experience is an ExperienceDTO
        experience = result[0]
        assert isinstance(experience, ExperienceDTO)
        assert isinstance(experience.company, InstitutionDTO)
        assert isinstance(experience.position, str)
        assert isinstance(experience.start_date, date)
        assert isinstance(experience.description, str)
        assert isinstance(experience.technologies, list)

        # Verify basic properties of the experience
        assert experience.company.name is not None
        assert experience.position is not None
        assert experience.start_date is not None
        assert experience.description is not None
        assert len(experience.technologies) > 0
