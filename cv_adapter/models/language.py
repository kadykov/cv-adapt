from enum import Enum
from typing import Optional

from langdetect import detect as _detect
from pydantic import BaseModel, ValidationInfo, field_validator


class Language(str, Enum):
    """Supported languages for CV generation."""

    ENGLISH = "en"
    FRENCH = "fr"
    GERMAN = "de"
    SPANISH = "es"
    ITALIAN = "it"


class LanguageValidationMixin(BaseModel):
    """Mixin for adding language validation to Pydantic models."""

    language: Language
    text: str

    @field_validator("text")
    def validate_text_language(cls, v: str, info: ValidationInfo) -> str:
        """Validate that the text is in the specified language."""
        v = v.strip()
        if not v:
            return v

        language = info.data.get("language")
        if not language:
            return v

        detected = detect_language(v)
        if detected is None:
            # If we can't detect the language confidently, let it pass
            return v

        if detected != language:
            raise ValueError(
                f"Text language mismatch. Expected {language}, detected {detected}"
            )
        return v


def detect_language(text: str) -> Optional[Language]:
    """Detect language of the given text and return corresponding Language enum value.

    Returns None if:
    - Text is empty or whitespace
    - Text is too short (less than 10 characters)
    - Text is a technical term (e.g., programming languages, tools)
    - Language detection confidence is below 0.9
    - Detected language is not supported
    - Detection fails
    """
    if not text or not text.strip():
        return None

    # Skip language detection for very short texts
    if len(text.strip()) < 10:
        return None

    # Skip language detection for technical terms
    technical_terms = {
        # Programming languages
        "Python", "Java", "JavaScript", "TypeScript", "Go", "Ruby", "PHP", "C++", "C#",
        "Swift", "Kotlin", "Rust", "Scala", "Haskell", "Perl", "R",
        # Tools and frameworks
        "Docker", "Kubernetes", "Git", "Jenkins", "Ansible", "Terraform", "AWS", "Azure",
        "GCP", "TensorFlow", "PyTorch", "Pandas", "NumPy", "SciPy", "Matplotlib",
        "Jupyter", "VSCode", "IntelliJ", "Eclipse", "Xcode",
        # Job titles
        "Data Scientist", "Software Engineer", "DevOps Engineer", "SRE", "CTO", "CEO",
        "CIO", "CFO", "COO", "VP", "Director", "Manager", "Lead", "Senior", "Junior",
        "Full Stack", "Backend", "Frontend", "Mobile", "Cloud", "AI", "ML", "QA",
        # Common abbreviations
        "AI", "ML", "DL", "NLP", "CV", "CI", "CD", "API", "REST", "GraphQL", "SQL",
        "NoSQL", "UI", "UX", "DevOps", "SRE", "SLA", "KPI", "ROI", "P&L",
    }
    if text.strip() in technical_terms:
        return None

    # Replace newlines with spaces to handle multi-line text
    text_single_line = text.replace("\n", " ").strip()

    try:
        lang_code = _detect(text_single_line)
        try:
            return Language(lang_code)
        except ValueError:
            return None
    except Exception:
        return None
