from datetime import date

import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.dto.cv import EducationDTO, InstitutionDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.services.generators.education_generator import EducationGenerator


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model for education generation."""
    model = TestModel()
    model.custom_result_args = {
        "data": [
            {
                "university": {
                    "name": "Tech University",
                    "description": "Leading technology and engineering institution",
                    "location": "San Francisco, CA",
                },
                "degree": "Master of Science in Computer Science",
                "start_date": date(2018, 9, 1),
                "end_date": date(2020, 5, 15),
                "description": "Specialized in machine learning and AI technologies",
            }
        ]
    }
    return model


def test_education_generator_dto_output(test_model: TestModel) -> None:
    """Test that the education generator returns a valid list of EducationDTO."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Initialize generator
        generator = EducationGenerator(ai_model="test")

        # Use agent override to set the test model
        with generator.agent.override(model=test_model):
            # Generate education
            result = generator.generate(
                cv="Experienced software engineer with advanced academic background",
                job_description=(
                    "Seeking a senior software engineer with advanced technical skills"
                ),
                core_competences="Technical Leadership, Advanced Learning",
            )

            # Verify the result is a list of EducationDTO
            assert isinstance(result, list)
            assert len(result) == 1

            # Verify the education is an EducationDTO
            education = result[0]
            assert isinstance(education, EducationDTO)
            assert isinstance(education.university, InstitutionDTO)
            assert isinstance(education.degree, str)
            assert isinstance(education.start_date, date)
            assert isinstance(education.description, str)

            # Verify specific education details
            assert education.university.name is not None
            assert education.degree is not None
            assert education.description is not None
