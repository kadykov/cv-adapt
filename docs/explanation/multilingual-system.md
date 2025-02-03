# Multilingual System Design

This document explains the design and implementation of CV Adapt's multilingual support system, which enables seamless handling of multiple languages throughout the application.

## Core Concepts

### Language System

The multilingual system consists of three core components:

1. `Language` - Core identity:
```python
class Language(BaseModel):
    """Core language identity."""
    code: LanguageCode  # e.g., 'en', 'fr', 'de'
```

2. `LanguageConfig` - Language-specific metadata:
```python
class LanguageConfig(BaseModel):
    """Language-specific configuration and metadata."""
    code: LanguageCode
    name: str          # e.g., "English"
    native_name: str   # e.g., "English" (in the language itself)
    date_format: Optional[str]           # e.g., "%m/%d/%Y"
    decimal_separator: Optional[str]      # e.g., "."
    thousands_separator: Optional[str]    # e.g., ","
```

3. `LanguageLabels` - UI text and section labels:
```python
class LanguageLabels(BaseModel):
    """Language-specific labels for CV sections."""
    language: Language
    experience: str        # e.g., "Professional Experience"
    education: str        # e.g., "Education"
    skills: str           # e.g., "Skills"
    core_competences: str # e.g., "Core Competences"
```

This separation of concerns allows:
- Simplified JSON representation (Language objects are just codes)
- Clear separation between identity, metadata, and UI text
- Consistent registry pattern across all three classes
- Easy extension for new language features

### Language Context

Thread-safe language context management:

```python
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
        lang_path = f"{self.base_path}/{language.code}/{name}"
        if os.path.exists(lang_path):
            return self._load_template(lang_path)

        # Fall back to default template
        default_path = f"{self.base_path}/default/{name}"
        return self._load_template(default_path)
```

### 2. Formatters

Language-specific formatting using LanguageConfig:

```python
class LanguageFormatter:
    def format_date(self, date: datetime, language: Language) -> str:
        """Format date according to language configuration."""
        config = LanguageConfig.get(language.code)
        return date.strftime(config.date_format)

    def format_number(self, number: float, language: Language) -> str:
        """Format number according to language configuration."""
        config = LanguageConfig.get(language.code)
        return format_decimal(
            number,
            decimal_sep=config.decimal_separator,
            grouping_sep=config.thousands_separator
        )
```

### 3. Text Labeling

Using LanguageLabels for consistent UI text:

```python
class CVSectionLabels:
    def get_section_label(self, section: str, language: Language) -> str:
        """Get localized section label."""
        labels = LanguageLabels.get(language)
        return getattr(labels, section)
```

## Implementation Details

### 1. Language Detection

Automatic language detection for input validation:

```python
def detect_language(text: str) -> Language:
    """Detect the language of the input text."""
    detected = detect(text)
    try:
        code = LanguageCode(detected)
        return Language(code=code)
    except ValueError:
        raise UnsupportedLanguageError(f"Unsupported language: {detected}")
```

### 2. Error Handling

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

## Best Practices

### 1. Language Initialization

Initialize languages and their metadata properly:

```python
# Initialize core language
ENGLISH = Language(code=LanguageCode.ENGLISH)

# Initialize language configuration
ENGLISH_CONFIG = LanguageConfig(
    code=LanguageCode.ENGLISH,
    name="English",
    native_name="English",
    date_format="%m/%d/%Y",
    decimal_separator=".",
    thousands_separator=","
)

# Initialize language labels
ENGLISH_LABELS = LanguageLabels(
    language=ENGLISH,
    experience="Professional Experience",
    education="Education",
    skills="Skills",
    core_competences="Core Competences"
)
```

### 2. Accessing Language Data

Use registry patterns for accessing language-related data:

```python
def format_cv_section(section: str, language: Language) -> str:
    """Format a CV section using proper language configuration."""
    config = LanguageConfig.get(language.code)
    labels = LanguageLabels.get(language)

    return f"{getattr(labels, section)} ({config.name})"
```

## Related Documentation

- [Language Support Guide](../how-to/language-support.md) for practical usage
- [API Reference](../reference/api/models.md#language-models) for language model details
- [Architecture Overview](architecture.md) for system context
