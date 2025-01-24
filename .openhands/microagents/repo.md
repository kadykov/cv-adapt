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
     - `personal_info.py`: Personal information models:
       * `PersonalInfo`: Model for handling personal information (full name, contacts)
     - `language.py`: Language context and validation models:
       * `LanguageValidationMixin`: Mixin for language validation in models
     - `language_context.py`: Language context management
       * `current_language`: Thread-safe context variable for language
       * `language_context()`: Context manager for setting current language
       * `get_current_language()`: Retrieve current language context
     - `language_context_models.py`: Language-aware data models
       * Language-validated models for CV components
       * Supports multilingual validation and generation
     - `validators.py`: Language validation utilities
   - `services/`: Business logic services
     - `cv_adapter.py`: CV adaptation service
     - `generators/`: Specialized generator services
       * `competence_generator.py`: Generates core competences using validated input
       * `summary_generator.py`: Generates professional CV summaries using validated input
       * `education_generator.py`: Generates education sections using validated input
       * `experience_generator.py`: Generates experience sections using validated input
       * `skills_generator.py`: Generates and organizes skills using validated input
       * `title_generator.py`: Generates professional titles using validated input
   - `dto/`: Data Transfer Objects (DTOs)
     - `cv.py`: DTO classes for decoupling data representation from rendering
       * `ContactDTO`: Represents contact information with metadata
       * `PersonalInfoDTO`: Personal information with flexible contact handling
       * `CoreCompetenceDTO`: Core competence representation
       * `ExperienceDTO`, `EducationDTO`: Experience and education representations
       * `SkillDTO`, `SkillGroupDTO`: Skill-related DTOs
       * `TitleDTO`, `SummaryDTO`: Title and summary representations
       * `CVDTO`, `MinimalCVDTO`: Top-level CV data transfer objects
     - `mapper.py`: Conversion utilities between Pydantic models and DTOs
       * Supports flexible mapping from dictionaries to DTOs
       * Decoupled from specific model implementations
       * Enables easy conversion between language context models and DTOs
       * Simplified list handling by removing wrapper classes
       * Enhanced contact metadata handling with type-safe design
       * Centralized contact type management
       * Improved type hints and validation
       * Supports dynamic URL generation for contact information
       * Flexible and extensible contact metadata configuration
   - `renderers/`: CV rendering implementations
     - `base.py`: Abstract base class for renderers
       * `ListItem`: Generic protocol for items that can be rendered as list items
       * `RenderingConfig`: Flexible configuration for rendering with customizable options
       * `BaseRenderer`: Generic base class for all renderers with configuration support
     - `yaml_renderer.py`: Renders CV to YAML format
     - `markdown.py`: Consolidated Markdown rendering module
       * `MarkdownListRenderer`: Generic renderer for Markdown bullet point lists
       * `CoreCompetencesRenderer`: Specialized renderer for core competences
       * `BaseMarkdownRenderer`: Base class for Markdown renderers with common rendering logic
       * `MarkdownRenderer`: Renders complete CV to Markdown format with configurable sections
       * `MinimalMarkdownRenderer`: Renders minimal CV for summary generation

     Rendering Features:
       * Flexible section rendering with optional configuration
       * Customizable section labels for multilingual support
       * Ability to include/exclude specific sections
       * Support for custom rendering strategies per section
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
   - Keep models focused on data representation, not presentation
   - Use protocols for type-safe interfaces between models and renderers
   - Models can implement string representation for debugging
   - Example model hierarchy:
     * Base models: Language, LanguageValidationMixin
     * Language-aware models: Language-validated CV components
     * DTOs: Decoupled data representation
   - Validation rules:
     * Use Pydantic field validators for complex validation
     * Keep validation close to the data structure
     * Validate both individual items and collections
     * Implement language-specific validation
   - Language Context Design:
     * Thread-safe language context management
     * Context manager for setting and resetting language
     * Supports multilingual validation and generation
     * Provides language-specific metadata (date formats, separators)
   - Generator Design:
     * Generators use language context for content generation
     * Each generator adapts content to language-specific conventions
     * Simplified method signatures with direct language parameter
     * Generators focus on business logic and language adaptation
     * Context preparation method for LLM interactions
   - Key Principles:
     * Language is a first-class concept in the application
     * Validation is language-aware and context-sensitive
     * Decoupled data representation with DTOs
     * Flexible and extensible language support

