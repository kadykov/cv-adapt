# CV Adapt

## Multilingual Support

CV Adapt supports generating CVs in multiple languages:

- 🇬🇧 English (default)
- 🇫🇷 French
- 🇩🇪 German
- 🇪🇸 Spanish
- 🇮🇹 Italian

### Language Selection

You can specify the language during CV generation in two ways:

1. At Application Initialization:
```python
from cv_adapter.core.application import CVAdapterApplication
from cv_adapter.models.language import Language

# Create an application with a specific default language
app = CVAdapterApplication(language=Language.FRENCH)
```

2. During CV Generation:
```python
# Override language for a specific CV generation
cv = app.generate_cv(
    cv_text=original_cv,
    job_description=job_desc,
    personal_info=personal_info,
    language=Language.GERMAN
)
```

### Language Detection

The library includes a language detection mechanism that can validate text language with high confidence.

## Features

- Adaptive CV generation
- Multilingual support
- Job description-based customization
- Professional summary generation
