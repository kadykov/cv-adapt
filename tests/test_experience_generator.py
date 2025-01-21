import pytest

from cv_adapter.services.generators.experience_generator import ExperienceGenerator


def test_context_preparation() -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = ExperienceGenerator(ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        core_competences="Python, Leadership",
        notes="Focus on tech",
    )
    
    # Test context structure and content
    assert "Sample CV" in context
    assert "Sample Job" in context
    assert "Python, Leadership" in context
    assert "Focus on tech" in context
    assert "Guidelines for generating experiences" in context
    assert "experiences tailored to the job" in context
    assert "Select only relevant experiences" in context


def test_context_preparation_without_notes() -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = ExperienceGenerator(ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        core_competences="Python, Leadership",
        notes=None,
    )
    
    # Verify required content is present
    assert "Sample CV" in context
    assert "Sample Job" in context
    assert "Python, Leadership" in context
    
    # Verify optional content is not present
    assert "User Notes for Consideration" not in context


def test_empty_cv_validation() -> None:
    """Test that empty CV raises validation error."""
    generator = ExperienceGenerator(ai_model="test")
    with pytest.raises(ValueError, match="This field is required"):
        generator.generate(
            cv="   ",  # whitespace only
            job_description="Sample Job",
            core_competences="Python, Leadership",
        )


def test_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    generator = ExperienceGenerator(ai_model="test")
    with pytest.raises(ValueError, match="String should have at least 1 character"):
        generator.generate(
            cv="Sample CV",
            job_description="",  # empty string
            core_competences="Python, Leadership",
        )


def test_empty_core_competences_validation() -> None:
    """Test that empty core competences raises validation error."""
    generator = ExperienceGenerator(ai_model="test")
    with pytest.raises(ValueError, match="This field is required"):
        generator.generate(
            cv="Sample CV",
            job_description="Sample Job",
            core_competences="\n",  # newline only
        )
