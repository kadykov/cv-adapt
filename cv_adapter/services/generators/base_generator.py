"""Base abstract generator for CV components."""

import os
from abc import ABC, abstractmethod
from typing import Any, Callable, Generic, List, Optional, TypeVar, Union, cast

from jinja2 import Environment, FileSystemLoader, StrictUndefined
from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.language import ENGLISH, Language
from cv_adapter.models.language_context import get_current_language

T = TypeVar("T")  # Generic type for the DTO


class BaseGenerator(ABC, Generic[T]):
    """
    Abstract base class for CV component generators.

    Provides a standardized approach to generating CV components using AI,
    with support for template-based prompts and language-aware generation.
    """

    def __init__(
        self,
        ai_model: KnownModelName = "openai:gpt-4o",
        system_prompt_template_path: Optional[str] = None,
        context_template_path: Optional[str] = None,
        result_type: Optional[Any] = None,
        mapper_func: Optional[Callable[[Any], T]] = None,
    ) -> None:
        """
        Initialize the base generator.

        Args:
            ai_model: AI model to use for generation.
                Defaults to OpenAI GPT-4o.
            system_prompt_template_path: Optional path to
                Jinja2 template for system prompt.
            context_template_path: Optional path to
                Jinja2 template for context generation.
            result_type: Optional type for result conversion
            mapper_func: Optional function to map result to DTO
        """
        self.system_prompt_template_path = system_prompt_template_path
        self.context_template_path = context_template_path
        self._result_type = result_type
        self._mapper_func = mapper_func

        self.agent = Agent(
            ai_model,
            system_prompt=self._load_system_prompt(),
        )

    def _load_system_prompt(self) -> str:
        """
        Load system prompt from a Jinja2 template.

        Returns:
            System prompt string

        Raises:
            FileNotFoundError: If the template file does not exist
            RuntimeError: If there's an error loading or rendering the template
        """
        if not self.system_prompt_template_path:
            raise ValueError("System prompt template path is not provided")

        if not os.path.exists(self.system_prompt_template_path):
            raise FileNotFoundError(
                f"System prompt template not found: {self.system_prompt_template_path}"
            )

        try:
            # Get the directory and filename separately
            template_dir = os.path.dirname(self.system_prompt_template_path)
            template_filename = os.path.basename(self.system_prompt_template_path)

            # Create Jinja2 environment
            env = Environment(
                loader=FileSystemLoader(template_dir),
                undefined=StrictUndefined,  # Raise errors for undefined variables
            )

            # Load and render the template
            template = env.get_template(template_filename)
            rendered_prompt = template.render()

            # Validate that the rendered prompt is not empty
            if not rendered_prompt or not rendered_prompt.strip():
                raise RuntimeError(
                    f"Rendered system prompt is empty: "
                    f"{self.system_prompt_template_path}"
                )

            return rendered_prompt

        except Exception as e:
            raise RuntimeError(
                f"Error loading system prompt template "
                f"{self.system_prompt_template_path}: {str(e)}"
            ) from e

    # Removed default system prompt method to enforce explicit template provision

    @abstractmethod
    def generate(
        self,
        cv: str,
        job_description: str,
        language: Optional[Language] = None,
        notes: Optional[str] = None,
        **kwargs: Any,
    ) -> Union[T, List[T]]:
        """
        Generate CV component based on CV and job description.

        Args:
            cv: Text of the CV
            job_description: Job description text
            language: Optional language for generation
            notes: Optional additional notes for generation
            **kwargs: Additional generation parameters

        Returns:
            Generated CV component or list of components
        """
        raise NotImplementedError("Subclasses must implement generate method")

    def _generate_with_context(
        self,
        cv: str,
        job_description: str,
        language: Optional[Language] = None,
        notes: Optional[str] = None,
        **kwargs: Any,
    ) -> Union[T, List[T]]:
        """
        Common generation method with context handling.

        Args:
            cv: Text of the CV
            job_description: Job description text
            language: Optional language for generation
            notes: Optional additional notes for generation
            **kwargs: Additional generation parameters

        Returns:
            Generated CV component or list of components
        """
        # Prepare context for generation
        context = self._prepare_context(
            cv=cv,
            job_description=job_description,
            language=language,
            notes=notes,
            **kwargs,
        )

        # Use the agent to generate result
        result_type = kwargs.get("result_type", self._result_type)
        result: Any = self.agent.run_sync(
            context,
            result_type=result_type,
        )

        # Apply mapper function if provided
        mapper_func = kwargs.get("mapper_func", self._mapper_func)
        if mapper_func:
            if isinstance(result.data, list):
                return cast(List[T], [mapper_func(item) for item in result.data])
            else:
                return cast(T, mapper_func(result.data))

        # Explicitly type cast to Union[T, List[T]]
        return cast(Union[T, List[T]], result.data)

    def _prepare_context(
        self,
        cv: str,
        job_description: str,
        language: Optional[Language] = None,
        notes: Optional[str] = None,
        **kwargs: Any,
    ) -> str:
        """
        Prepare context for generation with language support.

        Args:
            cv: CV text
            job_description: Job description text
            language: Language for generation (default: current language context)
            **kwargs: Additional context parameters

        Returns:
            Prepared context string

        Raises:
            ValueError: If context template path is not set or cannot be processed
            RuntimeError: If template rendering fails
        """
        # Use current language context if no language is provided
        if language is None:
            language = get_current_language()

        # Validate context template path
        if not self.context_template_path:
            raise ValueError(
                "Context template path is not set. A valid template path is required."
            )

        if not os.path.exists(self.context_template_path):
            raise ValueError(
                f"Context template file does not exist: {self.context_template_path}"
            )

        try:
            # Create Jinja2 environment
            env = Environment(
                loader=FileSystemLoader(os.path.dirname(self.context_template_path)),
                undefined=StrictUndefined,  # Raise errors for undefined variables
            )
            template = env.get_template(os.path.basename(self.context_template_path))

            # Render the template
            context = template.render(
                cv=cv,
                job_description=job_description,
                language=language,
                ENGLISH=ENGLISH,
                notes=notes,
                **kwargs,
            )

            # Validate rendered context
            if not context or not context.strip():
                raise RuntimeError("Rendered context template is empty")

            return context

        except Exception as e:
            raise RuntimeError(
                f"Failed to process context template "
                f"{self.context_template_path}: {str(e)}"
            ) from e
