import pytest
from pydantic import ValidationError

from cv_adapter.models.cv import CoreCompetence, CoreCompetences
from cv_adapter.models.language import Language


def test_core_competence_validation() -> None:
    # Valid competence
    competence = CoreCompetence(text="Python Development", language=Language.ENGLISH)
    assert competence.text == "Python Development"

    # Strips whitespace
    competence = CoreCompetence(
        text="  Python Development  ", language=Language.ENGLISH
    )
    assert competence.text == "Python Development"

    # Too many words
    with pytest.raises(ValueError, match=r"core competence must not exceed \d+ words"):
        CoreCompetence(
            text=(
                "One two three four five six seven eight nine ten eleven twelve "
                "thirteen fourteen"
            ),
            language=Language.ENGLISH,
        )

    # Contains newline
    with pytest.raises(ValueError, match="core competence must be a single line"):
        CoreCompetence(text="Python\nDevelopment", language=Language.ENGLISH)


def test_core_competences_validation() -> None:
    # Valid competences
    competences = CoreCompetences(
        items=[
            CoreCompetence(text="Python Development", language=Language.ENGLISH),
            CoreCompetence(text="Team Leadership", language=Language.ENGLISH),
            CoreCompetence(text="Project Management", language=Language.ENGLISH),
            CoreCompetence(text="System Design", language=Language.ENGLISH),
        ],
        language=Language.ENGLISH,
    )
    assert len(competences) == 4

    # Too few competences
    with pytest.raises(ValidationError, match="List should have at least 4 items"):
        CoreCompetences(
            items=[
                CoreCompetence(text="Python Development", language=Language.ENGLISH),
                CoreCompetence(text="Team Leadership", language=Language.ENGLISH),
            ],
            language=Language.ENGLISH,
        )

    # Too many competences
    with pytest.raises(ValidationError, match="List should have at most 6 items"):
        CoreCompetences(
            items=[
                CoreCompetence(text="Python Development", language=Language.ENGLISH),
                CoreCompetence(text="Team Leadership", language=Language.ENGLISH),
                CoreCompetence(text="Project Management", language=Language.ENGLISH),
                CoreCompetence(text="System Design", language=Language.ENGLISH),
                CoreCompetence(text="Data Analysis", language=Language.ENGLISH),
                CoreCompetence(text="Cloud Architecture", language=Language.ENGLISH),
                CoreCompetence(text="DevOps", language=Language.ENGLISH),
            ],
            language=Language.ENGLISH,
        )

    # Duplicate competences
    with pytest.raises(ValueError, match="core competences must be unique"):
        CoreCompetences(
            items=[
                CoreCompetence(text="Python Development", language=Language.ENGLISH),
                CoreCompetence(text="Team Leadership", language=Language.ENGLISH),
                CoreCompetence(text="Python Development", language=Language.ENGLISH),
                CoreCompetence(text="System Design", language=Language.ENGLISH),
            ],
            language=Language.ENGLISH,
        )
