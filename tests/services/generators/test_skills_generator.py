import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.dto.cv import SkillDTO, SkillGroupDTO
from cv_adapter.dto.language import ENGLISH, FRENCH, GERMAN, ITALIAN, SPANISH, Language
from cv_adapter.models.language_context import get_current_language, language_context
from cv_adapter.services.generators.skills_generator import SkillsGenerator


def test_context_preparation() -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = SkillsGenerator(ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV with skills",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
            language=get_current_language(),
            notes="Focus on technical skills",
        )

    # Test context structure and content
    assert "Sample CV with skills" in context
    assert "Sample Job" in context
    assert "Strategic Problem Solving" in context
    assert "Focus on technical skills" in context
    assert "Generate a list of skills" in context
    assert "Guidelines for generating skills" in context
    assert "Language Requirements" not in context


def test_context_preparation_french() -> None:
    """Test that context is prepared correctly with French language."""
    generator = SkillsGenerator(ai_model="test")
    with language_context(FRENCH):
        context = generator._prepare_context(
            cv="Sample CV with skills",
            job_description="Sample Job",
            core_competences="Résolution Stratégique de Problèmes",
            language=get_current_language(),
            notes=None,
        )

    # Verify language-specific instructions
    assert "Language Requirements" in context
    assert "Generate skills in French" in context
    assert "professional skill terminology" in context


def test_context_preparation_without_notes() -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = SkillsGenerator(ai_model="test")
    with language_context(ENGLISH):
        context = generator._prepare_context(
            cv="Sample CV with skills",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
            language=get_current_language(),
            notes=None,
        )

    # Verify required content is present
    assert "Sample CV with skills" in context
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
    generator = SkillsGenerator(ai_model="test")
    with language_context(language):
        context = generator._prepare_context(
            cv="Sample CV with skills",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
            language=get_current_language(),
            notes=None,
        )

    if language == ENGLISH:
        assert "Language Requirements" not in context
    else:
        assert "Language Requirements" in context
        assert f"Generate skills in {language.name.title()}" in context
        assert "professional skill terminology" in context


def test_empty_cv_validation() -> None:
    """Test that empty CV raises validation error."""
    generator = SkillsGenerator(ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="CV text is required"):
            generator.generate(
                cv="   ",  # whitespace only
                job_description="Sample Job",
                core_competences="Strategic Problem Solving",
            )


def test_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    generator = SkillsGenerator(ai_model="test")
    with language_context(ENGLISH):
        with pytest.raises(ValueError, match="Job description is required"):
            generator.generate(
                cv="Sample CV with skills",
                job_description="",  # empty string
                core_competences="Strategic Problem Solving",
            )


def test_missing_language_validation() -> None:
    """Test that missing language context raises RuntimeError."""
    generator = SkillsGenerator(ai_model="test")
    with pytest.raises(
        RuntimeError, match=r"Language context not set. Use language_context\(\) first."
    ):
        generator.generate(
            cv="Sample CV with skills",
            job_description="Sample Job",
            core_competences="Strategic Problem Solving",
        )


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model for skills generation."""
    model = TestModel()
    model.custom_result_args = {
        "data": {
            "groups": [
                {
                    "name": "Programming Languages",
                    "skills": [
                        {"text": "Python"},
                        {"text": "JavaScript"},
                        {"text": "TypeScript"},
                    ],
                },
                {
                    "name": "Frameworks",
                    "skills": [
                        {"text": "React"},
                        {"text": "Django"},
                        {"text": "FastAPI"},
                    ],
                },
            ]
        }
    }
    return model


def test_skills_generator_dto_output(test_model: TestModel) -> None:
    """Test that the skills generator returns a valid List[SkillGroupDTO]."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Initialize generator
        generator = SkillsGenerator(ai_model="test")

        # Use agent override to set the test model
        with generator.agent.override(model=test_model):
            # Generate skills
            result = generator.generate(
                cv="Experienced software engineer with diverse technical skills",
                job_description=(
                    "Seeking a senior software engineer "
                    "with full-stack development skills"
                ),
                core_competences="Technical Leadership, Advanced Learning",
            )

            # Verify the result is a list of SkillGroupDTO
            assert isinstance(result, list)
            assert all(isinstance(group, SkillGroupDTO) for group in result)

            # Verify skill groups
            assert len(result) > 0

            # Verify each skill group
            for group in result:
                assert isinstance(group, SkillGroupDTO)
                assert isinstance(group.name, str)
                assert len(group.skills) > 0

                # Verify each skill
                for skill in group.skills:
                    assert isinstance(skill, SkillDTO)
                    assert isinstance(skill.text, str)
                    assert len(skill.text) > 0
