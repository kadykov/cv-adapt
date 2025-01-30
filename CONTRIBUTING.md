# Contributing to CV Adapt

Thank you for your interest in contributing to CV Adapt! This document provides guidelines and instructions for contributing to the project.

## Development Setup

The project includes a devcontainer configuration to provide a consistent development environment. If you're using VS Code with the Remote - Containers extension, you can open the project in a container that has all the necessary dependencies pre-configured.

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/your-username/cv-adapt.git
   cd cv-adapt
   ```

2. Install development dependencies:
   ```bash
   pip install -e ".[dev]"
   ```

3. Install pre-commit hooks:
   ```bash
   pre-commit install
   ```

## Development Workflow

### 1. Code Quality

Before submitting changes, ensure all quality checks pass:

```bash
just all  # Runs all checks
```

This includes:
- Code formatting with ruff
- Type checking with mypy
- Running tests with pytest
- Pre-commit hooks

Individual commands:
```bash
just format        # Format code
just lint          # Run linting and type checks
just test          # Run tests
just test-cov      # Run tests with coverage
just pre-commit    # Run pre-commit hooks
```

### 2. Type Safety

- All function definitions must include type hints
- Enable strict type checking with mypy
- Use protocols for interface definitions
- Validate data with Pydantic models

Example:
```python
from typing import Protocol
from pydantic import BaseModel

class DataModel(BaseModel):
    field: str

class ProcessorProtocol(Protocol):
    def process(self, data: DataModel) -> str:
        ...
```

### 3. Documentation

When adding new features or making changes:

1. Update docstrings:
   - Use Google style docstrings
   - Include type information
   - Provide usage examples

2. Update documentation:
   - Add/update relevant sections in `/docs`
   - Follow the Diátaxis framework organization
   - Include practical examples

3. Generate API documentation:
   ```bash
   just docs     # Build documentation
   just serve-docs  # Preview documentation locally
   ```

### 4. Testing

- Write tests for all new features
- Maintain high test coverage
- Follow existing test patterns
- Use pytest fixtures for common setups

Example:
```python
def test_new_feature():
    # Arrange
    input_data = ...

    # Act
    result = process_data(input_data)

    # Assert
    assert result.is_valid()
```

## Pull Request Process

1. Create a new branch:
   ```bash
   git checkout -b feature-name
   ```

2. Make your changes:
   - Follow code style guidelines
   - Add tests
   - Update documentation

3. Run quality checks:
   ```bash
   just all
   ```

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

5. Push to your fork:
   ```bash
   git push origin feature-name
   ```

6. Create a Pull Request:
   - Provide a clear description
   - Link related issues
   - Include any necessary context

## Code Style Guidelines

1. **Formatting**
   - Use ruff for code formatting
   - Follow PEP 8 guidelines
   - Maintain consistent import ordering

2. **Naming Conventions**
   - Use descriptive names
   - Follow Python naming conventions
   - Be consistent with existing code

3. **Code Organization**
   - Keep functions and classes focused
   - Use appropriate abstraction levels
   - Follow separation of concerns

4. **Comments and Documentation**
   - Write clear, concise comments
   - Keep docstrings up to date
   - Include usage examples

## Language Support

When adding language-specific features:

1. Update language enums and constants
2. Add language-specific tests
3. Update documentation
4. Consider localization implications

## Renderer Development

When creating new renderers:

1. Implement the base renderer interface
2. Follow the established patterns
3. Add comprehensive tests
4. Document usage and examples

## Issue Guidelines

When creating issues:

1. Use appropriate templates
2. Provide clear reproduction steps
3. Include relevant context
4. Tag appropriately

## Getting Help

- Check the [documentation](docs/)
- Review existing issues
- Ask questions in discussions
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license.
