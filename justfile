default:
    @just --list

# Install frontend dependencies
install-frontend:
    cd web-interface/frontend && npm install

# Initialize the database
init-db:
    cd web-interface/backend && python scripts/init_db.py

# Install dependencies
install:
    uv sync --frozen --all-groups --quiet
    bash -c 'source ./.venv/bin/activate'
    uv run pre-commit install
    just install-frontend
    @echo "Run 'just init-db' to initialize the database"

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
    just lint-frontend

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

# Build frontend for production
build-frontend:
    cd web-interface/frontend && npm run build

# Preview built frontend
preview-frontend:
    just build-frontend
    cd web-interface/frontend && npm run preview

# Run all checks
all:
    just lint
    just format
    just pre-commit
    just docs
    just build-frontend
    just test
    just test-backend
    just generate-types
    just test-frontend-all
    just test-frontend-cov

# Build documentation
docs:
    uv run mkdocs build --strict

# Serve documentation locally
serve-docs:
    uv run mkdocs serve

# Serve backend API on port 8000
# ARGS can include uvicorn arguments
serve-backend *ARGS='':
    cd web-interface/backend && uvicorn app.main:app --reload --port 8000 {{ARGS}}

# Serve backend API with debug logging
serve-backend-debug *ARGS='':
    cd web-interface/backend && LOG_LEVEL=DEBUG uvicorn app.main:app --reload --port 8000 --log-level debug {{ARGS}} --use-colors

# Serve frontend development server
serve-frontend:
    cd web-interface/frontend && npm run dev

# Serve complete web interface (both frontend and backend)
serve-web *ARGS='':
    just serve-backend {{ARGS}} & \
    just serve-frontend & \
    wait

# Serve complete web interface with debug logging
serve-web-debug *ARGS='':
    just serve-backend-debug {{ARGS}} & \
    just serve-frontend & \
    wait

# Generate TypeScript types from Pydantic models
generate-types:
    cd web-interface/backend && python scripts/generate_typescript_types.py

# Run backend tests
test-backend *ARGS='':
    cd web-interface/backend && uv run pytest tests/ {{ARGS}}

# Run frontend unit tests
test-frontend:
    cd web-interface/frontend && npm test

# Run frontend integration tests (requires backend in test mode)
test-frontend-integration:
    cd web-interface/backend && TESTING=1 uvicorn app.main:app --port 8000 & \
    sleep 5 && cd ../frontend && npm run test:integration; \
    kill %1

# Run frontend E2E tests
test-frontend-e2e:
    cd web-interface/frontend && npm run test:e2e

# Run all frontend tests (unit, integration, and E2E)
test-frontend-all:
    just test-frontend
    just test-frontend-integration
    just test-frontend-e2e

# Run frontend tests with coverage
test-frontend-cov:
    cd web-interface/frontend && npm test -- --coverage

# Run frontend linting
lint-frontend:
    cd web-interface/frontend && npm run lint
