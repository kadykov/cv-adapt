# Design Principles

This document outlines the core design principles and patterns that guide CV Adapt's implementation. Understanding these principles helps developers work with and extend the library effectively.

## Core Principles

### 1. Type Safety First

CV Adapt prioritizes type safety throughout the codebase:

- Extensive use of type hints
- Protocol-based interfaces
- Runtime type validation with Pydantic
- Generic type parameters
- Strict mypy configuration

Example of type-safe design:
```python
from typing import Protocol, TypeVar, Generic

T = TypeVar('T')

class Generator(Protocol, Generic[T]):
    def generate(self, context: dict) -> T:
        """Generate content with type safety."""
        ...

class TitleGenerator(Generator[str]):
    def generate(self, context: dict) -> str:
        # Implementation with guaranteed string return type
        ...
```

### 2. Fail Fast, Fail Early

CV Adapt implements strict validation and error checking:

- Input validation at system boundaries
- Immediate error reporting
- No silent failures
- Clear error messages
- Strong preconditions

Example of validation implementation:
```python
from pydantic import BaseModel, Field

class PersonalInfo(BaseModel):
    first_name: str = Field(..., min_length=1)
    last_name: str = Field(..., min_length=1)
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"
```

### 3. Separation of Concerns

Clear separation between different aspects of the system:

- Models for data structure
- Services for business logic
- Renderers for output generation
- DTOs for data transfer

Example of separation:
```python
# Data model
class Experience(BaseModel):
    title: str
    company: str
    description: str

# DTO for transfer
@dataclass
class ExperienceDTO:
    title: str
    company: str
    description: str

# Service for business logic
class ExperienceGenerator:
    def generate(self, context: dict) -> Experience:
        # Business logic here
        ...

# Renderer for output
class ExperienceRenderer:
    def render(self, experience: ExperienceDTO) -> str:
        # Rendering logic here
        ...
```

### 4. Template-Based Generation

Flexible and maintainable content generation:

- Separate templates from code
- Language-specific templates
- Reusable template components
- Clear template hierarchy

Example template structure:
```
templates/
├── base.j2                    # Base template
├── components/
│   ├── header.j2             # Reusable header
│   └── footer.j2             # Reusable footer
└── languages/
    ├── en/                   # English templates
    │   └── summary.j2
    └── fr/                   # French templates
        └── summary.j2
```

### 5. Immutable State

Preference for immutable state and pure functions:

- Immutable data models
- Pure generator functions
- Context managers for state
- Thread-safe design

Example of immutable design:
```python
from dataclasses import dataclass
from typing import Final

@dataclass(frozen=True)
class Language:
    code: Final[str]
    name: Final[str]

    def __post_init__(self):
        if not self.code or not self.name:
            raise ValueError("Language code and name are required")
```

### 6. Protocol-Based Design

Flexible and extensible interfaces:

- Clear contracts
- Easy testing
- Plugin architecture
- Loose coupling

Example protocol usage:
```python
from typing import Protocol

class RendererProtocol(Protocol):
    def render(self, data: Any) -> str:
        ...

def process_with_renderer(renderer: RendererProtocol, data: Any) -> str:
    return renderer.render(data)
```

## Implementation Guidelines

### 1. Error Handling

Comprehensive error handling strategy:

```python
class CVAdaptError(Exception):
    """Base exception for CV Adapt."""
    pass

class ValidationError(CVAdaptError):
    """Raised for validation failures."""
    pass

class GenerationError(CVAdaptError):
    """Raised for generation failures."""
    pass

class RenderingError(CVAdaptError):
    """Raised for rendering failures."""
    pass
```

### 2. Configuration Management

Flexible configuration with validation:

```python
class Config(BaseModel):
    language: Language
    template_dir: Path
    enable_cache: bool = True

    @validator('template_dir')
    def validate_template_dir(cls, v: Path) -> Path:
        if not v.exists():
            raise ValueError(f"Template directory {v} does not exist")
        return v
```

### 3. Resource Management

Proper resource handling:

```python
class TemplateManager:
    def __init__(self, template_dir: Path):
        self.template_dir = template_dir
        self._cache = {}

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._cache.clear()
```

### 4. Testing Strategy

Comprehensive testing approach:

```python
class TestGenerator:
    def test_generation_with_valid_input(self):
        generator = Generator()
        result = generator.generate(valid_context)
        assert result.is_valid()

    def test_generation_with_invalid_input(self):
        generator = Generator()
        with pytest.raises(ValidationError):
            generator.generate(invalid_context)
```

## Best Practices

1. **Code Organization**
   - Clear module structure
   - Logical file naming
   - Consistent import ordering
   - Related functionality grouping

2. **Documentation**
   - Comprehensive docstrings
   - Clear examples
   - Type hints
   - Usage notes

3. **Testing**
   - Unit tests for all components
   - Integration tests for workflows
   - Property-based testing
   - Performance testing

4. **Performance**
   - Efficient algorithms
   - Resource pooling
   - Caching strategies
   - Memory management

## Anti-patterns to Avoid

1. **Global State**
   ```python
   # Bad
   global_config = {}

   # Good
   class Config:
       def __init__(self, settings: dict):
           self._settings = settings.copy()
   ```

2. **Silent Failures**
   ```python
   # Bad
   def process(data):
       try:
           return do_something(data)
       except Exception:
           return None

   # Good
   def process(data):
       try:
           return do_something(data)
       except ValueError as e:
           raise ProcessingError(f"Failed to process data: {e}")
   ```

3. **Type Ignoring**
   ```python
   # Bad
   def process(data: Any) -> Any:
       return data

   # Good
   T = TypeVar('T')
   def process(data: T) -> T:
       return data
   ```

## Related Documentation

- [Architecture Overview](architecture.md) for system structure
- [Multilingual System](multilingual-system.md) for language handling
- [API Reference](../reference/index.md) for interface details
