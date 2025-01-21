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
       * `CVAdapterApplication`: Orchestrates CV generation workflow
       * Workflow steps:
         1. Generate components (core competences, experiences, education, skills)
         2. Create minimal CV for summary generation
         3. Generate professional summary using LLM
         4. Generate professional title using LLM
         5. Create final CV with all components
   - `models/`: Data models and schemas
     - `cv.py`: CV-related data structures:
       * `CV`: Complete CV model with all fields
       * `MinimalCV`: Minimal CV model for summary generation
       * `CoreCompetence`: Single core competence with validation
       * `CoreCompetences`: Collection of core competences
       * `Skill`: Single skill with validation
       * `Skills`: Collection of skill groups
     - `generators.py`: Input models for generator services:
       * `CompetenceGeneratorInput`: Input validation for competence generation (first step)
       * `GeneratorInputBase`: Base model for all subsequent generator inputs with common fields
       * `ExperienceGeneratorInput`: Input validation for experience generation
       * `TitleGeneratorInput`: Input validation for title generation
       * `EducationGeneratorInput`: Input validation for education generation
       * `SkillsGeneratorInput`: Input validation for skills generation
       * `SummaryGeneratorInput`: Input validation for summary generation
     - `personal_info.py`: Personal information models:
       * `PersonalInfo`: Model for handling personal information (full name, contacts)
   - `services/`: Business logic services
     - `cv_adapter.py`: CV adaptation service
     - `cv_storage.py`: CV storage management
     - `generators/`: Specialized generator services
       * `competence_generator.py`: Generates core competences using validated input
       * `summary_generator.py`: Generates professional CV summaries using validated input
       * `education_generator.py`: Generates education sections using validated input
       * `experience_generator.py`: Generates experience sections using validated input
       * `skills_generator.py`: Generates and organizes skills using validated input
       * `title_generator.py`: Generates professional titles using validated input
   - `renderers/`: CV rendering implementations
     - `base.py`: Abstract base class for renderers
     - `yaml_renderer.py`: Renders CV to YAML format
     - `markdown/`: Markdown-specific renderers
       * `base_markdown_renderer.py`: Base class for Markdown renderers with common rendering logic
       * `markdown_list_renderer.py`: Generic renderer for Markdown bullet point lists
       * `core_competences_renderer.py`: Specialized renderer for core competences
       * `markdown_renderer.py`: Renders CV to Markdown format
       * `minimal_markdown_renderer.py`: Renders MinimalCV to Markdown format
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

6. Working with Models:
   - Models are responsible for data validation and structure
   - Keep models focused on data representation, not presentation
   - Use protocols for type-safe interfaces between models and renderers
   - Models can implement string representation for debugging
   - Example model hierarchy:
     * Base models: CoreCompetence, Skill, GeneratorInputBase
     * Collection models: CoreCompetences, Skills
     * Complex models: CV, MinimalCV
     * Input models: ExperienceGeneratorInput, TitleGeneratorInput, etc.
   - Validation rules:
     * Use Pydantic field validators for complex validation
     * Keep validation close to the data structure
     * Validate both individual items and collections
     * Use base models for common validation logic
   - Generator Input Models:
     * All generator inputs inherit from GeneratorInputBase
     * Common fields: cv_text, job_description, core_competences, notes
     * CompetenceGeneratorInput has a different structure as it's the first step
     * All other generators require core_competences from the first step
     * Input validation is handled by models, not services
     * Services focus on business logic, not validation
     * Generators now use individual arguments instead of input objects
     * Each generator has a `_prepare_context` method for context generation
     * Simplified method signatures improve readability and type safety

7. Working with Renderers:
   - Use the rendering system in `cv_adapter/renderers/` for CV output
   - All renderers must implement the BaseRenderer interface
   - Renderer hierarchy:
     * BaseRenderer[CVType]: Generic base class for all renderers
     * BaseMarkdownRenderer[CVType]: Base class for Markdown renderers with common logic
     * MarkdownRenderer: Renders complete CV to Markdown
     * MinimalMarkdownRenderer: Renders minimal CV for summary generation
     * YAMLRenderer: For data storage and interchange
   - When adding new renderers:
     * Create a new file in `renderers/` or `renderers/markdown/` directory
     * For Markdown-specific renderers, use the `renderers/markdown/` directory
     * Implement appropriate base class
     * Add comprehensive tests
     * Update documentation
   - Type safety:
     * Use generic types to ensure type safety
     * BaseRenderer and BaseMarkdownRenderer are generic over CV type
     * Concrete renderers specify their CV type (CV or MinimalCV)
     * Use protocols (like MarkdownListItem) for type-safe interfaces

8. Documentation Maintenance:
   - Keep `.openhands/microagents/repo.md` documentation file up to date
   - When creating new files, modifying project structure, or adding features:
     * Update the Project Structure section accordingly
     * Document any new patterns or conventions introduced
     * Add relevant guidelines for new components
   - Address documentation discrepancies:
     * Update documentation to reflect current project state
     * Include explanations for significant changes
     * Ensure all sections remain accurate and useful
