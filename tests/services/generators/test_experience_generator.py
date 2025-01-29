from datetime import date
from typing import Dict, TypedDict, cast

import pytest

from cv_adapter.dto.cv import ExperienceDTO, InstitutionDTO
from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.services.generators.experience_generator import (
    create_experience_generator,
)
from cv_adapter.services.generators.protocols import ComponentGenerationContext


class GeneratorParams(TypedDict):
    cv: str
    job_description: str
    core_competences: str


def test_experience_generator_dto_output() -> None:
    """Test that the experience generator returns a valid ExperiencesDTO."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Create generator creator
        generator = create_experience_generator(ai_model="test")

        # Create context
        context = ComponentGenerationContext(
            cv="Experienced software engineer with 10 years of expertise",
            job_description="Seeking a senior software engineer with leadership skills",
            core_competences="Technical Leadership, Strategic Problem Solving",
        )

        # Generate experiences
        result = generator(context)

        # Verify the result is a list of ExperienceDTO
        assert isinstance(result, list)
        assert len(result) > 0

        # Verify the experience is an ExperienceDTO
        experience = result[0]
        assert isinstance(experience, ExperienceDTO)
        assert isinstance(experience.company, InstitutionDTO)
        assert isinstance(experience.position, str)
        assert isinstance(experience.start_date, date)
        assert isinstance(experience.description, str)
        assert isinstance(experience.technologies, list)

        # Verify basic properties of the experience
        assert experience.company.name is not None
        assert experience.position is not None
        assert experience.start_date is not None
        assert experience.description is not None
        assert len(experience.technologies) > 0


@pytest.mark.parametrize("invalid_param", ["cv", "job_description", "core_competences"])
def test_experience_generator_raises_error_on_empty_parameters(
    invalid_param: str,
) -> None:
    """Test that generator raises ValueError when required parameters are empty strings.

    Tests each required parameter with an empty string value.
    """
    with language_context(ENGLISH):
        generator = create_experience_generator(ai_model="test")

        # Create base params with explicit typing
        base_params: Dict[str, str] = {
            "cv": "Valid CV text",
            "job_description": "Valid job description",
            "core_competences": "Valid core competences",
        }
        # Create new dict with empty parameter
        modified_params = {**base_params, invalid_param: ""}

        # Cast the modified params to the correct types
        params: GeneratorParams = {
            "cv": cast(str, modified_params["cv"]),
            "job_description": cast(str, modified_params["job_description"]),
            "core_competences": cast(str, modified_params["core_competences"]),
        }

        context = ComponentGenerationContext(**params)

        with pytest.raises(ValueError):
            generator(context)
