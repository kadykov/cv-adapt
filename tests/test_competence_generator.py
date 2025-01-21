import pytest

from cv_adapter.services.generators.competence_generator import CompetenceGenerator


def test_context_preparation() -> None:
    """Test that context is prepared correctly with all input fields."""
    generator = CompetenceGenerator(ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        notes="Focus on tech",
    )
    
    # Test context structure and content
    assert "Sample CV" in context
    assert "Sample Job" in context
    assert "Focus on tech" in context
    assert "identify 4-6 core competences" in context
    assert "Each competence should be a concise phrase" in context


def test_context_preparation_without_notes() -> None:
    """Test that context is prepared correctly without optional notes."""
    generator = CompetenceGenerator(ai_model="test")
    context = generator._prepare_context(
        cv="Sample CV",
        job_description="Sample Job",
        notes=None,
    )
    
    # Verify required content is present
    assert "Sample CV" in context
    assert "Sample Job" in context
    
    # Verify optional content is not present
    assert "User Notes for Consideration" not in context


def test_empty_cv_validation() -> None:
    """Test that empty CV raises validation error."""
    generator = CompetenceGenerator(ai_model="test")
    with pytest.raises(ValueError, match="This field is required"):
        generator.generate(
            cv="   ",  # whitespace only
            job_description="Sample Job",
        )


def test_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    generator = CompetenceGenerator(ai_model="test")
    with pytest.raises(ValueError, match="String should have at least 1 character"):
        generator.generate(
            cv="Sample CV",
            job_description="",  # empty string
        )
