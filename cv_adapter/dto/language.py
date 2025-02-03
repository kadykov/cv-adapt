from enum import Enum
from typing import ClassVar, Dict, Optional

from pydantic import BaseModel, ConfigDict, field_validator


class LanguageCode(str, Enum):
    """Standardized language codes."""

    ENGLISH = "en"
    FRENCH = "fr"
    GERMAN = "de"
    SPANISH = "es"
    ITALIAN = "it"


class Language(BaseModel):
    """Core language identity."""

    model_config = ConfigDict(frozen=True)

    code: LanguageCode

    # Class-level language registry
    _registry: ClassVar[Dict[LanguageCode, "Language"]] = {}

    def __init__(self, **data: object) -> None:
        """Register the language in the class registry."""
        super().__init__(**data)
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
        return f"Language(code={self.code})"


class LanguageConfig(BaseModel):
    """Language-specific configuration and metadata."""

    model_config = ConfigDict(frozen=True)

    code: LanguageCode
    name: str
    native_name: str
    date_format: Optional[str] = None
    decimal_separator: Optional[str] = None
    thousands_separator: Optional[str] = None

    # Class-level config registry
    _registry: ClassVar[Dict[LanguageCode, "LanguageConfig"]] = {}

    def __init__(self, **data: object) -> None:
        """Register the language config in the class registry."""
        super().__init__(**data)
        self.__class__.register(self)

    @classmethod
    def register(cls, config: "LanguageConfig") -> None:
        """Register language config in the class registry."""
        cls._registry[config.code] = config

    @classmethod
    def get(cls, code: LanguageCode) -> "LanguageConfig":
        """Retrieve config for a language code."""
        config = cls._registry.get(code)
        if config is None:
            raise KeyError(f"Config for language {code} not found")
        return config

    def __str__(self) -> str:
        """Return a string representation of the language config."""
        return f"{self.name} ({self.code})"


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


# Initialize predefined languages
ENGLISH = Language(code=LanguageCode.ENGLISH)
FRENCH = Language(code=LanguageCode.FRENCH)
GERMAN = Language(code=LanguageCode.GERMAN)
SPANISH = Language(code=LanguageCode.SPANISH)
ITALIAN = Language(code=LanguageCode.ITALIAN)

# Initialize language configurations
ENGLISH_CONFIG = LanguageConfig(
    code=LanguageCode.ENGLISH,
    name="English",
    native_name="English",
    date_format="%m/%d/%Y",
    decimal_separator=".",
    thousands_separator=",",
)

FRENCH_CONFIG = LanguageConfig(
    code=LanguageCode.FRENCH,
    name="French",
    native_name="Français",
    date_format="%d/%m/%Y",
    decimal_separator=",",
    thousands_separator=" ",
)

GERMAN_CONFIG = LanguageConfig(
    code=LanguageCode.GERMAN,
    name="German",
    native_name="Deutsch",
    date_format="%d.%m.%Y",
    decimal_separator=",",
    thousands_separator=".",
)

SPANISH_CONFIG = LanguageConfig(
    code=LanguageCode.SPANISH,
    name="Spanish",
    native_name="Español",
    date_format="%d/%m/%Y",
    decimal_separator=",",
    thousands_separator=".",
)

ITALIAN_CONFIG = LanguageConfig(
    code=LanguageCode.ITALIAN,
    name="Italian",
    native_name="Italiano",
    date_format="%d/%m/%Y",
    decimal_separator=",",
    thousands_separator=".",
)

# Initialize language labels
ENGLISH_LABELS = LanguageLabels(
    language=ENGLISH,
    experience="Professional Experience",
    education="Education",
    skills="Skills",
    core_competences="Core Competences",
)

FRENCH_LABELS = LanguageLabels(
    language=FRENCH,
    experience="Expérience Professionnelle",
    education="Formation",
    skills="Compétences",
    core_competences="Compétences Clés",
)

GERMAN_LABELS = LanguageLabels(
    language=GERMAN,
    experience="Berufserfahrung",
    education="Ausbildung",
    skills="Fähigkeiten",
    core_competences="Kernkompetenzen",
)

SPANISH_LABELS = LanguageLabels(
    language=SPANISH,
    experience="Experiencia Profesional",
    education="Educación",
    skills="Habilidades",
    core_competences="Competencias Principales",
)

ITALIAN_LABELS = LanguageLabels(
    language=ITALIAN,
    experience="Esperienza Professionale",
    education="Istruzione",
    skills="Competenze",
    core_competences="Competenze Chiave",
)
