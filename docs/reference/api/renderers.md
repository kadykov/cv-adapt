# Renderers Reference

This section documents CV Adapt's rendering system, including base interfaces and specific renderer implementations.

## Base Renderer

::: cv_adapter.renderers.base
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2
        members: true

## Markdown Renderer

::: cv_adapter.renderers.markdown
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2
        members: true

## JSON Renderer

The JSON renderer provides JSON serialization and deserialization of CV data using Pydantic's native capabilities:

### Features

- **Native Pydantic Integration**: Uses Pydantic's built-in JSON serialization and validation
- **UTF-8 Encoded Files**: All file operations use UTF-8 encoding
- **Automatic Type Handling**: All types (including dates and language objects) are handled by Pydantic

### Loading and Saving

```python
from cv_adapter.renderers import JSONRenderer

renderer = JSONRenderer()

# Save CV to file
renderer.render_to_file(cv_dto, "cv.json")

# Load CV from file
cv_dto = renderer.load_from_file("cv.json")

# Validation is automatic through Pydantic
```

::: cv_adapter.renderers.json_renderer
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2
        members: true

## YAML Renderer

::: cv_adapter.renderers.yaml_renderer
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2
        members: true

## Jinja2 Renderer

::: cv_adapter.renderers.jinja
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2
        members: true

## PDF Renderer

The PDF renderer uses the system-installed `typst` command-line tool to generate PDFs from CV data:

### Features

- **System Typst Integration**: Uses the system-installed `typst` command for PDF generation
- **Binary Output Support**: Can output PDF either as bytes or to a file
- **Stdin/Stdout Support**: Utilizes Typst's stdin/stdout capabilities for efficient processing

### Usage

```python
from cv_adapter.renderers import PDFRenderer

renderer = PDFRenderer()

# Save CV to PDF file
renderer.render_to_file(cv_dto, "cv.pdf")

# Get PDF as bytes
pdf_bytes = renderer.render_to_bytes(cv_dto)
```

::: cv_adapter.renderers.pdf
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2
        members: true

## Typst Renderer

The Typst renderer provides Typst markup generation for CVs:

### Features

- **Typst Markup Generation**: Creates Typst source files that can be compiled to PDFs
- **Custom Template Support**: Uses a customizable Typst template
- **UTF-8 Support**: Full Unicode support for international CVs

### Usage

```python
from cv_adapter.renderers import TypstRenderer

renderer = TypstRenderer()

# Generate Typst markup
typst_source = renderer.render(cv_dto)

# Save Typst source to file
renderer.render_to_file(cv_dto, "cv.typ")
```

::: cv_adapter.renderers.typst
    options:
        show_root_heading: true
        show_source: true
        heading_level: 2
        members: true

## Templates

CV Adapt includes built-in Jinja2 templates for rendering CVs. These templates are located in the `cv_adapter/renderers/templates/` directory:

### Base Template
- `base.j2`: The base template that defines the common structure for CV rendering

### Minimal Template
- `minimal.j2`: A minimalist CV template focusing on essential information

## Extending Renderers

To create a custom renderer:

1. Implement the base renderer interfaces defined in `cv_adapter.renderers.base`
2. Work with DTOs from `cv_adapter.dto` for data representation
3. Consider leveraging Pydantic's built-in capabilities for data handling
4. Implement proper error handling using `RendererError`

Example implementation structure:
```python
from cv_adapter.renderers.base import BaseRenderer
from cv_adapter.dto.cv import CVDTO

class CustomRenderer(BaseRenderer):
    def render(self, cv: CVDTO) -> str:
        # Implement custom rendering logic
        pass
```

For more details on creating custom renderers, see the [Custom Renderers Guide](../../how-to/custom-renderers.md).
