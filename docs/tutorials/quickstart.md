# Quick Start Tutorial

This tutorial will guide you through the basics of using CV Adapt to generate and customize CVs. By the end, you'll understand how to:

- Set up CV Adapt in your project
- Generate a basic CV
- Work with different languages
- Customize the output

## Prerequisites

- Python 3.12 or higher
- Basic understanding of Python

## Installation

1. Install CV Adapt using pip:
```bash
pip install cv-adapt
```

Or, if you prefer using `uv` (recommended):
```bash
uv pip install cv-adapt
```

## Basic Usage

### 1. Import Required Components

```python
from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.models.language import Language
from cv_adapter.models.personal_info import PersonalInfo
```

### 2. Create Personal Information

```python
personal_info = PersonalInfo(
    first_name="John",
    last_name="Doe",
    email="john.doe@example.com",
    phone="+1234567890",
    location="New York, USA"
)
```

### 3. Choose Your Application Type

CV Adapt provides both synchronous and asynchronous APIs. Choose the one that best fits your needs:

#### Synchronous API

```python
# Create a synchronous application instance
app = CVAdapterApplication()

# Or specify a different language
app = CVAdapterApplication(language=Language.FRENCH)
```

#### Asynchronous API

```python
from cv_adapter.core.async_application import AsyncCVAdapterApplication

# Create an async application instance
app = AsyncCVAdapterApplication()
```

### 4. Prepare Your Input

You'll need:

1. Your existing CV text
2. The job description you're targeting

```python
# Example CV text
cv_text = """
Professional Software Engineer with 5 years of experience...
[Your CV content here]
"""

# Example job description
job_description = """
We are looking for a Software Engineer with...
[Job description content here]
"""
```

### 5. Generate the CV

#### Using the Synchronous API

```python
# Generate a CV adapted to the job description
cv = app.generate_cv(
    cv_text=cv_text,
    job_description=job_description,
    personal_info=personal_info
)
```

#### Using the Asynchronous API

The async API offers two approaches:

1. Single-step generation (similar to sync API):
```python
# Generate a CV in one step
cv = await app.generate_cv(
    cv_text=cv_text,
    job_description=job_description,
    personal_info=personal_info
)
```

2. Two-step generation with core competences review:
```python
# First generate core competences for review
core_competences = await app.generate_core_competences(
    cv_text=cv_text,
    job_description=job_description
)

# Review and optionally modify core_competences here...

# Then generate complete CV with reviewed competences
cv = await app.generate_cv_with_competences(
    cv_text=cv_text,
    job_description=job_description,
    personal_info=personal_info,
    core_competences=core_competences
)
```

The two-step approach allows you to review and potentially modify the generated core competences before they are used to generate the rest of the CV components.

## Working with Different Languages

CV Adapt supports multiple languages out of the box:

- 🇬🇧 English (default)
- 🇫🇷 French
- 🇩🇪 German
- 🇪🇸 Spanish
- 🇮🇹 Italian

You can specify the language in two ways:

### 1. At Application Initialization

```python
# Create an application with French as the default language
app = CVAdapterApplication(language=Language.FRENCH)
```

### 2. During CV Generation

```python
# Generate a CV in German
cv = app.generate_cv(
    cv_text=cv_text,
    job_description=job_description,
    personal_info=personal_info,
    language=Language.GERMAN
)
```

## Saving and Loading CVs

CV Adapt supports saving CVs to JSON format using Pydantic's serialization:

```python
from cv_adapter.renderers import JSONRenderer

# Create a JSON renderer
renderer = JSONRenderer()

# Save CV to file with automatic type handling
renderer.render_to_file(cv.to_dto(), "my_cv.json")

# Load CV from file with automatic validation
loaded_cv_dto = renderer.load_from_file("my_cv.json")

# Convert back to CV model if needed
loaded_cv = app.mapper.to_model(loaded_cv_dto)
```

## What's Next?

Now that you've learned the basics, you can:

1. Explore the [How-to Guides](../how-to/index.md) for specific tasks:
   - [Language Support](../how-to/language-support.md) for advanced language features
   - [Custom Renderers](../how-to/custom-renderers.md) for customizing output formats

2. Check the [API Reference](../reference/index.md) for detailed documentation:
   - [Core API](../reference/api/core.md) for application configuration
   - [Models](../reference/api/models.md) for data structure details

3. Read the [Explanation](../explanation/index.md) section to understand:
   - [Architecture](../explanation/architecture.md) for system design
   - [Design Principles](../explanation/design-principles.md) for implementation details
