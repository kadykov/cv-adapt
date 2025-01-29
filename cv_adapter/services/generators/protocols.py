from typing import (
    Callable,
    Generic,
    Optional,
    Protocol,
    TypeVar,
    runtime_checkable,
)

from cv_adapter.dto.language import ENGLISH, Language

T = TypeVar("T", covariant=True)
C = TypeVar("C", contravariant=True)


class BaseGenerationContext:
    """Base context for CV component generation with common fields."""

    def __init__(
        self,
        cv: str,
        job_description: str,
        language: Optional[Language] = None,
        notes: Optional[str] = None,
    ):
        """
        Initialize base generation context.

        Args:
            cv: Detailed CV content provided by the user as a Markdown string
            job_description: Target job description
            language: Language for generation
            notes: Additional generation notes
        """
        self.cv = cv
        self.job_description = job_description
        self.language = language or ENGLISH
        self.notes = notes


class CoreCompetenceGenerationContext(BaseGenerationContext):
    """Context for generating core competences."""

    pass


class ComponentGenerationContext(BaseGenerationContext):
    """Context for generating CV components that require core competences."""

    def __init__(
        self,
        cv: str,
        job_description: str,
        core_competences: str,
        language: Optional[Language] = None,
        notes: Optional[str] = None,
    ):
        """
        Initialize component generation context.

        Args:
            cv: Detailed CV content provided by the user as a Markdown string
            job_description: Target job description
            core_competences: Formatted string of core competences to use in generation
            language: Language for generation
            notes: Additional generation notes
        """
        super().__init__(cv, job_description, language, notes)
        self.core_competences = core_competences


@runtime_checkable
class GeneratorProtocol(Protocol[C, T]):
    """
    Universal generator protocol for creating outputs.

    Supports flexible context and output types.
    Can generate a single DTO, list of DTOs, or custom type.
    """

    def __call__(self, context: C) -> T:
        """
        Generate output based on the given context.

        Args:
            context: Generation context of type C

        Returns:
            Generated output of type T
        """
        ...


class Generator(Generic[C, T]):
    """
    Universal generator for creating outputs.

    Generates outputs based on a flexible generation context.
    Validation is handled by Pydantic models during generation.
    """

    def __init__(self, generation_func: Callable[[C], T]):
        """
        Initialize the generator.

        Args:
            generation_func: Core generation logic
        """
        self._generate = generation_func

    def __call__(self, context: C) -> T:
        """
        Generate output.

        Args:
            context: Generation context

        Returns:
            Generated output
        """
        return self._generate(context)


# Intentionally left empty to remove type-specific aliases
