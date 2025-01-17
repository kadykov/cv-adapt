---
name: repo
type: repo
agent: CodeActAgent
---

Repository: CV Adapt
Description: Application for adapting CV and generating cover letters based on job descriptions

Project Structure:
1. Main Application Code (`cv_adapter/`):
   - `core/`: Core application components
     - `application.py`: Main application logic
   - `models/`: Data models and schemas
     - `cv.py`: CV-related data structures
   - `services/`: Business logic services
     - `competence_analyzer.py`: Analyzes competencies in CVs
     - `cv_adapter.py`: CV adaptation service
     - `cv_storage.py`: CV storage management
     - `description_generator.py`: Generates descriptions
     - `education_generator.py`: Generates education sections
     - `experience_generator.py`: Generates experience sections
   - `py.typed`: Marker file for type checking

2. Tests (`tests/`):
   - Contains test files matching pattern `test_*.py`
   - Uses pytest framework with coverage reporting

3. Configuration Files:
   - `pyproject.toml`: Project metadata and dependencies
   - `justfile`: Task runner commands
   - `.pre-commit-config.yaml`: Pre-commit hooks configuration
   - `.env.example`: Template for environment variables

Technical Stack:
- Python 3.12+
- Key Dependencies:
  - `pydantic` (>=2.5.2): Data validation
  - `pydantic-ai` (>=0.0.18): Type-safe LLM interactions
  - `rich` (>=13.7.0): Rich text formatting

Development Tools:
- `uv`: Package management (preferred over pip)
- `ruff`: Linting and formatting
- `mypy`: Static type checking
- `pytest`: Testing framework
- `pre-commit`: Git hooks for code quality

Setup Instructions:
1. Install dependencies:
   ```bash
   just install
   ```
2. Activate virtual environment:
   ```bash
   source .venv/bin/activate
   ```

Development Guidelines:
1. Code Quality and Pre-commit Process:
   - IMPORTANT: Always run `just all` before committing changes. This command:
     * Runs code formatting with ruff and isort
     * Performs static type checking with mypy
     * Runs pre-commit hooks for various checks
     * Executes all tests with pytest
   - Individual commands are available but should not replace the full check:
     * `just lint`: Code style and type checks
     * `just format`: Code formatting only
     * `just test`: Run tests only
     * `just pre-commit`: Run pre-commit hooks only
   - Follow type hints and enable strict type checking
   - All functions (including tests) must have type annotations

2. Package Management:
   - Use `uv add <package>` for adding new dependencies
   - Avoid using pip directly
   - Dev dependencies are grouped in pyproject.toml

3. Working with LLMs:
   - Use `pydantic-ai` for type-safe LLM interactions
   - Always use `run_sync()` instead of `run()` to avoid async complexity
   - Define clear input/output models for LLM interactions

4. Testing:
   - Write tests for all new features
   - Maintain high test coverage
   - Tests should be in `tests/` directory
   - Use pytest fixtures for common test setups

5. Type Safety:
   - All function definitions must be typed
   - Use mypy for static type checking
   - Project has strict type checking enabled

6. Documentation Maintenance:
   - Keep `.openhands/microagents/repo.md` documentation file up to date
   - When creating new files, modifying project structure, or adding features:
     * Update the Project Structure section accordingly
     * Document any new patterns or conventions introduced
     * Add relevant guidelines for new components
   - Address documentation discrepancies:
     * Update documentation to reflect current project state
     * Include explanations for significant changes
     * Ensure all sections remain accurate and useful
