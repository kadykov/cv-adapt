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
   - `models/`: Core data models and schemas
     - `personal_info.py`: Personal information models
       * `PersonalInfo`: Model for handling personal information
     - `language.py`: Language support and validation
       * Defines language-related constants and validation
     - `language_context.py`: Language context management
       * Provides thread-safe language context handling
     - `language_context_models.py`: Language-aware data models
       * Supports multilingual validation and generation
     - `validators.py`: Custom validation utilities
     - `summary.py`: Summary-related models
     - `constants.py`: Project-wide constants
   - `services/`: Business logic services
     - `generators/`: Specialized generator services
       * `protocols.py`: Generator protocols and base classes
         - Defines flexible, type-safe generator interfaces
         - Supports protocol-based design
         - Enables precise type checking for generators
       * `utils.py`: Shared utility functions for generators
         - Provides common template loading and context preparation
         - Supports consistent generation across different generators
       * `competence_generator.py`: Generates core competences
       * `summary_generator.py`: Generates professional CV summaries
       * `education_generator.py`: Generates education sections
       * `experience_generator.py`: Generates experience sections
       * `skills_generator.py`: Generates and organizes skills
       * `title_generator.py`: Generates professional titles
       * `templates/`: Jinja2 templates for generators
         - Supports dynamic prompt and context generation
         - Enables language-specific template customization
         - Provides clear separation between generation logic and templates

     Generator Design Principles:
       * Protocol-based design with type-safe generation
       * Flexible generation context
       * Support for language-specific generation
       * Consistent template-based generation approach
       * Decoupled generation logic and template rendering
       * Supports single DTO or list of DTOs generation
       * Immediate validation and error handling
   - `dto/`: Data Transfer Objects (DTOs)
     - `cv.py`: DTO classes for decoupled data representation
       * Provides data transfer objects for CV components
     - `language.py`: Language-related DTOs and utilities
     - `mapper.py`: Conversion utilities between models and DTOs
       * Supports flexible mapping and conversion
       * Decoupled from specific model implementations
   - `renderers/`: CV rendering implementations
     - `base.py`: Base rendering interfaces and protocols
     - `markdown.py`: Consolidated Markdown rendering module
       * Provides rendering logic for Markdown formats
     - `yaml_renderer.py`: Renders CV to YAML format
     Rendering Features:
       * Flexible section rendering
       * Multilingual support
       * Configurable output formats
   - `py.typed`: Marker file for type checking

2. Tests (`tests/`):
   - Comprehensive test suite using pytest framework with coverage reporting
   - Test Structure Mirrors Source Code Structure:
     * Tests are organized to match the `cv_adapter/` directory structure
     * Each module or package in `cv_adapter/` has a corresponding test module or package in `tests/`
     * Test files follow the naming convention: `test_<module_name>.py`

   Test Directory Guidelines:
   1. Naming Conventions:
      * Test files must start with `test_`
      * Test functions must start with `test_`
      * Use descriptive names that explain the test's purpose
      * Example: `test_core_competence_validation()` in `tests/models/test_cv.py`

   2. Test File Creation Guidelines:
      * Create test files in the same relative path as the source module
      * Determine test file location by mirroring the source module's path
      * Mapping Examples:
        - `cv_adapter/models/cv.py` → `tests/models/test_cv.py`
        - `cv_adapter/services/cv_storage.py` → `tests/services/test_cv_storage.py`
        - `cv_adapter/services/generators/competence_generator.py` → `tests/services/generators/test_competence_generator.py`
        - `cv_adapter/renderers/markdown.py` → `tests/renderers/test_markdown.py`
      * Use `__init__.py` files to ensure proper import and package structure

   3. Test Content Best Practices:
      * Cover different scenarios: valid inputs, edge cases, error conditions
      * Use pytest fixtures for common test data and setup
      * Validate model validation, method behaviors, and error handling
      * Ensure type safety and comprehensive coverage
      * Use meaningful assertions that clearly describe expected behavior

   5. Specialized Test Types:
      * Model Validation Tests: Verify model constraints and validation rules
      * Renderer Tests: Check output formats and rendering logic
      * Service Tests: Validate business logic and generator behaviors
      * Language Consistency Tests: Ensure multilingual support works correctly

   6. Running Tests:
      * Use `just test` to run all tests
      * Use `just test <path>` to run tests for a specific module
      * Use `just test-cov` for coverage report
      * Aim for high test coverage across all modules

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
   - Individual commands are flexible and support targeted operations:
     * `just lint`: Code style and type checks (runs formatting first)
       - Can be used with optional path argument, e.g., `just lint` or `just lint cv_adapter`
     * `just format`: Code formatting
       - Can be used with optional path argument, e.g., `just format` or `just format cv_adapter`
     * `just test`: Run tests
       - Can be used with optional path argument, e.g., `just test` or `just test tests/test_cv_models.py`
     * `just test-cov`: Run tests with coverage report
     * `just pre-commit`: Run pre-commit hooks
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
   - Focus on data representation with minimal presentation logic
   - Use type hints and Pydantic for robust validation
   - Key Model Design Principles:
     * Separate concerns between data models and DTOs
     * Leverage Pydantic for type validation and serialization
     * Support multilingual context
     * Minimize complex logic in models
   - Model Validation Strategies:
     * Use Pydantic field validators for complex validation
     * Keep validation close to the data structure
     * Validate both individual items and collections
     * Support language-specific validation
   - Language Context:
     * Provides thread-safe language management
     * Supports multilingual validation and generation
     * Allows language-specific metadata configuration
   - Generator Design:
     * Generators use template-based generation framework
     * Implements strict "fail-fast" design principles
     * Decouples generation logic from prompt templates
     * Enables dynamic context and prompt generation
     * Adapt content to language-specific conventions
     * Use direct language parameter in method signatures
     * Prepare context for LLM interactions with immediate validation
   - Key Principles:
     * Language is a first-class concept
     * Validation is context-aware and immediate
     * Decoupled data representation
     * Flexible and extensible design
     * Template-driven generation
     * Strict error handling with immediate failure
     * Supports language-specific template customization
   - Template Generation Features:
     * Jinja2-based template system
     * Dynamic prompt and context generation
     * Language-aware template rendering
     * Supports optional context parameters
     * Provides clear separation of concerns
     * Enables easy template modification without code changes
     * Immediate validation of template paths and rendering
     * Raises specific exceptions for configuration and rendering errors
     * Prevents silent failures or unexpected behavior
     * Conditional language-specific template rendering
     * Supports dynamic content injection based on language context
     * Flexible template inheritance and customization
     * Handles language-specific requirements within templates
     * Decouples language-specific logic from generation code

