import pytest

from cv_adapter.dto.language import ENGLISH, FRENCH, GERMAN, ITALIAN, SPANISH
from cv_adapter.models.language import Language
from cv_adapter.models.language_context import language_context
from cv_adapter.renderers.markdown import MinimalMarkdownRenderer
from cv_adapter.services.generators.summary_generator import SummaryGenerator


def test_context_preparation() -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
            core_competences="Python, Leadership",
            language=ENGLISH,
            notes="Focus on tech",
        )

    # Test context structure and content
    assert "Sample CV" in context
    assert "Sample Job" in context
    assert "Python, Leadership" in context
    assert "Focus on tech" in context
    assert "Based on the CV and job description" in context
    assert "create a concise and impactful CV summary" in context
    assert "Language Requirements" not in context
    assert "User Notes for Consideration" in context


def test_context_preparation_french() -> None:
    """Test that context is prepared correctly with French language."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with language_context(FRENCH):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
            core_competences="Python, Leadership",
            language=FRENCH,
            notes=None,
        )

    # Verify language-specific instructions
    assert "Language Requirements" in context
    assert "Generate the summary in French" in context
    assert "professional communication conventions" in context


def test_context_preparation_without_notes() -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
            core_competences="Python, Leadership",
            language=ENGLISH,
            notes=None,
        )

    # Verify required content is present
    assert "Sample CV" in context
    assert "Sample Job" in context
    assert "Python, Leadership" in context

    # Verify optional content is not present
    assert "User Notes for Consideration" not in context
    assert "notes" not in context.lower()


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
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with language_context(language):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
            core_competences="Python, Leadership",
            language=language,
            notes=None,
        )

    if language == ENGLISH:
        assert "Language Requirements" not in context
    else:
        assert "Language Requirements" in context
        assert f"Generate the summary in {language.name.title()}" in context
        assert "professional communication conventions" in context


def test_generate_summary_dto() -> None:
    """Test that generate method returns a SummaryDTO."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with language_context(ENGLISH):
        result = generator.generate(
            cv="Sample CV",
            job_description="Sample Job",
            core_competences="Python, Leadership",
        )

    # Verify DTO structure
    assert hasattr(result, "text")
    assert isinstance(result.text, str)
    assert len(result.text) > 0


def test_empty_cv_validation() -> None:
    """Test that empty CV raises validation error."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="CV text is required"):
            generator.generate(
                cv="   ",  # whitespace only
                job_description="Sample Job",
                core_competences="Python, Leadership",
            )


def test_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="Job description is required"):
            generator.generate(
                cv="Sample CV",
                job_description="",  # empty string
                core_competences="Python, Leadership",
            )


def test_empty_core_competences_validation() -> None:
    """Test that empty core competences raises validation error."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="Core competences are required"):
            generator.generate(
                cv="Sample CV",
                job_description="Sample Job",
                core_competences="\n",  # newline only
            )
