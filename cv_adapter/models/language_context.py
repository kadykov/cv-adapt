"""Language context management for CV generation."""

from contextlib import contextmanager
from contextvars import ContextVar
from typing import Iterator, Optional

from .language import Language

# Thread-safe context variable
current_language: ContextVar[Optional[Language]] = ContextVar(
    "current_language", default=None
)


@contextmanager
def language_context(language: Language) -> Iterator[None]:
    """Context manager for setting the current language.

    Args:
        language: The language to set for the current context

    Yields:
        None

    Example:
        ```python
        with language_context(Language.FRENCH):
            # All language validation will be done against French
            cv = generate_cv(...)
        ```
    """
    token = current_language.set(language)
    try:
        yield
    finally:
        current_language.reset(token)


def get_current_language() -> Language:
    """Get the current language from context.

    Returns:
        The current language set in the context

    Raises:
        RuntimeError: If language context is not set
    """
    lang = current_language.get()
    if lang is None:
        raise RuntimeError("Language context not set. Use language_context() first.")
    return lang
