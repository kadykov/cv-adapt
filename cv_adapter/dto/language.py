from enum import Enum
from typing import Dict, Optional, ClassVar

from pydantic import BaseModel, Field, ConfigDict


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
    _registry: ClassVar[Dict[LanguageCode, 'Language']] = {}

    def __init__(self, **data: object) -> None:
        """Register the language in the class registry.

        Args:
            **data: Keyword arguments for language initialization
        """
        super().__init__(**data)
        # Use the class method to register the language
        self.__class__.register(self)

    @classmethod
    def register(cls, language: 'Language') -> None:
        """Register a language in the class registry."""
        cls._registry[language.code] = language

    @classmethod
    def get(cls, code: LanguageCode) -> 'Language':
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


# Predefined language instances
ENGLISH = Language(
    code=LanguageCode.ENGLISH,
    name="English",
    native_name="English",
    date_format="%m/%d/%Y",
    decimal_separator=".",
    thousands_separator=","
)

FRENCH = Language(
    code=LanguageCode.FRENCH,
    name="French",
    native_name="Français",
    date_format="%d/%m/%Y",
    decimal_separator=",",
    thousands_separator=" "
)

GERMAN = Language(
    code=LanguageCode.GERMAN,
    name="German",
    native_name="Deutsch",
    date_format="%d.%m.%Y",
    decimal_separator=",",
    thousands_separator="."
)

SPANISH = Language(
    code=LanguageCode.SPANISH,
    name="Spanish",
    native_name="Español",
    date_format="%d/%m/%Y",
    decimal_separator=",",
    thousands_separator="."
)

ITALIAN = Language(
    code=LanguageCode.ITALIAN,
    name="Italian",
    native_name="Italiano",
    date_format="%d/%m/%Y",
    decimal_separator=",",
    thousands_separator="."
)
