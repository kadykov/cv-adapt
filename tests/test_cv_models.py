import pytest
from pydantic import ValidationError

from cv_adapter.models.cv import CoreCompetence, CoreCompetences


def test_core_competence_validation():
    # Valid competence
    competence = CoreCompetence(text="Python Development")
    assert competence.text == "Python Development"

    # Strips whitespace
    competence = CoreCompetence(text="  Python Development  ")
    assert competence.text == "Python Development"

    # Too many words
    with pytest.raises(ValueError, match="core competence must not be longer than 5 words"):
        CoreCompetence(text="This has more than five words here")

    # Contains newline
    with pytest.raises(ValueError, match="core competence must be a single line"):
        CoreCompetence(text="Python\nDevelopment")


def test_core_competences_validation():
    # Valid competences
    competences = CoreCompetences(
        items=[
            CoreCompetence(text="Python Development"),
            CoreCompetence(text="Team Leadership"),
            CoreCompetence(text="Project Management"),
            CoreCompetence(text="System Design"),
        ]
    )
    assert len(competences) == 4

    # Too few competences
    with pytest.raises(ValidationError, match="List should have at least 4 items"):
        CoreCompetences(
            items=[
                CoreCompetence(text="Python Development"),
                CoreCompetence(text="Team Leadership"),
            ]
        )

    # Too many competences
    with pytest.raises(ValidationError, match="List should have at most 6 items"):
        CoreCompetences(
            items=[
                CoreCompetence(text="Python Development"),
                CoreCompetence(text="Team Leadership"),
                CoreCompetence(text="Project Management"),
                CoreCompetence(text="System Design"),
                CoreCompetence(text="Data Analysis"),
                CoreCompetence(text="Cloud Architecture"),
                CoreCompetence(text="DevOps"),
            ]
        )

    # Duplicate competences
    with pytest.raises(ValueError, match="core competences must be unique"):
        CoreCompetences(
            items=[
                CoreCompetence(text="Python Development"),
                CoreCompetence(text="Team Leadership"),
                CoreCompetence(text="Python Development"),
                CoreCompetence(text="System Design"),
            ]
        )


def test_core_competences_to_list():
    # Create test data
    competences = CoreCompetences(
        items=[
            CoreCompetence(text="Python Development"),
            CoreCompetence(text="Team Leadership"),
            CoreCompetence(text="Project Management"),
            CoreCompetence(text="System Design"),
        ]
    )

    # Test to_list() method
    result = competences.to_list()

    # Verify the result
    assert isinstance(result, list)
    assert all(isinstance(item, str) for item in result)
    assert result == [
        "Python Development",
        "Team Leadership",
        "Project Management",
        "System Design",
    ]

    # Verify the order is preserved
    for i, item in enumerate(competences.items):
        assert item.text == result[i]
