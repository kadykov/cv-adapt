import pytest
from pydantic_ai.models.function import FunctionModel
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.language import ENGLISH, FRENCH, GERMAN, SPANISH, ITALIAN, Language
from cv_adapter.models.language_context_models import CoreCompetence, CoreCompetences
from cv_adapter.services.generators.competence_generator import CompetenceGenerator
from cv_adapter.dto.cv import CoreCompetencesDTO, CoreCompetenceDTO
from cv_adapter.models.language_context import language_context, get_current_language


def test_context_preparation() -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = CompetenceGenerator(ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
            language=get_current_language(),
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
    with language_context(FRENCH):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
            language=get_current_language(),
            notes=None,
        )

    # Verify language-specific instructions
    assert "Language Requirements" in context
    assert "Generate all competences in French" in context
    assert "following professional terminology conventions" in context


def test_context_preparation_without_notes() -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = CompetenceGenerator(ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
            language=get_current_language(),
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
    with language_context(language):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
            language=get_current_language(),
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
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="CV text is required"):
            generator.generate(
                cv="   ",  # whitespace only
                job_description="Sample Job",
            )


def test_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    generator = CompetenceGenerator(ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="Job description is required"):
            generator.generate(
                cv="Sample CV",
                job_description="",  # empty string
            )


def test_missing_language_validation() -> None:
    """Test that missing language context raises RuntimeError."""
    generator = CompetenceGenerator(ai_model="test")
    with pytest.raises(
        RuntimeError, match="Language context not set. Use language_context\(\) first."
    ):
        generator.generate(
            cv="Sample CV",
            job_description="Sample Job",
        )


def test_competence_generator_dto_output() -> None:
    """Test that the competence generator returns a valid CoreCompetencesDTO."""
    # Temporarily disable language validation
    from cv_adapter.models import validators
    from unittest.mock import Mock

    # Backup original validators
    original_validate_language = validators.validate_language

    # Replace validators
    validators.validate_language = lambda x: None

    # Set language context before the test
    with language_context(ENGLISH):
        try:
            # Create a mock AI model
            mock_core_competences = CoreCompetences(
                items=[
                    CoreCompetence(text="Strategic Problem Solving"),
                    CoreCompetence(text="Technical Leadership"),
                    CoreCompetence(text="Agile Methodology"),
                    CoreCompetence(text="Cross-Functional Collaboration"),
                ]
            )

            # Create a mock agent with a run_sync method
            mock_agent = Mock()
            mock_result = Mock()
            mock_result.data = mock_core_competences
            mock_agent.run_sync.return_value = mock_result

            # Initialize generator with the mock agent
            generator = CompetenceGenerator(ai_model="test")
            generator.agent = mock_agent

            # Generate core competences
            result = generator.generate(
                cv="Experienced software engineer with 10 years of expertise",
                job_description="Seeking a senior software engineer with leadership skills",
            )

            # Verify the result is a CoreCompetencesDTO
            assert isinstance(result, CoreCompetencesDTO)

            # Verify the number of competences
            assert len(result.items) == 4

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
            assert "Cross-Functional Collaboration" in competence_texts

        finally:
            # Restore original validators
            validators.validate_language = original_validate_language
