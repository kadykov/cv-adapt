import os
import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.language import ENGLISH, FRENCH, GERMAN, ITALIAN, SPANISH, Language
from cv_adapter.models.language_context import get_current_language, language_context
from cv_adapter.services.generators.competence_generator import CompetenceGenerator


@pytest.fixture
def valid_system_prompt_template(tmp_path):
    """Create a valid system prompt template."""
    template_path = tmp_path / "system_prompt.j2"
    template_path.write_text(
        "An expert CV analyst that helps identify and describe core competences. "
        "Generate 4-6 concise competences that match job requirements."
    )
    return str(template_path)


@pytest.fixture
def valid_context_template(tmp_path):
    """Create a valid context template."""
    template_path = tmp_path / "context.j2"
    template_path.write_text(
        "{% if language != ENGLISH %}"
        "Language Requirements: Generate in {{ language.name.title() }}. "
        "{% endif %}"
        "CV: {{ cv }}\n"
        "Job Description: {{ job_description }}\n"
        "{% if notes is defined %}Notes: {{ notes }}{% endif %}"
    )
    return str(template_path)


@pytest.fixture
def empty_template(tmp_path):
    """Create an empty template."""
    template_path = tmp_path / "empty.j2"
    template_path.write_text("")
    return str(template_path)


def test_context_preparation(valid_context_template: str) -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = CompetenceGenerator(
        ai_model="test", 
        context_template_path=valid_context_template
    )
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
            notes="Focus on tech",
        )

    # Test context structure and content
    assert "Sample CV" in context
    assert "Sample Job" in context
    assert "Notes: Focus on tech" in context


def test_context_preparation_french(valid_context_template: str) -> None:
    """Test that context is prepared correctly with French language."""
    generator = CompetenceGenerator(
        ai_model="test", 
        context_template_path=valid_context_template
    )
    with language_context(FRENCH):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
        )

    # Verify language-specific instructions
    assert "Language Requirements: Generate in French" in context


def test_context_preparation_without_notes(valid_context_template: str) -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = CompetenceGenerator(
        ai_model="test", 
        context_template_path=valid_context_template
    )
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
        )

    # Verify required content is present
    assert "Sample CV" in context
    assert "Sample Job" in context

    # Verify notes are not present
    assert "Notes:" not in context


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
def test_context_preparation_all_languages(
    language: Language, 
    valid_context_template: str
) -> None:
    """Test context preparation for all supported languages."""
    generator = CompetenceGenerator(
        ai_model="test", 
        context_template_path=valid_context_template
    )
    with language_context(language):
        context = generator._prepare_context(
            cv="Sample CV",
            job_description="Sample Job",
        )

    if language == ENGLISH:
        assert "Language Requirements" not in context
    else:
        assert f"Language Requirements: Generate in {language.name.title()}" in context


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


def test_generator_with_valid_templates(
    valid_system_prompt_template: str, 
    valid_context_template: str, 
    test_model: TestModel
) -> None:
    """Test generator with valid custom templates."""
    with language_context(ENGLISH):
        generator = CompetenceGenerator(
            ai_model="test",
            system_prompt_template_path=valid_system_prompt_template,
            context_template_path=valid_context_template
        )

        # Use agent override to set the test model
        with generator.agent.override(model=test_model):
            result = generator.generate(
                cv="Experienced software engineer with 10 years of expertise",
                job_description="Seeking a senior software engineer with leadership skills",
            )

            # Verify the result is a list of CoreCompetenceDTO
            assert isinstance(result, list)
            assert all(isinstance(comp, CoreCompetenceDTO) for comp in result)
            assert len(result) == 4


def test_generator_with_no_template_path() -> None:
    """Test that generator fails when no template path is provided."""
    with pytest.raises(ValueError, match="System prompt template path is not provided"):
        CompetenceGenerator(
            ai_model="test",
            system_prompt_template_path=None,
        )


def test_generator_with_non_existent_template() -> None:
    """Test that generator fails when template does not exist."""
    with pytest.raises(FileNotFoundError, match="System prompt template not found"):
        CompetenceGenerator(
            ai_model="test",
            system_prompt_template_path="/path/to/non/existent/template.j2",
        )


def test_generator_with_empty_template(empty_template: str) -> None:
    """Test that generator fails with an empty template."""
    with pytest.raises(RuntimeError, match="Rendered system prompt is empty"):
        CompetenceGenerator(
            ai_model="test",
            system_prompt_template_path=empty_template,
        )
