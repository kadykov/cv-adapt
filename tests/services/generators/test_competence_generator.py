import pytest
from pydantic_ai.models.function import FunctionModel
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.language import ENGLISH, FRENCH, GERMAN, SPANISH, ITALIAN, Language
from cv_adapter.models.language_context_models import CoreCompetence, CoreCompetences
from cv_adapter.services.generators.competence_generator import CompetenceGenerator
from cv_adapter.dto.cv import CoreCompetencesDTO, CoreCompetenceDTO
# Removed language context import


def test_context_preparation() -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = CompetenceGenerator(ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        language=ENGLISH,
        notes="Focus on tech",
    )

    # Test context structure and content
    assert "Sample CV" in context
    assert "Sample Job" in context
    assert "Focus on tech" in context
    assert "identify 4-6 core competences" in context
    assert "Each competence should be a concise phrase" in context
    assert "Language Requirements" not in context


def test_context_preparation_french() -> None:
    """Test that context is prepared correctly with French language."""
    generator = CompetenceGenerator(ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        language=FRENCH,
        notes=None,
    )

    # Verify language-specific instructions
    assert "Language Requirements" in context
    assert "Generate all competences in French" in context
    assert "following professional terminology conventions" in context


def test_context_preparation_without_notes() -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = CompetenceGenerator(ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        language=ENGLISH,
        notes=None,
    )

    # Verify required content is present
    assert "Sample CV" in context
    assert "Sample Job" in context

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
    generator = CompetenceGenerator(ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        language=language,
        notes=None,
    )

    if language == ENGLISH:
        assert "Language Requirements" not in context
    else:
        assert "Language Requirements" in context
        assert f"Generate all competences in {language.name.title()}" in context
        assert "following professional terminology conventions" in context


def test_empty_cv_validation() -> None:
    """Test that empty CV raises validation error."""
    generator = CompetenceGenerator(ai_model="test")
    with pytest.raises(ValueError, match="This field is required"):
        generator.generate(
            cv="   ",  # whitespace only
            job_description="Sample Job",
            language=ENGLISH,
        )


def test_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    generator = CompetenceGenerator(ai_model="test")
    with pytest.raises(ValueError, match="String should have at least 1 character"):
        generator.generate(
            cv="Sample CV",
            job_description="",  # empty string
            language=ENGLISH,
        )


def test_missing_language_validation() -> None:
    """Test that missing language raises TypeError."""
    generator = CompetenceGenerator(ai_model="test")
    with pytest.raises(
        TypeError, match="missing 1 required positional argument: 'language'"
    ):
        generator.generate(  # type: ignore[call-arg]
            cv="Sample CV",
            job_description="Sample Job",
        )


def test_competence_generator_dto_output() -> None:
    """Test that the competence generator returns a valid CoreCompetencesDTO."""
    # Temporarily disable language validation
    from cv_adapter.models import validators
    from cv_adapter.models.language_context import current_language

    # Backup original validators
    original_validate_language = validators.validate_language

    # Replace validators
    validators.validate_language = lambda x: None

    try:
        # Create a mock AI model using FunctionModel
        mock_core_competences = CoreCompetences(
            items=[
                CoreCompetence(text="Strategic Problem Solving"),
                CoreCompetence(text="Technical Leadership"),
                CoreCompetence(text="Agile Methodology"),
            ]
        )

        # Create a mock function that returns the predefined core competences
        def mock_generate_competences(*args, **kwargs) -> CoreCompetences:
            return mock_core_competences

        mock_ai_model = FunctionModel(
            name="mock_competence_generator",
            function=mock_generate_competences,
            result_type=CoreCompetences,
        )

        # Initialize generator with the mock AI model
        generator = CompetenceGenerator(ai_model=mock_ai_model)

        # Generate core competences
        result = generator.generate(
            cv="Experienced software engineer with 10 years of expertise",
            job_description="Seeking a senior software engineer with leadership skills",
            language=ENGLISH,
        )

        # Verify the result is a CoreCompetencesDTO
        assert isinstance(result, CoreCompetencesDTO)

        # Verify the number of competences
        assert len(result.items) == 3

        # Verify each competence is a CoreCompetenceDTO
        for competence in result.items:
            assert isinstance(competence, CoreCompetenceDTO)
            assert isinstance(competence.text, str)
            assert len(competence.text) > 0

        # Verify specific competence texts
        competence_texts = [comp.text for comp in result.items]
        assert "Strategic Problem Solving" in competence_texts
        assert "Technical Leadership" in competence_texts
        assert "Agile Methodology" in competence_texts

    finally:
        # Restore original validators
        validators.validate_language = original_validate_language
