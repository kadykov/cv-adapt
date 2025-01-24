import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.language import ENGLISH, FRENCH, GERMAN, ITALIAN, SPANISH, Language
from cv_adapter.models.language_context import get_current_language, language_context
from cv_adapter.services.generators.competence_generator import CompetenceGenerator


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
        RuntimeError, match=r"Language context not set. Use language_context\(\) first."
    ):
        generator.generate(
            cv="Sample CV",
            job_description="Sample Job",
        )


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model for competence generation."""
    model = TestModel()
    model.custom_result_args = {
        "items": [
            {"text": "Strategic Problem Solving"},
            {"text": "Technical Leadership"},
            {"text": "Agile Methodology"},
            {"text": "Cross-Functional Collaboration"},
        ]
    }
    return model


def test_competence_generator_dto_output(test_model: TestModel) -> None:
    """Test that the competence generator returns a valid List[CoreCompetenceDTO]."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Initialize generator
        generator = CompetenceGenerator(ai_model="test")

        # Use agent override to set the test model
        with generator.agent.override(model=test_model):
            # Generate core competences
            result = generator.generate(
                cv="Experienced software engineer with 10 years of expertise",
                job_description=(
                    "Seeking a senior software engineer with leadership skills"
                ),
            )

            # Verify the result is a list of CoreCompetenceDTO
            assert isinstance(result, list)
            assert all(isinstance(comp, CoreCompetenceDTO) for comp in result)

            # Verify the number of competences
            assert len(result) == 4

            # Verify each competence is a CoreCompetenceDTO
            for competence in result:
                assert isinstance(competence, CoreCompetenceDTO)
                assert isinstance(competence.text, str)
                assert len(competence.text) > 0

            # Verify specific competence texts
            competence_texts = [comp.text for comp in result]
            assert "Strategic Problem Solving" in competence_texts
            assert "Technical Leadership" in competence_texts
            assert "Agile Methodology" in competence_texts
            assert "Cross-Functional Collaboration" in competence_texts