7. Working with Renderers and DTOs:
   - Rendering System Overview:
     * Use `cv_adapter/renderers/` for CV output
     * Utilize DTOs for decoupled rendering
   - Renderer and DTO Design Principles:
     * DTOs provide clean, language-agnostic data representation
     * Renderers work with DTOs, not directly with Pydantic models
     * Mapper utility converts between models and DTOs
     * Simplified list handling
   - Renderer Hierarchy:
     * `base.py`: Defines base rendering interfaces
     * `markdown.py`: Consolidated Markdown rendering
     * `yaml_renderer.py`: YAML output rendering
   - DTO Design:
     * Separate DTOs for different CV components
     * Provide flexible data representation
     * Support language context
     * Direct list handling for collections
   - Renderer Conversion Strategies:
     * Recursive conversion of complex objects
     * Handle special types (Language, Enum)
     * Convert objects to primitive representations
     * Ensure type-safe and consistent rendering
   - Adding New Renderers:
     * Create file in `renderers/` directory
     * Implement base rendering interfaces
     * Work with DTO classes
     * Add comprehensive tests
     * Update documentation
   - Type Safety and Conversion:
     * Use type hints and protocols
     * Mapper handles type conversion
     * Allows future model structure changes
     * Simplified conversion with direct mapping
   - Conversion Best Practices:
     * Implement recursive conversion functions
     * Handle special type conversions
     * Ensure consistent string representation
     * Provide clear error handling
     * Prefer direct list handling

8. Multilingual Support:
   - Language Support Overview:
     * Implemented in `cv_adapter/models/language.py` and `cv_adapter/dto/language.py`
     * Supports multiple languages with context-aware generation
   - Supported Languages:
     * English
     * French
     * German
     * Spanish
     * Italian
   - Key Design Principles:
     * Language is a required parameter for generators
     * Adapt content to language-specific conventions
     * Maintain consistent validation across languages
     * Use language-specific instructions in LLM context
   - Language Implementation:
     * Unified approach across models and DTOs
     * Provides language code, name, and metadata
     * Supports language-specific formatting:
       - Date formats
       - Decimal and thousands separators
     * Immutable and type-safe representation
   - Language Handling Features:
     * Consistent representation in DTOs and models
     * Easy extension and customization
     * Context-aware language management
   - Extending Language Support:
     * Add new languages to language-related enums
     * Create language-specific metadata
     * Update generator context methods
     * Ensure comprehensive test coverage
   - Advantages:
     * Enhanced type safety
     * Flexible language context management
     * Supports multilingual content generation
     * Easy language retrieval and management
     * Flexible and extensible design
     * Supports internationalization requirements

9. Documentation Maintenance:
   - Keep `.openhands/microagents/repo.md` documentation file up to date
   - When creating new files, modifying project structure, or adding features:
     * Update the Project Structure section accordingly
     * Document any new patterns or conventions introduced
     * Add relevant guidelines for new components
   - Address documentation discrepancies:
     * Update documentation to reflect current project state
     * Include explanations for significant changes
     * Ensure all sections remain accurate and useful
