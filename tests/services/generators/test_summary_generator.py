import pytest
from pydantic_ai.models.test import TestModel

from cv_adapter.dto.language import ENGLISH
from cv_adapter.models.language_context import language_context
from cv_adapter.renderers.markdown import MinimalMarkdownRenderer
from cv_adapter.services.generators.summary_generator import SummaryGenerator


@pytest.fixture
def test_model() -> TestModel:
    """Create a test model for summary generation."""
    model = TestModel()
    model.custom_result_args = {
        "data": {
            "text": "Experienced software engineer with a proven track record of delivering innovative solutions and leading cross-functional teams."
        }
    }
    return model


def test_generate_summary_dto(test_model: TestModel) -> None:
    """Test that generate method returns a SummaryDTO."""
    # Set language context before the test
    with language_context(ENGLISH):
        # Initialize generator
        generator = SummaryGenerator(renderer=MinimalMarkdownRenderer(), ai_model="test")

        # Use agent override to set the test model
        with generator.agent.override(model=test_model):
            # Generate summary
            result = generator.generate(
                cv="Sample CV",
                job_description="Sample Job",
                core_competences="Python, Leadership",
            )

    # Verify DTO structure
    assert hasattr(result, "text")
    assert isinstance(result.text, str)
    assert len(result.text) > 0
