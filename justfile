default:
    @just --list

# Install dependencies
install:
    uv pip install -e ".[dev]"

# Run tests
test:
    uv run pytest ./tests

# Run tests with coverage
test-cov:
    uv run pytest --cov=cv_adapter

# Format and lint code
fmt:
    uv run ruff --fix .
    uv run mypy .

# Run linting checks
lint:
    uv run ruff check .
    uv run mypy .
