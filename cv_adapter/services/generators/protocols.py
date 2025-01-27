from typing import (
    Callable,
    Generic,
    Optional,
    Protocol,
    TypeVar,
    runtime_checkable,
)

from cv_adapter.dto.cv import CoreCompetenceDTO, ExperienceDTO, SkillGroupDTO
from cv_adapter.dto.language import ENGLISH, Language

T = TypeVar("T", covariant=True)


class GenerationContext:
    """Comprehensive context for CV component generation."""

    def __init__(
        self,
        cv: str,
        job_description: str,
        language: Optional[Language] = None,
        notes: Optional[str] = None,
    ):
        """
        Initialize generation context.

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


@runtime_checkable
class GeneratorProtocol(Protocol[T]):
    """
    Protocol defining the interface for generators.

    Generators return a type T, which can be a single DTO,
    a list of DTOs, or a custom wrapped type.
    """

    def __call__(self, context: GenerationContext) -> T:
        """
        Generate output based on the given context.

        Args:
            context: Comprehensive generation context

        Returns:
            Generated output of type T
        """
        ...


class Generator(Generic[T]):
    """
    Flexible generator for creating outputs.

    Generates outputs based on a generation context.
    Validation is handled by Pydantic models during generation.
    """

    def __init__(self, generation_func: Callable[[GenerationContext], T]):
        """
        Initialize the generator.

        Args:
            generation_func: Core generation logic
        """
        self._generate = generation_func

    def __call__(self, context: GenerationContext) -> T:
        """
        Generate output.

        Args:
            context: Generation context

        Returns:
            Generated output of type T
        """
        return self._generate(context)


# Type-specific generator protocols can be added here if needed
class CoreCompetenceGeneratorProtocol(GeneratorProtocol[CoreCompetenceDTO], Protocol):
    """Specific protocol for core competence generators."""

    pass


class ExperienceGeneratorProtocol(GeneratorProtocol[ExperienceDTO], Protocol):
    """Specific protocol for experience generators."""

    pass


class SkillsGeneratorProtocol(GeneratorProtocol[SkillGroupDTO], Protocol):
    """Specific protocol for skills generators."""

    pass
