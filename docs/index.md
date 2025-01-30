# CV Adapt

CV Adapt is a powerful Python library for adapting CVs and generating cover letters based on job descriptions. It provides a robust framework for CV generation with multilingual support and customizable rendering options.

## Key Features

- **Adaptive CV Generation**: Automatically adapt your CV based on job descriptions
- **Multilingual Support**: Generate CVs in multiple languages:
    - 🇬🇧 English
    - 🇫🇷 French
    - 🇩🇪 German
    - 🇪🇸 Spanish
    - 🇮🇹 Italian
- **Professional Summary Generation**: AI-powered generation of professional summaries
- **Flexible Rendering**: Support for multiple output formats
- **Type Safety**: Built with strong type hints and validation
- **Extensible Design**: Easy to extend with new renderers and generators

## Quick Installation

```bash
pip install cv-adapt
```

## Basic Usage

```python
from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.models.language import Language

# Initialize the application
app = CVAdapterApplication(language=Language.ENGLISH)

# Generate a CV
cv = app.generate_cv(
    cv_text=original_cv,
    job_description=job_desc,
    personal_info=personal_info
)
```

## Documentation Structure

Our documentation follows the [Diátaxis framework](https://diataxis.fr/), organized into four main sections:

### [Tutorials](tutorials/index.md)
Step-by-step guides to get you started with CV Adapt. Perfect for beginners who want to learn how to use the library.

### [How-to Guides](how-to/index.md)
Practical guides for solving specific problems. These guides help you accomplish common tasks with CV Adapt.

### [Reference](reference/index.md)
Detailed technical descriptions of CV Adapt's API, including classes, methods, and configuration options.

### [Explanation](explanation/index.md)
In-depth articles about CV Adapt's concepts, architecture, and design principles.

## Getting Started

If you're new to CV Adapt, we recommend starting with our [Quick Start Tutorial](tutorials/quickstart.md).
