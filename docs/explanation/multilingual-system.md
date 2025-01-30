# Multilingual System Design

This document explains the design and implementation of CV Adapt's multilingual support system, which enables seamless handling of multiple languages throughout the application.

## Core Concepts

### Language Model

The foundation of multilingual support is the `Language` enumeration:

```python
from enum import Enum

class Language(str, Enum):
    ENGLISH = "en"
    FRENCH = "fr"
    GERMAN = "de"
    SPANISH = "es"
    ITALIAN = "it"

    @property
    def display_name(self) -> str:
        return {
            self.ENGLISH: "English",
            self.FRENCH: "French",
            self.GERMAN: "German",
            self.SPANISH: "Spanish",
            self.ITALIAN: "Italian"
        }[self]
```

### Language Context

Thread-safe language context management:

```python
from contextlib import contextmanager
from threading import local

class LanguageContext:
    _state = local()

    def __init__(self, language: Language):
        self.language = language
        self._previous = None

    def __enter__(self):
        self._previous = getattr(self._state, 'language', None)
        self._state.language = self.language
        return self

    def __exit__(self, *args):
        if self._previous is not None:
            self._state.language = self._previous
        else:
            delattr(self._state, 'language')
```

## Language-Aware Components

### 1. Templates

Language-specific template handling:

```python
class LanguageAwareTemplateLoader:
    def __init__(self, base_path: str):
        self.base_path = base_path

    def get_template(self, name: str, language: Language) -> Template:
        # Try language-specific template first
        lang_path = f"{self.base_path}/{language.value}/{name}"
        if os.path.exists(lang_path):
            return self._load_template(lang_path)

        # Fall back to default template
        default_path = f"{self.base_path}/default/{name}"
        return self._load_template(default_path)
```

### 2. Formatters

Language-specific formatting:

```python
class LanguageFormatter:
    DATE_FORMATS = {
        Language.ENGLISH: "%B %d, %Y",
        Language.FRENCH: "%d %B %Y",
        Language.GERMAN: "%d. %B %Y",
        Language.SPANISH: "%d de %B de %Y",
        Language.ITALIAN: "%d %B %Y"
    }

    NUMBER_FORMATS = {
        Language.ENGLISH: {"decimal": ".", "thousand": ","},
        Language.FRENCH: {"decimal": ",", "thousand": " "},
        Language.GERMAN: {"decimal": ",", "thousand": "."},
        Language.SPANISH: {"decimal": ",", "thousand": "."},
        Language.ITALIAN: {"decimal": ",", "thousand": "."}
    }
```

### 3. Validators

Language-specific validation:

```python
class LanguageValidator:
    def validate_text(self, text: str, language: Language) -> bool:
        """Validate that text matches the specified language."""
        # Implementation using language detection libraries
        pass

    def validate_date_format(self, date: str, language: Language) -> bool:
        """Validate date format for the specified language."""
        try:
            datetime.strptime(date, self.get_date_format(language))
            return True
        except ValueError:
            return False
```

## Implementation Details

### 1. Language Detection

Automatic language detection for input validation:

```python
from langdetect import detect

def detect_language(text: str) -> Language:
    """Detect the language of the input text."""
    detected = detect(text)
    try:
        return Language(detected)
    except ValueError:
        raise UnsupportedLanguageError(f"Unsupported language: {detected}")
```

### 2. Language Switching

Seamless language switching in applications:

```python
class MultilingualApplication:
    def __init__(self, default_language: Language = Language.ENGLISH):
        self.default_language = default_language

    def process(self, data: dict, language: Optional[Language] = None):
        with LanguageContext(language or self.default_language):
            return self._process_internal(data)
```

### 3. Resource Management

Language-specific resource handling:

```python
class ResourceManager:
    def __init__(self, resource_dir: Path):
        self.resource_dir = resource_dir
        self._cache = {}

    def get_resource(self, name: str, language: Language) -> Any:
        cache_key = (name, language)
        if cache_key not in self._cache:
            path = self.resource_dir / language.value / name
            self._cache[cache_key] = self._load_resource(path)
        return self._cache[cache_key]
```

## Language-Specific Features

### 1. Date Handling

```python
class DateHandler:
    def format_date(self, date: datetime, language: Language) -> str:
        """Format date according to language conventions."""
        with LanguageContext(language):
            return date.strftime(self.get_format())

    def parse_date(self, date_str: str, language: Language) -> datetime:
        """Parse date string using language-specific format."""
        with LanguageContext(language):
            return datetime.strptime(date_str, self.get_format())
```

### 2. Number Formatting

```python
class NumberFormatter:
    def format_number(self, number: float, language: Language) -> str:
        """Format number according to language conventions."""
        format_spec = self.get_format_spec(language)
        return format_spec.format(number)
```

### 3. Text Processing

```python
class TextProcessor:
    def process_text(self, text: str, language: Language) -> str:
        """Process text with language-specific rules."""
        with LanguageContext(language):
            return self.apply_language_rules(text)
```

## Best Practices

### 1. Language Fallback

Implement proper fallback mechanisms:

```python
def get_template(name: str, language: Language) -> Template:
    try:
        return load_language_template(name, language)
    except TemplateNotFound:
        try:
            return load_language_template(name, Language.ENGLISH)
        except TemplateNotFound:
            return load_default_template(name)
```

### 2. Language Validation

Validate language compatibility:

```python
def validate_language_compatibility(text: str, language: Language) -> bool:
    detected = detect_language(text)
    return detected == language
```

### 3. Error Handling

Proper error handling for language-related issues:

```python
class LanguageError(Exception):
    """Base class for language-related errors."""
    pass

class UnsupportedLanguageError(LanguageError):
    """Raised when an unsupported language is encountered."""
    pass

class LanguageValidationError(LanguageError):
    """Raised when language validation fails."""
    pass
```

## Common Patterns

### 1. Language Context Usage

```python
def generate_cv(cv_text: str, language: Language) -> str:
    with LanguageContext(language):
        # All operations here use the specified language
        validate_language(cv_text)
        template = load_template()
        return template.render(process_cv(cv_text))
```

### 2. Resource Loading

```python
def load_resources(language: Language) -> dict:
    resources = {}
    for resource in REQUIRED_RESOURCES:
        path = get_resource_path(resource, language)
        resources[resource] = load_resource(path)
    return resources
```

### 3. Language Detection

```python
def ensure_language_match(text: str, expected: Language):
    detected = detect_language(text)
    if detected != expected:
        raise LanguageValidationError(
            f"Expected {expected.value}, detected {detected.value}"
        )
```

## Related Documentation

- [Language Support Guide](../how-to/language-support.md) for practical usage
- [API Reference](../reference/api/models.md#language-models) for language model details
- [Architecture Overview](architecture.md) for system context