7. Working with Renderers and DTOs:
   - Use the rendering system in `cv_adapter/renderers/` for CV output
   - Utilize Data Transfer Objects (DTOs) in `cv_adapter/dto/` for decoupled rendering
   - Renderer and DTO Design Principles:
     * DTOs provide a clean, language-agnostic data representation
     * Renderers work with DTOs, not directly with Pydantic models
     * Mapper utility converts between Pydantic models and DTOs
     * Simplified list handling with direct list usage instead of wrapper classes
   - Renderer hierarchy:
     * BaseRenderer[DTOType]: Generic base class for all renderers
     * BaseMarkdownRenderer[DTOType]: Base class for Markdown renderers with common logic
     * MarkdownRenderer: Renders complete CV to Markdown
     * MinimalMarkdownRenderer: Renders minimal CV for summary generation
     * YAMLRenderer: For data storage and interchange
   - DTO Design:
     * Separate DTOs for different CV components (PersonalInfo, Experience, etc.)
     * Top-level DTOs (CVDTO, MinimalCVDTO) contain language context
     * ContactDTO provides flexible contact information handling
     * Direct list handling for collections (core competences, skills, etc.)
   - Renderer Conversion Strategies:
     * Recursive conversion of complex objects
     * Special handling for Language and Enum types
     * Converts objects to their string or primitive representations
     * Supports nested dictionaries and lists
     * Ensures type-safe and consistent rendering
     * Simplified list handling with direct list iteration
   - When adding new renderers:
     * Create a new file in `renderers/` or `renderers/markdown/` directory
     * For Markdown-specific renderers, use the `renderers/markdown/` directory
     * Implement appropriate base class
     * Work with DTO classes
     * Add comprehensive tests
     * Update documentation
   - Type safety:
     * Use generic types to ensure type safety
     * BaseRenderer and BaseMarkdownRenderer are generic over DTO type
     * Concrete renderers specify their DTO type
     * Use protocols for type-safe interfaces
     * Simplified type handling with direct list usage
   - Conversion between Models and DTOs:
     * Use `mapper.py` for converting Pydantic models to DTOs
     * Mapper handles type conversion and provides flexibility
     * Allows for future changes in model structure without affecting renderers
     * Simplified conversion with direct list mapping
   - Renderer Conversion Best Practices:
     * Implement recursive conversion functions
     * Handle special types like Language and Enum
     * Ensure consistent string representation
     * Maintain type information during conversion
     * Provide clear error handling and logging
     * Prefer direct list handling over wrapper classes

8. Multilingual Support:
   - Language support is implemented through the `Language` class in `cv_adapter/dto/language.py`
   - Supported languages: English, French, German, Spanish, Italian
   - Key design principles:
     * Language is a required parameter for all generator methods
     * Generators adapt content to language-specific conventions
     * Maintain consistent validation and generation logic across languages
     * Use language-specific instructions in LLM context
   - Language Design:
     * Unified language implementation across DTO and models
     * `Language` is a Pydantic model with rich metadata and advanced registry capabilities
     * Supports language code, name, native name
     * Provides language-specific formatting details:
       - Date format
       - Decimal separator
       - Thousands separator
     * Immutable and type-safe representation using Pydantic's `ConfigDict(frozen=True)`
     * Supports string conversion and class-level language registry
     * Predefined language instances (ENGLISH, FRENCH, etc.) for easy access
   - Language Handling:
     * Consistent language representation across DTOs and models
     * Language is part of DTO classes (CVDTO, MinimalCVDTO)
     * Renderers can convert language to string representation
     * Supports easy extension and customization
     * Provides class methods for language retrieval and registration
   - Language Registry Features:
     * Automatic registration of language instances using a class method
     * Ability to retrieve languages by their code
     * Supports runtime language instance management
     * Provides detailed string and repr representations
     * Uses `ClassVar` for type-safe class-level registry
   - Extending language support:
     * Add new languages to the `LanguageCode` enum
     * Create new `Language` instances with specific metadata
     * Automatically register new languages using the `register` class method
     * Update language-specific instructions in generator context methods
     * Ensure comprehensive test coverage for new languages
   - Advantages of the Pydantic Language Implementation:
     * Enhanced type safety with Pydantic validation
     * Rich metadata support
     * Easy language retrieval and management
     * Flexible and extensible design
     * Supports internationalization requirements
     * Immutable model configuration
     * Improved type checking and runtime validation
     * Unified language representation across the entire application

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
