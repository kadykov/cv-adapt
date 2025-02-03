# Working with Language Support

CV Adapt provides comprehensive multilingual support through a clean separation of language concerns: core identity, configuration, and labels.

## Supported Languages

CV Adapt currently supports the following languages:

- 🇬🇧 English (`Language.ENGLISH`) - Default
- 🇫🇷 French (`Language.FRENCH`)
- 🇩🇪 German (`Language.GERMAN`)
- 🇪🇸 Spanish (`Language.SPANISH`)
- 🇮🇹 Italian (`Language.ITALIAN`)

## Language Components

### 1. Core Language Identity

The Language class represents just the essential identity of a language:

```python
from cv_adapter.dto.language import Language, LanguageCode

# Create a language instance
language = Language(code=LanguageCode.ENGLISH)

# Or use predefined instances
from cv_adapter.dto.language import ENGLISH, FRENCH, GERMAN

# Languages serialize to their code in JSON
print(language)  # "en"
```

### 2. Language Configuration

LanguageConfig handles language-specific formatting and display:

```python
from cv_adapter.dto.language import LanguageConfig

# Get configuration for a language
config = LanguageConfig.get(language.code)

# Access configuration properties
print(config.name)         # "English"
print(config.native_name)  # "English"
print(config.date_format)  # "%m/%d/%Y"
```

### 3. Language Labels

LanguageLabels provides localized text for CV sections:

```python
from cv_adapter.dto.language import LanguageLabels

# Get labels for a language
labels = LanguageLabels.get(language)

# Access localized section names
print(labels.experience)      # "Professional Experience"
print(labels.education)       # "Education"
print(labels.skills)         # "Skills"
print(labels.core_competences)  # "Core Competences"
```

## Common Tasks

### Setting the Default Language

Set a default language when initializing the application:

```python
from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.dto.language import FRENCH

# Create application with French as default
app = CVAdapterApplication(language=FRENCH)
```

### Language Context Usage

Use the language context manager for localized operations:

```python
from cv_adapter.models.context import LanguageContext
from cv_adapter.dto.language import GERMAN

with LanguageContext(GERMAN):
    # All operations here use German formatting and labels
    cv = generate_cv(data)
    rendered = render_cv(cv)
```

### Language Validation

Validate that text matches the expected language:

```python
from cv_adapter.models.language import validate_text_language
from cv_adapter.dto.language import FRENCH

text = "Bonjour, je suis un développeur"
is_french = validate_text_language(text, FRENCH)
```

## Best Practices

1. **Use Registry Methods**
   ```python
   # Good: Use registry methods
   language = Language.get(LanguageCode.ENGLISH)
   config = LanguageConfig.get(language.code)
   labels = LanguageLabels.get(language)

   # Avoid: Direct dictionary access
   config = language_configs[language.code]  # Not recommended
   ```

2. **Proper Language Context**
   ```python
   # Good: Use context manager
   with LanguageContext(language):
       process_cv()

   # Avoid: Manual context management
   set_language(language)  # Not recommended
   try:
       process_cv()
   finally:
       reset_language()
   ```

3. **Type Safety**
   ```python
   # Good: Use LanguageCode enum
   language = Language(code=LanguageCode.ENGLISH)

   # Avoid: Raw strings
   language = Language(code="en")  # Not recommended
   ```

## Common Issues

### Mixed Language Content

**Problem**: CV content contains text in multiple languages.

**Solution**: Validate each section independently:

```python
def validate_cv_sections(cv_text: str, language: Language) -> bool:
    sections = cv_text.split('\n\n')
    return all(
        validate_text_language(section.strip(), language)
        for section in sections
        if section.strip()
    )
```

### Format Localization

**Problem**: Dates and numbers need language-specific formatting.

**Solution**: Use LanguageConfig for formatting:

```python
def format_date(date: date, language: Language) -> str:
    config = LanguageConfig.get(language.code)
    return date.strftime(config.date_format)

def format_number(number: float, language: Language) -> str:
    config = LanguageConfig.get(language.code)
    return format_decimal(
        number,
        decimal_sep=config.decimal_separator,
        grouping_sep=config.thousands_separator
    )
```

## Related Documentation

- [Multilingual System Design](../explanation/multilingual-system.md) for architecture details
- [API Reference](../reference/api/models.md#language-models) for detailed language model documentation
- [Custom Renderers](custom-renderers.md) for creating language-aware output formats
