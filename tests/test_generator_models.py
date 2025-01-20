"""Tests for generator input models."""

import pytest
from pydantic import ValidationError

from cv_adapter.models.generators import (
    EducationGeneratorInput,
    ExperienceGeneratorInput,
    GeneratorInputBase,
    SkillsGeneratorInput,
    TitleGeneratorInput,
)


def test_generator_input_base_validation() -> None:
    """Test validation of GeneratorInputBase model."""
    # Test valid input
    input_data = GeneratorInputBase(
        cv_text="CV text",
        job_description="Job description",
        core_competences="Core competences",
    )
    assert input_data.cv_text == "CV text"
    assert input_data.job_description == "Job description"
    assert input_data.core_competences == "Core competences"
    assert input_data.notes is None

    # Test with notes
    input_data = GeneratorInputBase(
        cv_text="CV text",
        job_description="Job description",
        core_competences="Core competences",
        notes="Some notes",
    )
    assert input_data.notes == "Some notes"

    # Test empty strings
    with pytest.raises(ValidationError):
        GeneratorInputBase(
            cv_text="",
            job_description="Job description",
            core_competences="Core competences",
        )

    with pytest.raises(ValidationError):
        GeneratorInputBase(
            cv_text="CV text",
            job_description="",
            core_competences="Core competences",
        )

    with pytest.raises(ValidationError):
        GeneratorInputBase(
            cv_text="CV text",
            job_description="Job description",
            core_competences="",
        )

    # Test whitespace-only strings
    with pytest.raises(ValidationError):
        GeneratorInputBase(
            cv_text="   \n  ",
            job_description="Job description",
            core_competences="Core competences",
        )

    # Test empty notes are converted to None
    input_data = GeneratorInputBase(
        cv_text="CV text",
        job_description="Job description",
        core_competences="Core competences",
        notes="   ",
    )
    assert input_data.notes is None


def test_experience_generator_input_validation() -> None:
    """Test validation of ExperienceGeneratorInput model."""
    # Test valid input
    input_data = ExperienceGeneratorInput(
        cv_text="CV text",
        job_description="Job description",
        core_competences="Core competences",
    )
    assert isinstance(input_data, GeneratorInputBase)
    assert input_data.cv_text == "CV text"
    assert input_data.job_description == "Job description"
    assert input_data.core_competences == "Core competences"
    assert input_data.notes is None


def test_title_generator_input_validation() -> None:
    """Test validation of TitleGeneratorInput model."""
    # Test valid input
    input_data = TitleGeneratorInput(
        cv_text="CV text",
        job_description="Job description",
        core_competences="Core competences",
    )
    assert isinstance(input_data, GeneratorInputBase)
    assert input_data.cv_text == "CV text"
    assert input_data.job_description == "Job description"
    assert input_data.core_competences == "Core competences"
    assert input_data.notes is None


def test_education_generator_input_validation() -> None:
    """Test validation of EducationGeneratorInput model."""
    # Test valid input
    input_data = EducationGeneratorInput(
        cv_text="CV text",
        job_description="Job description",
        core_competences="Core competences",
    )
    assert isinstance(input_data, GeneratorInputBase)
    assert input_data.cv_text == "CV text"
    assert input_data.job_description == "Job description"
    assert input_data.core_competences == "Core competences"
    assert input_data.notes is None


def test_skills_generator_input_validation() -> None:
    """Test validation of SkillsGeneratorInput model."""
    # Test valid input
    input_data = SkillsGeneratorInput(
        cv_text="CV text",
        job_description="Job description",
        core_competences="Core competences",
    )
    assert isinstance(input_data, GeneratorInputBase)
    assert input_data.cv_text == "CV text"
    assert input_data.job_description == "Job description"
    assert input_data.core_competences == "Core competences"
    assert input_data.notes is None
