import os
import tempfile
from typing import Any, List

import pytest
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.cv import CoreCompetenceDTO
from cv_adapter.dto.language import ENGLISH, Language
from cv_adapter.models.language_context import language_context
from cv_adapter.services.generators.base import BaseGenerator


def create_test_generator(
    ai_model: KnownModelName,
    system_prompt_template_path: str,
    context_template_path: str | None = None,
) -> BaseGenerator:
    """Create a test generator with a custom generate method."""

    class TestBaseGenerator(BaseGenerator):
        def generate(
            self, cv: str, job_description: str, language: Language, **kwargs: Any
        ) -> List[CoreCompetenceDTO]:
            """Validate inputs and return dummy data."""
            # Validate inputs as per base generator's requirements
            if not cv or cv.isspace():
                raise ValueError("CV text is required")

            if not job_description or job_description.isspace():
                raise ValueError("Job description is required")

            # Explicitly check for language context
            try:
                from cv_adapter.models.language_context import get_current_language

                get_current_language()
            except RuntimeError:
                raise RuntimeError(
                    "Language context not set. Use language_context() first."
                )

            return [
                CoreCompetenceDTO(text="Test Competence 1"),
                CoreCompetenceDTO(text="Test Competence 2"),
            ]

    return TestBaseGenerator(
        ai_model=ai_model,
        system_prompt_template_path=system_prompt_template_path,
        context_template_path=context_template_path,
    )


def create_temp_template(content: str = "Test template") -> str:
    """Create a temporary template file."""
    temp_template = tempfile.NamedTemporaryFile(mode="w", suffix=".j2", delete=False)
    temp_template.write(content)
    temp_template.close()
    return temp_template.name


def test_base_generator_initialization() -> None:
    """Test base generator initialization with valid parameters."""
    system_prompt_path = create_temp_template()
    context_path = create_temp_template("Context: {{ cv }}")

    try:
        generator = create_test_generator(
            ai_model="test",
            system_prompt_template_path=system_prompt_path,
            context_template_path=context_path,
        )
        assert generator is not None
    finally:
        os.unlink(system_prompt_path)
        os.unlink(context_path)


def test_base_generator_empty_cv_validation() -> None:
    """Test that empty CV raises validation error."""
    system_prompt_path = create_temp_template()
    context_path = create_temp_template("Context: {{ cv }}")

    try:
        generator = create_test_generator(
            ai_model="test",
            system_prompt_template_path=system_prompt_path,
            context_template_path=context_path,
        )

        with language_context(ENGLISH):
            with pytest.raises(ValueError, match="CV text is required"):
                generator.generate(
                    cv="   ",  # whitespace only
                    job_description="Sample Job",
                    language=ENGLISH,
                )
    finally:
        os.unlink(system_prompt_path)
        os.unlink(context_path)


def test_base_generator_empty_job_description_validation() -> None:
    """Test that empty job description raises validation error."""
    system_prompt_path = create_temp_template()
    context_path = create_temp_template("Context: {{ cv }}")

    try:
        generator = create_test_generator(
            ai_model="test",
            system_prompt_template_path=system_prompt_path,
            context_template_path=context_path,
        )

        with language_context(ENGLISH):
            with pytest.raises(ValueError, match="Job description is required"):
                generator.generate(
                    cv="Sample CV",
                    job_description="",  # empty string
                    language=ENGLISH,
                )
    finally:
        os.unlink(system_prompt_path)
        os.unlink(context_path)


def test_base_generator_missing_language_context() -> None:
    """Test that missing language context raises RuntimeError."""
    system_prompt_path = create_temp_template()
    context_path = create_temp_template("Context: {{ cv }}")

    try:
        generator = create_test_generator(
            ai_model="test",
            system_prompt_template_path=system_prompt_path,
            context_template_path=context_path,
        )

        with pytest.raises(
            RuntimeError,
            match=r"Language context not set. Use language_context\(\) first.",
        ):
            generator.generate(
                cv="Sample CV", job_description="Sample Job", language=ENGLISH
            )
    finally:
        os.unlink(system_prompt_path)
        os.unlink(context_path)


def test_base_generator_non_existent_system_prompt_template() -> None:
    """Test that generator fails when system prompt template does not exist."""
    with pytest.raises(FileNotFoundError, match="System prompt template not found"):
        create_test_generator(
            ai_model="test",
            system_prompt_template_path="/path/to/non/existent/template.j2",
        )


def test_base_generator_empty_system_prompt_template() -> None:
    """Test that generator fails with an empty system prompt template."""
    empty_template_path = create_temp_template("")

    try:
        with pytest.raises(RuntimeError, match="Rendered system prompt is empty"):
            create_test_generator(
                ai_model="test", system_prompt_template_path=empty_template_path
            )
    finally:
        os.unlink(empty_template_path)


def test_base_generator_successful_generation() -> None:
    """Test successful generation with valid inputs."""
    system_prompt_path = create_temp_template()
    context_path = create_temp_template("Context: {{ cv }}")

    try:
        generator = create_test_generator(
            ai_model="test",
            system_prompt_template_path=system_prompt_path,
            context_template_path=context_path,
        )

        with language_context(ENGLISH):
            result = generator.generate(
                cv="Sample CV", job_description="Sample Job", language=ENGLISH
            )

        assert len(result) == 2
        assert all(isinstance(item, CoreCompetenceDTO) for item in result)
    finally:
        os.unlink(system_prompt_path)
        os.unlink(context_path)
