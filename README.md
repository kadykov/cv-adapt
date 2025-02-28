# CV Adapt

CV Adapt is a powerful Python library for adapting CVs and generating cover letters based on job descriptions. It provides a robust framework for CV generation with multilingual support and customizable rendering options.

## Features

Core Features:
- **Adaptive CV Generation**: Automatically adapt your CV based on job descriptions
- **Multilingual Support**: Generate CVs in multiple languages:
    - 🇬🇧 English (default)
    - 🇫🇷 French
    - 🇩🇪 German
    - 🇪🇸 Spanish
    - 🇮🇹 Italian
- **Professional Summary Generation**: AI-powered generation of professional summaries
- **Flexible Rendering**: Support for multiple output formats
- **Type Safety**: Built with strong type hints and validation
- **Extensible Design**: Easy to extend with new renderers and generators

Web Interface:
- **Modern React Frontend**: TypeScript-based web interface for CV management
- **Job Description Catalog**: Manage and filter job descriptions by language
- **Authentication System**: Secure user authentication and authorization
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## Quick Installation

```bash
pip install cv-adapt
```

## Basic Usage

```python
from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.models.language import Language
from cv_adapter.models.personal_info import PersonalInfo

# Initialize the application
app = CVAdapterApplication()

# Generate a CV
cv = app.generate_cv(
    cv_text=original_cv,
    job_description=job_desc,
    personal_info=personal_info
)
```

## Documentation

Our documentation follows the [Diátaxis framework](https://diataxis.fr/), organized into four main sections:

### Core Library Documentation

#### [Tutorials](docs/tutorials/index.md)
Step-by-step guides to get you started with CV Adapt. Perfect for beginners who want to learn how to use the library.

#### [How-to Guides](docs/how-to/index.md)
Practical guides for solving specific problems. These guides help you accomplish common tasks with CV Adapt.

#### [Reference](docs/reference/index.md)
Detailed technical descriptions of CV Adapt's API, including classes, methods, and configuration options.

#### [Explanation](docs/explanation/index.md)
In-depth articles about CV Adapt's concepts, architecture, and design principles.

### Frontend Documentation

#### [Frontend Architecture](docs/explanation/frontend-architecture.md)
Detailed overview of the web interface architecture, including state management, routing, and API integration.

#### [Frontend Testing](docs/how-to/frontend-testing.md)
Complete guide to the three-tier testing strategy (contract, integration, unit) including workspace configuration, MSW handlers, and test organization.

#### [Job Catalog Implementation](docs/how-to/implement-job-catalog.md)
Detailed guide on implementing and extending the job description catalog feature.

To view the full documentation locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/openhands/cv-adapt.git
   cd cv-adapt
   ```

2. Install development dependencies:
   ```bash
   pip install -e ".[dev]"
   ```

3. Start the documentation server:
   ```bash
   mkdocs serve
   ```

4. Open http://127.0.0.1:8000 in your browser

## Development

### Prerequisites
- Python 3.12+
- `uv` package manager (recommended over pip)

### Setup
```bash
# Install dependencies
just install

# Activate virtual environment
source .venv/bin/activate
```

### Frontend Testing & Type Generation

The frontend follows a comprehensive testing approach:

1. **Contract Testing & Type Generation**
   ```bash
   # Generate OpenAPI schema from backend
   just export-openapi

   # Generate types and handlers
   just generate-types
   ```
   This ensures:
   - Type safety between backend and frontend
   - OpenAPI schema validation
   - Auto-generated test handlers
   - Type-safe mock data
   - API path consistency

2. **Integration Testing**
   ```bash
   just test-frontend-integration
   ```
   - Complete user flows
   - Feature interactions
   - State management verification

3. **Unit Testing**
   ```bash
   just test-frontend
   ```
   - Component behavior
   - Isolated functionality
   - Performance checks

### Quality Checks
```bash
# Run all checks (formatting, linting, type checking, tests)
just all

# Individual commands
just format  # Code formatting
just lint    # Code style and type checks
just test    # Run tests
```

## License

This project is licensed under the terms of the LICENSE file included in the repository.
