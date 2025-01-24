from datetime import date

import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.dto.cv import ExperienceDTO, InstitutionDTO
from cv_adapter.dto.language import ENGLISH, FRENCH, GERMAN, ITALIAN, SPANISH, Language
from cv_adapter.models.language_context import get_current_language, language_context
from cv_adapter.services.generators.experience_generator import ExperienceGenerator


def test_context_preparation() -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = ExperienceGenerator(ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV with experiences",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
            language=get_current_language(),
            notes="Focus on tech leadership",
        )

    # Test context structure and content
    assert "Sample CV with experiences" in context
    assert "Sample Job" in context
    assert "Strategic Problem Solving" in context
    assert "Focus on tech leadership" in context
    assert "Generate a list of professional experiences" in context
    assert "Language Requirements" not in context


def test_context_preparation_french() -> None:
    """Test that context is prepared correctly with French language."""
    generator = ExperienceGenerator(ai_model="test")
    with language_context(FRENCH):
        context = generator._prepare_context(
            cv="Sample CV with experiences",
            job_description="Sample Job",
            core_competences="Résolution Stratégique de Problèmes",
            language=get_current_language(),
            notes=None,
        )

    # Verify language-specific instructions
    assert "Language Requirements" in context
    assert "Generate all content in French" in context
    assert "following standard CV conventions" in context


def test_context_preparation_without_notes() -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = ExperienceGenerator(ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV with experiences",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
            language=get_current_language(),
            notes=None,
        )

    # Verify required content is present
    assert "Sample CV with experiences" in context
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
    generator = ExperienceGenerator(ai_model="test")
    with language_context(language):
        context = generator._prepare_context(
            cv="Sample CV with experiences",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
            language=get_current_language(),
            notes=None,
        )

    if language == ENGLISH:
        assert "Language Requirements" not in context
    else:
        assert "Language Requirements" in context
        assert f"Generate all content in {language.name.title()}" in context
        assert "following standard CV conventions" in context


def test_empty_cv_validation() -> None:
    """Test that empty CV raises validation error."""
    generator = ExperienceGenerator(ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="CV text is required"):
            generator.generate(
                cv="   ",  # whitespace only
                job_description="Sample Job",
                core_competences="Strategic Problem Solving",
            )


def test_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    generator = ExperienceGenerator(ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="Job description is required"):
            generator.generate(
                cv="Sample CV with experiences",
                job_description="",  # empty string
                core_competences="Strategic Problem Solving",
            )


def test_missing_language_validation() -> None:
    """Test that missing language context raises RuntimeError."""
    generator = ExperienceGenerator(ai_model="test")
    with pytest.raises(
        RuntimeError, match=r"Language context not set. Use language_context\(\) first."
    ):
        generator.generate(
            cv="Sample CV with experiences",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
        )


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
