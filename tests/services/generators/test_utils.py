from pathlib import Path

import pytest

from cv_adapter.dto.language import ENGLISH, FRENCH
from cv_adapter.services.generators.protocols import BaseGenerationContext
from cv_adapter.services.generators.utils import load_system_prompt, prepare_context


def create_test_template(tmp_path: Path, filename: str, content: str) -> str:
    """Create a temporary template file for testing."""
    template_path = tmp_path / filename
    template_path.write_text(content)
    return str(template_path)


def test_load_system_prompt_success(tmp_path: Path) -> None:
    """Test successful loading of a system prompt template."""
    template_content = "You are a helpful AI assistant for CV generation."
    template_path = create_test_template(
        tmp_path, "system_prompt.txt", template_content
    )

    result = load_system_prompt(template_path)
    assert result == template_content


def test_load_system_prompt_file_not_found() -> None:
    """Test handling of non-existent template file."""
    with pytest.raises(FileNotFoundError):
        load_system_prompt("/path/to/nonexistent/template.txt")


def test_load_system_prompt_empty_template(tmp_path: Path) -> None:
    """Test handling of an empty template."""
    template_path = create_test_template(tmp_path, "empty_prompt.txt", "")

    with pytest.raises(RuntimeError, match="Rendered system prompt is empty"):
        load_system_prompt(template_path)


def test_prepare_context_success(tmp_path: Path) -> None:
    """Test successful context preparation."""
    # Create a test template
    template_content = """
    Language: {{ language }}
    Job Title: {{ job_description }}
    CV Name: {{ cv }}
    Notes: {{ notes }}
    Extra: {{ extra_info }}
    """
    template_path = create_test_template(
        tmp_path, "context_template.txt", template_content
    )

    # Prepare test data
    cv_markdown = """# John Doe

## Professional Summary
Experienced software engineer with a strong background in Python development.

## Work Experience
### Software Engineer at Tech Company
- Developed scalable web applications
- Implemented efficient backend solutions

## Education
### Computer Science Degree
University of Technology, 2016-2020

## Skills
- Python
- Backend Development
- Cloud Computing"""

    context = BaseGenerationContext(
        cv=cv_markdown,
        job_description="Senior Software Engineer position at Innovative Tech",
        language=ENGLISH,
        notes="Test context for CV generation",
    )

    # Prepare context with extra info
    result = prepare_context(template_path, context, extra_info="Additional details")

    # Verify the rendered context
    assert "Language: en" in result
    assert "Job Title: Senior Software Engineer position at Innovative Tech" in result
    assert "CV Name: # John Doe" in result
    assert "Notes: Test context for CV generation" in result
    assert "Extra: Additional details" in result


def test_prepare_context_file_not_found() -> None:
    """Test handling of non-existent context template."""
    cv_markdown = """# John Doe

## Professional Summary
Experienced software engineer with a strong background in Python development.

## Work Experience
### Software Engineer at Tech Company
- Developed scalable web applications
- Implemented efficient backend solutions

## Education
### Computer Science Degree
University of Technology, 2016-2020

## Skills
- Python
- Backend Development
- Cloud Computing"""

    context = BaseGenerationContext(
        cv=cv_markdown,
        job_description="Senior Software Engineer position",
        language=ENGLISH,
        notes="Test context for file not found scenario",
    )

    with pytest.raises(ValueError, match="Context template file does not exist"):
        prepare_context("/path/to/nonexistent/template.txt", context)


def test_prepare_context_non_english_language(tmp_path: Path) -> None:
    """Test context preparation with non-English language."""
    # Create a test template
    template_content = """
    Language: {{ language }}
    Job Title: {{ job_description }}
    CV Name: {{ cv }}
    Notes: {{ notes }}
    {% if language != ENGLISH %}
    Language Requirements: Generate in {{ language.name.title() }}
    following professional conventions.
    {% endif %}
    """
    template_path = create_test_template(
        tmp_path, "context_template.txt", template_content
    )

    # Prepare test data
    cv_markdown = """# Jean Dupont

    ## Professional Summary
    Software engineer with Python experience."""

    context = BaseGenerationContext(
        cv=cv_markdown,
        job_description="Senior Software Engineer position",
        language=FRENCH,
        notes="Test context for French language",
    )

    # Prepare context
    result = prepare_context(template_path, context)

    # Verify the rendered context
    assert "Language: fr" in result
    assert "Generate in French" in result
    assert "Job Title: Senior Software Engineer position" in result
    assert "CV Name: # Jean Dupont" in result
    assert "Notes: Test context for French language" in result


def test_prepare_context_empty_template(tmp_path: Path) -> None:
    """Test handling of an empty context template."""
    template_path = create_test_template(tmp_path, "empty_context.txt", "")

    cv_markdown = """# John Doe

## Professional Summary
Experienced software engineer with a strong background in Python development.

## Work Experience
### Software Engineer at Tech Company
- Developed scalable web applications
- Implemented efficient backend solutions

## Education
### Computer Science Degree
University of Technology, 2016-2020

## Skills
- Python
- Backend Development
- Cloud Computing"""

    context = BaseGenerationContext(
        cv=cv_markdown,
        job_description="Senior Software Engineer position",
        language=ENGLISH,
        notes="Test context for empty template scenario",
    )

    with pytest.raises(RuntimeError, match="Rendered context template is empty"):
        prepare_context(template_path, context)
