default:
    @just --list

# Install dependencies
install:
    uv sync --frozen --group dev --quiet
    bash -c 'source ./.venv/bin/activate'
    uv pip install -e .
    uv run pre-commit install

# Run tests
test *ARGS='./tests':
    uv run pytest {{ARGS}}

# Run tests with coverage
test-cov:
    uv run pytest --cov-report term-missing --cov=cv_adapter ./tests

# Run linting checks
lint *ARGS='.':
    just format {{ARGS}}
    uv run ruff check --fix {{ARGS}}
    uv run mypy {{ARGS}}

# Run ruff on a specific file or directory with auto-fixes
ruff *ARGS='.':
    just format {{ARGS}}
    uv run ruff check --fix {{ARGS}}

# Run mypy on a specific file or directory
mypy *ARGS='.':
    uv run mypy {{ARGS}}

# Format code
format *ARGS='.':
    uv run ruff check --select I --fix {{ARGS}}
    uv run ruff format {{ARGS}}

# Run pre-commit checks
pre-commit:
    uv run pre-commit run --all-files

# Run all checks
all:
    just lint
    just format
    just pre-commit
    just test

# Build documentation
docs:
    uv run mkdocs build --strict

# Serve documentation locally
serve-docs:
    uv run mkdocs serve
