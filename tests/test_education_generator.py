from datetime import date

import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.models.cv import Education
from cv_adapter.models.generators import EducationGeneratorInput
from cv_adapter.services.education_generator import EducationGenerator


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model."""
    model = TestModel()
    model.custom_result_args = [
        {
            "university": {
                "name": "Stanford University",
                "description": "Top research university",
                "location": "Stanford, CA",
            },
            "degree": "Ph.D. in Computer Science",
            "start_date": date(2018, 9, 1),
            "end_date": date(2023, 6, 30),
            "description": (
                "Specialized in Machine Learning and Artificial Intelligence. "
                "Conducted research on deep learning for computer vision. "
                "Published 3 papers in top-tier conferences. Teaching assistant for "
                "advanced algorithms and data structures courses."
            ),
        },
        {
            "university": {
                "name": "MIT",
                "description": "Leading technical institute",
                "location": "Cambridge, MA",
            },
            "degree": "M.S. in Computer Science",
            "start_date": date(2016, 9, 1),
            "end_date": date(2018, 5, 31),
            "description": (
                "Focus on distributed systems and cloud computing. "
                "Developed scalable data processing systems as part of thesis. "
                "Collaborated on research projects with industry partners."
            ),
        },
    ]
    return model


def test_education_generator(test_model: TestModel) -> None:
    """Test education generation with valid input."""
    generator = EducationGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        input_data = EducationGeneratorInput(
            cv_text="# CV\n\nDetailed educational experience...",
            job_description=("# Job Description\n\nSeeking a ML researcher..."),
            core_competences=(
                "Machine Learning, Distributed Systems, Research, Teaching"
            ),
        )
        education = generator.generate(input_data)

        assert len(education) == 2
        assert all(isinstance(edu, Education) for edu in education)

        # Test first education entry
        edu1 = education[0]
        assert edu1.university.name == "Stanford University"
        assert edu1.degree == "Ph.D. in Computer Science"
        assert edu1.start_date == date(2018, 9, 1)
        assert edu1.end_date == date(2023, 6, 30)
        assert len(edu1.description) <= 1200
        assert "Machine Learning" in edu1.description

        # Test second education entry
        edu2 = education[1]
        assert edu2.university.name == "MIT"
        assert edu2.degree == "M.S. in Computer Science"
        assert edu2.start_date == date(2016, 9, 1)
        assert edu2.end_date == date(2018, 5, 31)
        assert len(edu2.description) <= 1200
        assert "distributed systems" in edu2.description.lower()


def test_education_generator_with_notes(test_model: TestModel) -> None:
    """Test education generation with notes."""
    generator = EducationGenerator(ai_model="test")

    with generator.agent.override(model=test_model):
        input_data = EducationGeneratorInput(
            cv_text="# CV\n\nDetailed educational experience...",
            job_description=("# Job Description\n\nSeeking a ML researcher..."),
            core_competences=(
                "Machine Learning, Distributed Systems, Research, Teaching"
            ),
            notes="Focus on research experience",
        )
        education = generator.generate(input_data)

        assert len(education) == 2
        assert "research" in education[0].description.lower()
