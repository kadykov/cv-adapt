"""Base abstract generator for CV components."""

from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Union, List, Optional

import os
from jinja2 import Environment, FileSystemLoader, Template, StrictUndefined

from pydantic_ai import Agent
from pydantic_ai.models import KnownModelName

from cv_adapter.dto.language import ENGLISH, Language
from cv_adapter.models.language_context import get_current_language


T = TypeVar('T')  # Generic type for the DTO


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
    ) -> None:
        """
        Initialize the base generator.

        Args:
            ai_model: AI model to use for generation. Defaults to OpenAI GPT-4o.
            system_prompt_template_path: Optional path to Jinja2 template for system prompt.
            context_template_path: Optional path to Jinja2 template for context generation.
        """
        self.system_prompt_template_path = system_prompt_template_path
        self.context_template_path = context_template_path

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
                undefined=StrictUndefined  # Raise errors for undefined variables
            )

            # Load and render the template
            template = env.get_template(template_filename)
            rendered_prompt = template.render()

            # Validate that the rendered prompt is not empty
            if not rendered_prompt or not rendered_prompt.strip():
                raise RuntimeError(
                    f"Rendered system prompt is empty: {self.system_prompt_template_path}"
                )

            return rendered_prompt

        except Exception as e:
            raise RuntimeError(
                f"Error loading system prompt template {self.system_prompt_template_path}: {str(e)}"
            ) from e

    # Removed default system prompt method to enforce explicit template provision

    @abstractmethod
    def generate(
        self,
        cv: str,
        job_description: str,
        **kwargs
    ) -> Union[T, List[T]]:
        """
        Generate CV component based on CV and job description.

        Args:
            cv: Text of the CV
            job_description: Job description text
            **kwargs: Additional generation parameters

        Returns:
            Generated CV component or list of components
        """
        raise NotImplementedError("Subclasses must implement generate method")

    def _prepare_context(
        self,
        cv: str,
        job_description: str,
        **kwargs
    ) -> str:
        """
        Prepare context for generation with language support.

        Args:
            cv: CV text
            job_description: Job description text
            **kwargs: Additional context parameters

        Returns:
            Prepared context string
        """
        # Determine language, prioritizing passed language over context
        language = kwargs.get('language') or get_current_language()

        # Use custom context template if provided
        if self.context_template_path and os.path.exists(self.context_template_path):
            env = Environment(loader=FileSystemLoader(os.path.dirname(self.context_template_path)))
            template = env.get_template(os.path.basename(self.context_template_path))
            
            # Remove language from kwargs to prevent duplicate argument
            render_kwargs = {k: v for k, v in kwargs.items() if k != 'language'}
            
            return template.render(
                cv=cv,
                job_description=job_description,
                language=language,
                ENGLISH=ENGLISH,
                **render_kwargs
            )

        # Fallback to default context generation
        context = f"CV:\n{cv}\n\nJob Description:\n{job_description}\n"

        # Add language-specific instructions if not English
        if language != ENGLISH:
            context += (
                f"\nLanguage Requirements:\n"
                f"Generate content in {language.name.title()}, "
                f"following professional conventions.\n"
            )

        # Add optional notes
        if kwargs.get('notes'):
            context += f"\nAdditional Notes:\n{kwargs['notes']}"

        return context