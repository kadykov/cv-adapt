default:
    @just --list

# Install dependencies
install:
    uv sync --frozen --group dev
    uv run pre-commit install

# Run tests
test:
    uv run pytest ./tests

# Run tests with coverage
test-cov:
    uv run pytest --cov=cv_adapter

# Run linting checks
lint:
    uv run ruff check --fix .
    uv run mypy .

# Format code
format:
    uv run ruff format .
    uv run isort .

# Run pre-commit checks
pre-commit:
    uv run pre-commit run --all-files

# Run all checks
all:
    just lint
    just format
    just pre-commit
    just test
