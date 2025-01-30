from enum import Enum
from typing import ClassVar, Dict, Final, Optional

from pydantic import BaseModel, ConfigDict, field_validator


class LanguageCode(str, Enum):
    """Standardized language codes."""

    ENGLISH = "en"
    FRENCH = "fr"
    GERMAN = "de"
    SPANISH = "es"
    ITALIAN = "it"


class Language(BaseModel):
    """Representation of a language with detection and metadata capabilities."""

    model_config = ConfigDict(frozen=True)

    code: LanguageCode
    name: str
    native_name: str

    # Optional metadata for language-specific rendering
    date_format: Optional[str] = None
    decimal_separator: Optional[str] = None
    thousands_separator: Optional[str] = None

    # Class-level language registry
    _registry: ClassVar[Dict[LanguageCode, "Language"]] = {}

    def __init__(self, **data: object) -> None:
        """Register the language in the class registry.

        Args:
            **data: Keyword arguments for language initialization
        """
        super().__init__(**data)
        # Use the class method to register the language
        self.__class__.register(self)

    @classmethod
    def register(cls, language: "Language") -> None:
        """Register a language in the class registry."""
        cls._registry[language.code] = language

    @classmethod
    def get(cls, code: LanguageCode) -> "Language":
        """Retrieve a language by its code."""
        language = cls._registry.get(code)
        if language is None:
            raise KeyError(f"Language with code {code} not found")
        return language

    def __str__(self) -> str:
        """Return the language code."""
        return self.code.value

    def __repr__(self) -> str:
        """Return a detailed representation of the language."""
        return f"Language(code={self.code}, name='{self.name}')"


class LanguageLabels(BaseModel):
    """Language-specific labels for CV sections."""

    model_config = ConfigDict(frozen=True)

    language: Language
    experience: str
    education: str
    skills: str
    core_competences: str

    # Class-level registry
    _registry: ClassVar[Dict[LanguageCode, "LanguageLabels"]] = {}

    def __init__(self, **data: object) -> None:
        """Register the language labels in the class registry."""
        super().__init__(**data)
        self.__class__.register(self)

    @classmethod
    def register(cls, labels: "LanguageLabels") -> None:
        """Register language labels in the class registry."""
        cls._registry[labels.language.code] = labels

    @classmethod
    def get(cls, language: Language) -> "LanguageLabels":
        """Retrieve labels for a language."""
        labels = cls._registry.get(language.code)
        if labels is None:
            raise KeyError(f"Labels for language {language.code} not found")
        return labels

    @field_validator("language")
    @classmethod
    def validate_language(cls, language: Language) -> Language:
        """Ensure the language exists in the Language registry."""
        if language.code not in Language._registry:
            raise ValueError(f"Language {language.code} not registered")
        return language


# Predefined language labels
DEFAULT_LABELS: Final[Dict[LanguageCode, Dict[str, str]]] = {
    LanguageCode.ENGLISH: {
        "experience": "Professional Experience",
        "education": "Education",
        "skills": "Skills",
        "core_competences": "Core Competences",
    },
    LanguageCode.FRENCH: {
        "experience": "Expérience Professionnelle",
        "education": "Formation",
        "skills": "Compétences",
        "core_competences": "Compétences Clés",
    },
    LanguageCode.GERMAN: {
        "experience": "Berufserfahrung",
        "education": "Ausbildung",
        "skills": "Fähigkeiten",
        "core_competences": "Kernkompetenzen",
    },
    LanguageCode.SPANISH: {
        "experience": "Experiencia Profesional",
        "education": "Educación",
        "skills": "Habilidades",
        "core_competences": "Competencias Principales",
    },
    LanguageCode.ITALIAN: {
        "experience": "Esperienza Professionale",
        "education": "Istruzione",
        "skills": "Competenze",
        "core_competences": "Competenze Chiave",
    },
}


# Initialize predefined language instances
ENGLISH = Language(
    code=LanguageCode.ENGLISH,
    name="English",
    native_name="English",
    date_format="%m/%d/%Y",
    decimal_separator=".",
    thousands_separator=",",
)

FRENCH = Language(
    code=LanguageCode.FRENCH,
    name="French",
    native_name="Français",
    date_format="%d/%m/%Y",
    decimal_separator=",",
    thousands_separator=" ",
)

GERMAN = Language(
    code=LanguageCode.GERMAN,
    name="German",
    native_name="Deutsch",
    date_format="%d.%m.%Y",
    decimal_separator=",",
    thousands_separator=".",
)

SPANISH = Language(
    code=LanguageCode.SPANISH,
    name="Spanish",
    native_name="Español",
    date_format="%d/%m/%Y",
    decimal_separator=",",
    thousands_separator=".",
)

ITALIAN = Language(
    code=LanguageCode.ITALIAN,
    name="Italian",
    native_name="Italiano",
    date_format="%d/%m/%Y",
    decimal_separator=",",
    thousands_separator=".",
)

# Initialize predefined language labels
for lang_code, labels in DEFAULT_LABELS.items():
    LanguageLabels(language=Language.get(lang_code), **labels)
