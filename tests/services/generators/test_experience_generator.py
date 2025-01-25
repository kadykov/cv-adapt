from datetime import date

import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.dto.cv import ExperienceDTO, InstitutionDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.services.generators.experience_generator import ExperienceGenerator


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model for experience generation."""
    model = TestModel()
    model.custom_result_args = {
        "data": [
            {
                "company": {
                    "name": "Tech Innovations Inc.",
                    "description": "Leading software solutions provider",
                    "location": "San Francisco, CA",
                },
                "position": "Senior Software Engineer",
                "start_date": date(2020, 1, 1),
                "end_date": date(2023, 6, 30),
                "description": "Led cross-functional engineering teams",
                "technologies": ["Python", "Kubernetes", "AWS"],
            }
        ]
    }
    return model


def test_experience_generator_dto_output(test_model: TestModel) -> None:
    """Test that the experience generator returns a valid ExperiencesDTO."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Initialize generator
        generator = ExperienceGenerator(ai_model="test")

        # Use agent override to set the test model
        with generator.agent.override(model=test_model):
            # Generate experiences
            result = generator.generate(
                cv="Experienced software engineer with 10 years of expertise",
                job_description=(
                    "Seeking a senior software engineer with leadership skills"
                ),
                core_competences="Technical Leadership, Strategic Problem Solving",
            )

            # Verify the result is a list of ExperienceDTO
            assert isinstance(result, list)
            assert len(result) == 1

            # Verify the experience is an ExperienceDTO
            experience = result[0]
            assert isinstance(experience, ExperienceDTO)
            assert isinstance(experience.company, InstitutionDTO)
            assert isinstance(experience.position, str)
            assert isinstance(experience.start_date, date)
            assert isinstance(experience.description, str)
            assert isinstance(experience.technologies, list)

            # Verify specific experience details
            assert experience.company.name is not None
            assert experience.position is not None
            assert len(experience.technologies) > 0
