# Creating Custom Renderers

This guide explains how to create custom renderers for CV Adapt, allowing you to output CVs in any format you need.

## Understanding Renderers

CV Adapt's rendering system is based on a simple protocol that all renderers must implement. Renderers convert CV data (in the form of DTOs) into specific output formats.

## Basic Renderer Implementation

### 1. Create a New Renderer Class

Start by implementing the base renderer interface:

```python
from cv_adapter.renderers.base import BaseRenderer
from cv_adapter.dto.cv import CVDTO

class HTMLRenderer(BaseRenderer):
    def render(self, cv: CVDTO) -> str:
        """Convert CV data to HTML format."""
        return self._generate_html(cv)

    def _generate_html(self, cv: CVDTO) -> str:
        # Implementation details...
        html = f"""
        <html>
            <head>
                <title>{cv.personal_info.full_name} - CV</title>
            </head>
            <body>
                <h1>{cv.personal_info.full_name}</h1>
                {self._render_summary(cv.summary)}
                {self._render_experience(cv.experience)}
                {self._render_education(cv.education)}
                {self._render_skills(cv.skills)}
            </body>
        </html>
        """
        return html
```

### 2. Handle Language Support

Make your renderer language-aware:

```python
from cv_adapter.models.language import Language
from cv_adapter.models.context import LanguageContext

class HTMLRenderer(BaseRenderer):
    def render(self, cv: CVDTO) -> str:
        with LanguageContext(cv.language or Language.ENGLISH):
            return self._generate_html(cv)

    def _format_date(self, date: str) -> str:
        # Use language context for proper date formatting
        with LanguageContext.current() as ctx:
            return ctx.format_date(date)
```

### 3. Implement Helper Methods

Break down the rendering logic into manageable pieces:

```python
class HTMLRenderer(BaseRenderer):
    def _render_summary(self, summary: str) -> str:
        return f"<section class='summary'><p>{summary}</p></section>"

    def _render_experience(self, experiences: list) -> str:
        html = ["<section class='experience'><h2>Experience</h2>"]
        for exp in experiences:
            html.append(
                f"""
                <div class='job'>
                    <h3>{exp.title}</h3>
                    <p>{exp.company} - {self._format_date(exp.start_date)} to {self._format_date(exp.end_date)}</p>
                    <p>{exp.description}</p>
                </div>
                """
            )
        html.append("</section>")
        return "\n".join(html)

    def _render_education(self, education: list) -> str:
        # Similar to experience rendering...
        pass

    def _render_skills(self, skills: list) -> str:
        # Similar to experience rendering...
        pass
```

## Advanced Features

### 1. Serialization and Loading Support

For formats that can be loaded back (like JSON or YAML), leverage Pydantic's built-in capabilities:

```python
from pathlib import Path
from cv_adapter.renderers.base import BaseRenderer, RendererError
from cv_adapter.dto.cv import CVDTO

class SerializableRenderer(BaseRenderer[CVDTO]):
    """Example renderer with serialization support using Pydantic."""

    def render_to_string(self, cv_dto: CVDTO) -> str:
        """Convert CV to string format."""
        try:
            # Use Pydantic's built-in serialization
            return cv_dto.model_dump_json(indent=2)
        except Exception as e:
            raise RendererError(f"Failed to render CV: {e}")

    def render_to_file(self, cv_dto: CVDTO, file_path: Path) -> None:
        """Save CV to file."""
        try:
            file_path.write_text(self.render_to_string(cv_dto), encoding="utf-8")
        except Exception as e:
            raise RendererError(f"Failed to save CV: {e}")

    def load_from_string(self, content: str) -> CVDTO:
        """Load CV from string with automatic validation."""
        try:
            return CVDTO.model_validate_json(content)
        except Exception as e:
            raise RendererError(f"Failed to load CV: {e}")

    def load_from_file(self, file_path: Path) -> CVDTO:
        """Load CV from file."""
        try:
            return self.load_from_string(file_path.read_text(encoding="utf-8"))
        except Exception as e:
            raise RendererError(f"Failed to load CV file: {e}")
```

See the JSONRenderer implementation for a complete example of leveraging Pydantic's capabilities.

### 2. Template Support

Use Jinja2 templates for more maintainable rendering:

