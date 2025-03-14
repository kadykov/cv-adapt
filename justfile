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
    uv run pytest {{ARGS}} --no-header

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
    uv run ruff check --select I --fix {{ARGS}}
    uv run ruff format {{ARGS}}
    uv run ruff check --fix {{ARGS}}

# Run mypy on a specific file or directory
mypy *ARGS='.':
    uv run mypy {{ARGS}}

# Format code
format *ARGS='.':
    just ruff {{ARGS}}
    just format-frontend

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
    just format
    just lint
    just test
    just test-backend
    just export-openapi
    just generate-types
    just test-frontend-cov
    just type-check-frontend
    just docs
    just build-frontend
    just pre-commit

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

# Export OpenAPI schema from backend
export-openapi:
    cd web-interface/backend && ./scripts/export_openapi_schema.py

# Generate TypeScript types from OpenAPI schema
generate-types: export-openapi
    cd web-interface/frontend && npm run generate-api-types

# Run backend tests
test-backend *ARGS='':
    cd web-interface/backend && uv run pytest tests/ {{ARGS}} --no-header

# Run frontend unit tests
test-frontend:
    cd web-interface/frontend && npm test --silent

# Run frontend integration tests
test-frontend-integration:
    cd web-interface/frontend && npm run test:integration

# Run all frontend tests (unit and integration)
test-frontend-all:
    just test-frontend
    just test-frontend-integration

# Run frontend tests with coverage (unit and integration tests together)
test-frontend-cov:
    mkdir -p web-interface/frontend/coverage/.tmp
    cd web-interface/frontend && npm run test:coverage

# Run frontend linting
lint-frontend:
    cd web-interface/frontend && npm run lint
    cd web-interface/frontend && npm run format:check
    just type-check-frontend

# Format frontend code
format-frontend:
    cd web-interface/frontend && npm run format

# Run frontend type checking
type-check-frontend:
    cd web-interface/frontend && npm run type-check
