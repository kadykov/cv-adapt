# Testing Generators

This guide explains how to effectively test generator components in cv-adapt using the established patterns and infrastructure.

## Overview

Generator tests follow a standardized approach using:
- A base test class with common test patterns
- Shared fixtures in conftest.py
- Consistent mocking strategies
- Proper resource cleanup
- Type-safe implementation

## Using the Base Test Class

All generator tests inherit from `BaseGeneratorTest`, which provides common test patterns:

```python
from base_test import BaseGeneratorTest

class TestMyGenerator(BaseGeneratorTest[MyContextType]):
    """Test cases for my generator."""

    # Set required class variables
    generator_type = AsyncGenerator
    default_template_dir = "path/to/templates"

    async def create_generator(self, **kwargs: Any) -> AsyncGenerator:
        """Create generator instance."""
        return await create_my_generator(**kwargs)

    def get_default_template_paths(self) -> dict[str, str]:
        """Get paths to default templates."""
        return {
            "system_prompt": os.path.join(self.default_template_dir, "my_prompt.j2"),
            "context": os.path.join(self.default_template_dir, "my_context.j2"),
        }

    def get_invalid_context(self) -> MyContextType:
        """Get invalid context for validation tests."""
        return MyContextType(
            cv="",  # Invalid: empty CV
            job_description="Test job",
            ...
        )
```

The base class provides tests for:
- Generator creation
- Default template loading
- Custom template support
- Basic validation

## Common Fixtures

Key fixtures are provided in `conftest.py`:

```python
@pytest.fixture
def base_context() -> ComponentGenerationContext:
    """Create base test context."""
    return ComponentGenerationContext(...)

@pytest.fixture
def mock_agent() -> AsyncMock:
    """Create mock agent."""
    return AsyncMock()

@pytest.fixture
def language_ctx() -> AbstractContextManager[None]:
    """Set up language context."""
    return language_context(ENGLISH)
```

## Test Structure

Generator tests should include:

1. Basic Infrastructure Tests (provided by base class):
   - Generator creation
   - Template handling
   - Validation

2. Generation Tests:
   ```python
   async def test_generation(
       self,
       mock_agent: AsyncMock,
       mock_agent_factory: Any,
       base_context: ComponentGenerationContext,
       language_ctx: AbstractContextManager[None],
   ) -> None:
       """Test generation with mocked agent."""
       with language_ctx:
           # Configure mock response
           mock_agent.run.return_value = Mock(data=...)

           # Patch agent class
           try:
               generator = await self.create_generator()
               result = await generator(base_context)

               # Verify result
               assert isinstance(result, ExpectedType)
               ...
           finally:
               # Clean up
               ...
   ```

3. Specific Validation Tests:
   ```python
   async def test_specific_validation(self) -> None:
       """Test specific validation rules."""
       generator = await self.create_generator()
       with pytest.raises(ValueError, match="expected message"):
           await generator(invalid_context)
   ```

## Mocking Strategy

1. Use the provided `mock_agent` fixture for the AI agent
2. Configure mock responses using appropriate model types
3. Use try/finally for proper cleanup of mocked components
4. Consider edge cases in mock responses

## Resource Management

1. Use context managers for language context
2. Clean up mocked components in finally blocks
3. Use fixtures for resource creation/cleanup
4. Handle template paths properly

## Type Safety

1. Use proper generic types with BaseGeneratorTest
2. Match context types with generator requirements
3. Use type hints consistently
4. Run mypy checks to verify type safety

## Example Implementation

Here's a complete example of a generator test:

```python
class TestExperienceGenerator(BaseGeneratorTest[ComponentGenerationContext]):
    """Test cases for experience generator."""

    generator_type = AsyncGenerator
    default_template_dir = "path/to/templates"

    async def create_generator(self, **kwargs: Any) -> AsyncGenerator:
        return await create_experience_generator(**kwargs)

    def get_default_template_paths(self) -> dict[str, str]:
        return {
            "system_prompt": os.path.join(self.default_template_dir, "experience_prompt.j2"),
            "context": os.path.join(self.default_template_dir, "experience_context.j2"),
        }

    def get_invalid_context(self) -> ComponentGenerationContext:
        return ComponentGenerationContext(
            cv="",
            job_description="Test",
            core_competences="Test",
            notes=None,
        )

    @pytest.mark.asyncio
    async def test_experience_generation(
        self,
        mock_agent: AsyncMock,
        mock_agent_factory: Any,
        base_context: ComponentGenerationContext,
        language_ctx: AbstractContextManager[None],
    ) -> None:
        with language_ctx:
            mock_experience = [Experience(...)]
            mock_agent.run.return_value = Mock(data=mock_experience)

            try:
                generator = await self.create_generator()
                result = await generator(base_context)

                assert isinstance(result, list)
                assert all(isinstance(exp, ExperienceDTO) for exp in result)
                ...
            finally:
                # Clean up mocks
                ...

    @pytest.mark.asyncio
    async def test_validation_rules(self) -> None:
        generator = await self.create_generator()
        with pytest.raises(ValueError):
            await generator(self.get_invalid_context())
```

## Best Practices

1. Follow the established pattern for consistency
2. Use proper type hints throughout
3. Clean up resources properly
4. Test both success and failure cases
5. Mock external dependencies
6. Verify generated content thoroughly
7. Run mypy checks regularly
