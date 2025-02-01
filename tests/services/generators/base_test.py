"""Base test class for generator tests.

IMPORTANT: All test cases must use ai_model="test" when creating generator instances.
This ensures tests don't require real API keys and work reliably in all environments.
See: https://ai.pydantic.dev/testing-evals/?h#unit-testing-with-testmodel
"""

import os
from typing import Any, Generic, TypeVar

import pytest

from cv_adapter.services.generators.protocols import (
    AsyncGenerator,
    BaseGenerationContext,
)

TContext = TypeVar("TContext", bound=BaseGenerationContext)


class BaseGeneratorTest(Generic[TContext]):
    """Base class for generator tests with common test patterns."""

    generator_type: type[AsyncGenerator] = AsyncGenerator
    default_template_dir: str = ""  # To be set by child classes

    async def create_generator(self, **kwargs: Any) -> AsyncGenerator:
        """Create generator instance. To be implemented by child classes."""
        raise NotImplementedError

    def get_default_template_paths(self) -> dict[str, str]:
        """Get paths to default templates. To be implemented by child classes."""
        raise NotImplementedError

    def get_invalid_context(self) -> TContext:
        """Get invalid context for validation tests.

        To be implemented by child classes.
        """
        raise NotImplementedError

    @pytest.mark.asyncio
    async def test_generator_creation(self) -> None:
        """Test generator creation."""
        generator = await self.create_generator(ai_model="test")
        assert isinstance(generator, AsyncGenerator)

    @pytest.mark.asyncio
    async def test_default_templates(self) -> None:
        """Test default templates existence and loading."""
        templates = self.get_default_template_paths()
        for path in templates.values():
            assert os.path.exists(path), f"Template not found: {path}"

        generator = await self.create_generator(
            ai_model="test",
            system_prompt_template_path=templates["system_prompt"],
            context_template_path=templates["context"],
        )
        assert generator is not None

    @pytest.mark.asyncio
    async def test_custom_templates(self, template_paths: dict[str, str]) -> None:
        """Test custom templates support."""
        generator = await self.create_generator(
            ai_model="test",
            system_prompt_template_path=template_paths["system_prompt"],
            context_template_path=template_paths["context"],
        )
        assert generator is not None

    @pytest.mark.asyncio
    async def test_validation(self) -> None:
        """Test input validation."""
        generator = await self.create_generator(ai_model="test")
        with pytest.raises(ValueError):
            await generator(self.get_invalid_context())
