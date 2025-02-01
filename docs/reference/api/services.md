# Services Reference

This section documents CV Adapt's services, including asynchronous component generators and utility functions.

## Generator Protocols

All component generators in CV Adapt are asynchronous, implementing the AsyncGenerator protocol. This enables efficient concurrent generation of CV components while maintaining control over the generation process.

::: cv_adapter.services.generators.protocols
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2
        members: true

## Component Generators

All generators are asynchronous and can be created using their respective factory functions (e.g., `create_title_generator()`).

### Title Generator (Async)
::: cv_adapter.services.generators.title_generator
    options:
        show_root_heading: true
        show_source: true
        heading_level: 3

### Summary Generator (Async)
::: cv_adapter.services.generators.summary_generator
    options:
        show_root_heading: true
        show_source: true
        heading_level: 3

### Experience Generator (Async)
::: cv_adapter.services.generators.experience_generator
    options:
        show_root_heading: true
        show_source: true
        heading_level: 3

### Education Generator (Async)
::: cv_adapter.services.generators.education_generator
    options:
        show_root_heading: true
        show_source: true
        heading_level: 3

### Skills Generator (Async)
::: cv_adapter.services.generators.skills_generator
    options:
        show_root_heading: true
        show_source: true
        heading_level: 3

### Competence Generator (Async)
::: cv_adapter.services.generators.competence_generator
    options:
        show_root_heading: true
        show_source: true
        heading_level: 3

## Utility Functions

::: cv_adapter.services.generators.utils
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2
        members: true

## Generator Templates

CV Adapt uses Jinja2 templates for generating prompts and contexts. These templates are located in the `cv_adapter/services/generators/templates/` directory:

- `competence_context.j2`: Template for competence generation context
- `competence_system_prompt.j2`: System prompt for competence generation
- `default_context.j2`: Default context template
- `education_context.j2`: Template for education generation context
- `education_system_prompt.j2`: System prompt for education generation
- `experience_context.j2`: Template for experience generation context
- `experience_system_prompt.j2`: System prompt for experience generation
- `skills_context.j2`: Template for skills generation context
- `skills_system_prompt.j2`: System prompt for skills generation
- `summary_context.j2`: Template for summary generation context
- `summary_system_prompt.j2`: System prompt for summary generation
- `title_context.j2`: Template for title generation context
- `title_system_prompt.j2`: System prompt for title generation

Each template is designed to provide consistent and language-aware generation of CV components.