```python
from jinja2 import Environment, PackageLoader
from cv_adapter.renderers.jinja import JinjaRenderer

class TemplatedHTMLRenderer(JinjaRenderer):
    def __init__(self):
        super().__init__()
        self.env = Environment(
            loader=PackageLoader('your_package', 'templates')
        )
        self.template = self.env.get_template('cv.html.j2')

    def render(self, cv: CVDTO) -> str:
        return self.template.render(cv=cv)
```

### 3. Styling Support

Add CSS styling capabilities:

```python
class StyledHTMLRenderer(HTMLRenderer):
    def __init__(self, css_path: str = None):
        self.css_path = css_path

    def _get_styles(self) -> str:
        if not self.css_path:
            return self._get_default_styles()

        with open(self.css_path) as f:
            return f"<style>{f.read()}</style>"

    def _get_default_styles(self) -> str:
        return """
        <style>
            body { font-family: Arial, sans-serif; }
            .job { margin-bottom: 1em; }
            /* ... more styles ... */
        </style>
        """
```

### 4. Configuration Options

Make your renderer configurable:

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class HTMLRendererConfig:
    css_path: Optional[str] = None
    template_path: Optional[str] = None
    include_photo: bool = True
    compact_mode: bool = False

class ConfigurableHTMLRenderer(HTMLRenderer):
    def __init__(self, config: HTMLRendererConfig):
        self.config = config

    def render(self, cv: CVDTO) -> str:
        if self.config.compact_mode:
            return self._generate_compact_html(cv)
        return self._generate_html(cv)
```

## Using Custom Renderers

### 1. Register with Application

```python
from cv_adapter.core.application import CVAdapterApplication

app = CVAdapterApplication()
html_renderer = HTMLRenderer()
app.register_renderer('html', html_renderer)

# Use the renderer
cv_html = app.generate_cv(
    cv_text=cv_text,
    job_description=job_desc,
    personal_info=personal_info,
    renderer='html'
)
```

### 2. Direct Usage

```python
renderer = HTMLRenderer()
cv_html = renderer.render(cv_dto)
```

## Best Practices

1. **Leverage Pydantic**
   - Use Pydantic's built-in serialization when possible
   - Take advantage of automatic validation
   - Let Pydantic handle complex type conversions

2. **Separation of Concerns**
   - Keep rendering logic separate from data processing
   - Use templates for complex layouts
   - Separate styling from structure

3. **Language Support**
   - Always use the language context for formatting
   - Support right-to-left languages if needed
   - Handle language-specific content properly

4. **Error Handling**
   - Use RendererError for all errors
   - Provide meaningful error messages
   - Handle missing or optional data gracefully

5. **Performance**
   - Cache templates and styles
   - Optimize large CV rendering
   - Consider streaming for large outputs

## Common Issues and Solutions

### Issue: Special Type Handling

**Problem**: Need to handle special types that aren't directly serializable.

**Solution**: Let Pydantic handle serialization through model configuration:
```python
from pydantic import BaseModel
from datetime import date

class CustomDTO(BaseModel):
    start_date: date

    class Config:
        json_encoders = {
            date: lambda d: d.isoformat()
        }
```

### Issue: Complex Formatting

**Problem**: Need to handle complex formatting requirements.

**Solution**: Use a template engine:
```python
class ComplexHTMLRenderer(JinjaRenderer):
    def __init__(self):
        self.template = """
        {% macro render_list(items) %}
            <ul>
            {% for item in items %}
                <li>{{ item }}</li>
            {% endfor %}
            </ul>
        {% endmacro %}

        {{ render_list(cv.skills) }}
        """
```

### Issue: Large CVs

**Problem**: Memory usage with large CVs.

**Solution**: Implement streaming:
```python
class StreamingHTMLRenderer(HTMLRenderer):
    def render_stream(self, cv: CVDTO):
        yield "<html><body>"
        yield self._render_header(cv)
        yield self._render_summary(cv.summary)
        # ... yield other sections
        yield "</body></html>"
```

## Next Steps

- Explore the [API Reference](../reference/api/renderers.md) for detailed renderer documentation
- Learn about [Language Support](language-support.md) for internationalization
- Read about [Design Principles](../explanation/design-principles.md) for architectural insights
