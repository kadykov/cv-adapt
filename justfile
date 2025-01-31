default:
    @just --list

# Install frontend dependencies
install-frontend:
    cd web-interface/frontend && npm install

# Install dependencies
install:
    uv sync --frozen --all-groups --quiet
    uv pip install -e .
    bash -c 'source ./.venv/bin/activate'
    uv run pre-commit install
    just install-frontend

# Run tests
test *ARGS='./tests':
    uv run pytest {{ARGS}}

# Run tests with coverage
test-cov:
    uv run pytest --cov-report term-missing --cov=cv_adapter ./tests

# Run linting checks
lint *ARGS='.':
    just ruff {{ARGS}}
    just mypy {{ARGS}}

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

# Serve backend API on port 8000
serve-backend:
    cd web-interface/backend && uvicorn app.main:app --reload --port 8000

# Serve frontend development server on port 3000
serve-frontend:
    cd web-interface/frontend && npm start

# Serve complete web interface (both frontend and backend)
serve-web:
    just serve-backend & \
    just serve-frontend & \
    wait
