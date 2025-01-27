from typing import (
    Callable,
    Generic,
    List,
    Optional,
    Protocol,
    TypeVar,
    runtime_checkable,
)

from cv_adapter.dto.cv import CoreCompetenceDTO, ExperienceDTO, SkillGroupDTO
from cv_adapter.dto.language import ENGLISH, Language

T = TypeVar("T", covariant=True)


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
class BaseGeneratorProtocol(Protocol[T]):
    """
    Base protocol defining the interface for generators.

    Generators return a type T, which can be a single DTO,
    a list of DTOs, or a custom wrapped type.
    """

    def __call__(self, context: BaseGenerationContext) -> T:
        """
        Generate output based on the given context.

        Args:
            context: Base generation context

        Returns:
            Generated output of type T
        """
        ...


class BaseGenerator(Generic[T]):
    """
    Base generator for creating outputs.

    Generates outputs based on a generation context.
    Validation is handled by Pydantic models during generation.
    """

    def __init__(self, generation_func: Callable[[BaseGenerationContext], T]):
        """
        Initialize the generator.

        Args:
            generation_func: Core generation logic
        """
        self._generate = generation_func

    def __call__(self, context: BaseGenerationContext) -> T:
        """
        Generate output.

        Args:
            context: Generation context

        Returns:
            Generated output of type T
        """
        return self._generate(context)


@runtime_checkable
class CoreCompetenceGeneratorProtocol(Protocol[T]):
    """Protocol for core competence generators."""

    def __call__(self, context: CoreCompetenceGenerationContext) -> T:
        """
        Generate output based on the given context.

        Args:
            context: Core competence generation context

        Returns:
            Generated output of type T
        """
        ...


class CoreCompetenceGenerator(Generic[T]):
    """Generator for core competences."""

    def __init__(self, generation_func: Callable[[CoreCompetenceGenerationContext], T]):
        """
        Initialize the generator.

        Args:
            generation_func: Core generation logic
        """
        self._generate = generation_func

    def __call__(self, context: CoreCompetenceGenerationContext) -> T:
        """
        Generate output.

        Args:
            context: Core competence generation context

        Returns:
            Generated output of type T
        """
        return self._generate(context)


@runtime_checkable
class ComponentGeneratorProtocol(Protocol[T]):
    """Protocol for CV component generators that require core competences."""

    def __call__(self, context: ComponentGenerationContext) -> T:
        """
        Generate output based on the given context.

        Args:
            context: Component generation context

        Returns:
            Generated output of type T
        """
        ...


class ComponentGenerator(Generic[T]):
    """Generator for CV components that require core competences."""

    def __init__(self, generation_func: Callable[[ComponentGenerationContext], T]):
        """
        Initialize the generator.

        Args:
            generation_func: Core generation logic
        """
        self._generate = generation_func

    def __call__(self, context: ComponentGenerationContext) -> T:
        """
        Generate output.

        Args:
            context: Component generation context

        Returns:
            Generated output of type T
        """
        return self._generate(context)


# Type-specific generator protocols
class CoreCompetenceGeneratorProtocolDTO(CoreCompetenceGeneratorProtocol[List[CoreCompetenceDTO]], Protocol):
    """Specific protocol for core competence generators."""
    pass


class ExperienceGeneratorProtocolDTO(ComponentGeneratorProtocol[List[ExperienceDTO]], Protocol):
    """Specific protocol for experience generators."""
    pass


class SkillsGeneratorProtocolDTO(ComponentGeneratorProtocol[List[SkillGroupDTO]], Protocol):
    """Specific protocol for skills generators."""
    pass
