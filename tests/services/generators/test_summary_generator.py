import pytest

from cv_adapter.models.language import Language
from cv_adapter.renderers.markdown.minimal_markdown_renderer import (
    MinimalMarkdownRenderer,
)
from cv_adapter.services.generators.summary_generator import SummaryGenerator


def test_context_preparation() -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        core_competences="Python, Leadership",
        language=Language.ENGLISH,
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


def test_context_preparation_french() -> None:
    """Test that context is prepared correctly with French language."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        core_competences="Python, Leadership",
        language=Language.FRENCH,
        notes=None,
    )

    # Verify language-specific instructions
    assert "Language Requirements" in context
    assert "Generate the summary in French" in context
    assert "professional communication conventions" in context


def test_context_preparation_without_notes() -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        core_competences="Python, Leadership",
        language=Language.ENGLISH,
        notes=None,
    )

    # Verify required content is present
    assert "Sample CV" in context
    assert "Sample Job" in context
    assert "Python, Leadership" in context

    # Verify optional content is not present
    assert "User Notes for Consideration" not in context


@pytest.mark.parametrize(
    "language",
    [
        Language.ENGLISH,
        Language.FRENCH,
        Language.GERMAN,
        Language.SPANISH,
        Language.ITALIAN,
    ],
)
def test_context_preparation_all_languages(language: Language) -> None:
    """Test context preparation for all supported languages."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        core_competences="Python, Leadership",
        language=language,
        notes=None,
    )

    if language == Language.ENGLISH:
        assert "Language Requirements" not in context
    else:
        assert "Language Requirements" in context
        assert f"Generate the summary in {language.name.title()}" in context
        assert "professional communication conventions" in context


def test_empty_cv_validation() -> None:
    """Test that empty CV raises validation error."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with pytest.raises(ValueError, match="This field is required"):
        generator.generate(
            cv="   ",  # whitespace only
            job_description="Sample Job",
            core_competences="Python, Leadership",
            language=Language.ENGLISH,
        )


def test_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with pytest.raises(ValueError, match="String should have at least 1 character"):
        generator.generate(
            cv="Sample CV",
            job_description="",  # empty string
            core_competences="Python, Leadership",
            language=Language.ENGLISH,
        )


def test_empty_core_competences_validation() -> None:
    """Test that empty core competences raises validation error."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with pytest.raises(ValueError, match="This field is required"):
        generator.generate(
            cv="Sample CV",
            job_description="Sample Job",
            core_competences="\n",  # newline only
            language=Language.ENGLISH,
        )


def test_missing_language_validation() -> None:
    """Test that missing language raises TypeError."""
    generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")
    with pytest.raises(
        TypeError, match="missing 1 required positional argument: 'language'"
    ):
        generator.generate(  # type: ignore[call-arg]
            cv="Sample CV",
            job_description="Sample Job",
            core_competences="Python, Leadership",
        )
