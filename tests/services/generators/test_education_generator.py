from datetime import date

import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.dto.cv import EducationDTO, InstitutionDTO
from cv_adapter.dto.language import ENGLISH, FRENCH, GERMAN, ITALIAN, SPANISH, Language
from cv_adapter.models.language_context import get_current_language, language_context
from cv_adapter.services.generators.education_generator import EducationGenerator


def test_context_preparation() -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = EducationGenerator(ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV with education",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
            language=get_current_language(),
            notes="Focus on academic achievements",
        )

    # Test context structure and content
    assert "Sample CV with education" in context
    assert "Sample Job" in context
    assert "Strategic Problem Solving" in context
    assert "Focus on academic achievements" in context
    assert "Generate a list of educational experiences" in context
    assert "Guidelines for generating education section" in context
    assert "Language Requirements" not in context


def test_context_preparation_french() -> None:
    """Test that context is prepared correctly with French language."""
    generator = EducationGenerator(ai_model="test")
    with language_context(FRENCH):
        context = generator._prepare_context(
            cv="Sample CV with education",
            job_description="Sample Job",
            core_competences="Résolution Stratégique de Problèmes",
            language=get_current_language(),
            notes=None,
        )

    # Verify language-specific instructions
    assert "Language Requirements" in context
    assert "Generate the education section in French" in context
    assert "academic terminology and conventions" in context


def test_context_preparation_without_notes() -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = EducationGenerator(ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV with education",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
            language=get_current_language(),
            notes=None,
        )

    # Verify required content is present
    assert "Sample CV with education" in context
    assert "Sample Job" in context
    assert "Strategic Problem Solving" in context

    # Verify optional content is not present
    assert "User Notes for Consideration" not in context


@pytest.mark.parametrize(
    "language",
    [
        ENGLISH,
        FRENCH,
        GERMAN,
        SPANISH,
        ITALIAN,
    ],
)
def test_context_preparation_all_languages(language: Language) -> None:
    """Test context preparation for all supported languages."""
    generator = EducationGenerator(ai_model="test")
    with language_context(language):
        context = generator._prepare_context(
            cv="Sample CV with education",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
            language=get_current_language(),
            notes=None,
        )

    if language == ENGLISH:
        assert "Language Requirements" not in context
    else:
        assert "Language Requirements" in context
        assert f"Generate the education section in {language.name.title()}" in context
        assert "academic terminology and conventions" in context


def test_empty_cv_validation() -> None:
    """Test that empty CV raises validation error."""
    generator = EducationGenerator(ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="CV text is required"):
            generator.generate(
                cv="   ",  # whitespace only
                job_description="Sample Job",
                core_competences="Strategic Problem Solving",
            )


def test_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    generator = EducationGenerator(ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="Job description is required"):
            generator.generate(
                cv="Sample CV with education",
                job_description="",  # empty string
                core_competences="Strategic Problem Solving",
            )


def test_missing_language_validation() -> None:
    """Test that missing language context raises RuntimeError."""
    generator = EducationGenerator(ai_model="test")
    with pytest.raises(
        RuntimeError, match=r"Language context not set. Use language_context\(\) first."
    ):
        generator.generate(
            cv="Sample CV with education",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
        )


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
