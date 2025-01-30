# Working with Language Support

This guide explains how to effectively use CV Adapt's multilingual features in your applications.

## Supported Languages

CV Adapt currently supports the following languages:

- 🇬🇧 English (`Language.ENGLISH`) - Default
- 🇫🇷 French (`Language.FRENCH`)
- 🇩🇪 German (`Language.GERMAN`)
- 🇪🇸 Spanish (`Language.SPANISH`)
- 🇮🇹 Italian (`Language.ITALIAN`)

## Setting the Language

### 1. Application-wide Default

Set a default language for all operations when initializing the application:

```python
from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.models.language import Language

# Create application with French as default
app = CVAdapterApplication(language=Language.FRENCH)
```

### 2. Per-Operation Override

Override the language for specific CV generation:

```python
# Generate a CV in German
cv = app.generate_cv(
    cv_text=cv_text,
    job_description=job_desc,
    personal_info=personal_info,
    language=Language.GERMAN
)
```

## Language Detection

CV Adapt includes built-in language detection to validate input text:

```python
from cv_adapter.models.language import validate_text_language

# Validate text language
is_valid = validate_text_language(text, Language.FRENCH)
```

## Language-Specific Formatting

### Date Formatting

Each language has its own date formatting conventions:

```python
from cv_adapter.models.language import Language
from cv_adapter.models.context import LanguageContext

with LanguageContext(Language.FRENCH):
    # Dates will be formatted according to French conventions
    cv = app.generate_cv(...)
```

### Number Formatting

Numbers are automatically formatted according to the language's conventions:

- English: 1,234.56
- French: 1 234,56
- German: 1.234,56

## Working with Templates

### Language-Specific Templates

Create language-specific templates by using the language context:

```python
from cv_adapter.renderers.jinja import JinjaRenderer
from cv_adapter.models.context import LanguageContext

renderer = JinjaRenderer()

with LanguageContext(Language.GERMAN):
    # Templates will use German-specific formatting
    result = renderer.render(cv_data)
```

### Custom Template Logic

Add language-specific logic in templates:

```jinja
{% if language == Language.FRENCH %}
    {{ format_date(date, 'fr') }}
{% else %}
    {{ format_date(date, 'en') }}
{% endif %}
```

## Best Practices

1. **Set Default Language Early**
   ```python
   app = CVAdapterApplication(language=Language.ENGLISH)
   ```

2. **Use Language Context Manager**
   ```python
   with LanguageContext(Language.FRENCH):
       # All operations here use French
       cv = app.generate_cv(...)
   ```

3. **Validate Input Text**
   ```python
   if not validate_text_language(cv_text, language):
       raise ValueError("CV text language doesn't match specified language")
   ```

4. **Handle Language-Specific Content**
   ```python
   def get_greeting(language: Language) -> str:
       greetings = {
           Language.ENGLISH: "Dear",
           Language.FRENCH: "Cher",
           Language.GERMAN: "Sehr geehrte",
           Language.SPANISH: "Estimado",
           Language.ITALIAN: "Gentile"
       }
       return greetings.get(language, "Dear")
   ```

## Common Issues and Solutions

### Issue: Mixed Language Content

**Problem**: CV content contains text in multiple languages.

**Solution**:
```python
def validate_cv_content(cv_text: str, language: Language) -> bool:
    # Split text into sections and validate each
    sections = cv_text.split('\n\n')
    return all(validate_text_language(section, language)
              for section in sections if section.strip())
```

### Issue: Missing Language-Specific Templates

**Problem**: Template not found for specific language.

**Solution**:
```python
def get_template_path(language: Language) -> str:
    base_path = "templates/cv"
    lang_specific = f"{base_path}_{language.value}.j2"
    default = f"{base_path}_default.j2"

    return lang_specific if os.path.exists(lang_specific) else default
```

## Next Steps

- Learn about [Custom Renderers](custom-renderers.md) to create language-aware output formats
- Explore the [API Reference](../reference/api/models.md#language-models) for detailed language model documentation
- Read about [Multilingual System Design](../explanation/multilingual-system.md) to understand the architecture
