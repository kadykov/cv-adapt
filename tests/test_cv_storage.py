from datetime import date
from pathlib import Path

import pytest

from cv_adapter.models.cv import (
    CV,
    Company,
    CoreCompetence,
    CoreCompetences,
    CVDescription,
    Experience,
)
from cv_adapter.services.cv_storage import CVStorage, CVStorageError

SAMPLE_CV_YAML = """
full_name: John Doe
title: Senior Software Engineer
description:
  text: >-
    Senior Software Engineer with 5+ years of experience in Python and cloud
    technologies, specializing in cloud-native applications and CI/CD.
core_competences:
  items:
    - text: Python Development
    - text: Cloud Architecture
    - text: System Design
    - text: Team Leadership
experiences:
  - company:
      name: Tech Corp
      description: Leading cloud technology company
      location: San Francisco, CA
    position: Senior Software Engineer
    start_date: 2020-01-01
    end_date: 2023-12-31
    description: Led development of cloud-native applications using Python and Kubernetes. Improved system performance by 40% through microservices architecture redesign. Mentored junior developers and implemented CI/CD best practices.
    technologies:
      - Python
      - Docker
      - AWS
  - company:
      name: StartUp Inc
      description: Innovative web development startup
      location: New York, NY
    position: Software Developer
    start_date: 2018-01-01
    end_date: 2019-12-31
    description: Full-stack development of web applications. Developed new customer portal increasing user engagement by 35%. Improved application performance by 50% through database optimization and caching.
    technologies:
      - Python
      - React
      - PostgreSQL
education:
  - "MSc in Computer Science, University of Technology, 2018"
  - "BSc in Software Engineering, Tech University, 2016"
contacts:
  email: john.doe@example.com
  phone: "+1234567890"
  linkedin: "linkedin.com/in/johndoe"
"""


@pytest.fixture
def cv_storage(tmp_path: Path) -> CVStorage:
    storage = CVStorage(cv_dir=tmp_path)
    return storage


@pytest.fixture
def sample_cv_file(tmp_path: Path) -> Path:
    cv_file = tmp_path / "john_doe.yaml"
    cv_file.write_text(SAMPLE_CV_YAML)
    return cv_file


def test_load_cv_from_yaml(cv_storage: CVStorage, sample_cv_file: Path) -> None:
    cv = cv_storage.load_cv(sample_cv_file)
    assert isinstance(cv, CV)
    assert cv.full_name == "John Doe"
    assert len(cv.core_competences) == 4
    assert len(cv.experiences) == 2
    assert len(cv.education) == 2
    assert cv.contacts["email"] == "john.doe@example.com"


def test_load_cv_validates_data(cv_storage: CVStorage, tmp_path: Path) -> None:
    invalid_cv = """
    full_name: John Doe
    title: Senior Engineer
    # Missing required fields
    """
    invalid_file = tmp_path / "invalid.yaml"
    invalid_file.write_text(invalid_cv)

    with pytest.raises(CVStorageError) as exc_info:
        cv_storage.load_cv(invalid_file)
    assert "Validation error" in str(exc_info.value)


def test_save_cv_to_yaml(cv_storage: CVStorage, tmp_path: Path) -> None:
    cv = CV(
        full_name="Jane Smith",
        title="Data Scientist",
        description=CVDescription(
            text=(
                "Data Scientist with PhD and industry experience in machine learning, "
                "specializing in model development and optimization."
            ),
        ),
        core_competences=CoreCompetences(
            items=[
                CoreCompetence(text="Machine Learning"),
                CoreCompetence(text="Data Analysis"),
                CoreCompetence(text="Python Development"),
                CoreCompetence(text="Team Leadership"),
            ]
        ),
        experiences=[
            Experience(
                company=Company(
                    name="AI Corp",
                    description="Leading AI research company",
                    location="Boston, MA",
                ),
                position="Data Scientist",
                start_date=date(2020, 1, 1),
                end_date=date(2023, 12, 31),
                description="Led machine learning research team developing state-of-the-art models. Improved model accuracy by 20% and reduced training time by 35%. Implemented automated model deployment pipeline.",
                technologies=["Python", "TensorFlow", "PyTorch"],
            )
        ],
        education=["PhD in Data Science, Tech University, 2020"],
        contacts={"email": "jane@example.com"},
    )

    output_file = tmp_path / "jane_smith.yaml"
    cv_storage.save_cv(cv, output_file)

    # Verify we can load it back
    loaded_cv = cv_storage.load_cv(output_file)
    assert loaded_cv.full_name == cv.full_name
    assert len(loaded_cv.core_competences) == len(cv.core_competences)
    assert loaded_cv.core_competences.items[0] == cv.core_competences.items[0]


def test_cv_storage_handles_missing_file(cv_storage: CVStorage, tmp_path: Path) -> None:
    non_existent = tmp_path / "does_not_exist.yaml"
    with pytest.raises(CVStorageError) as exc_info:
        cv_storage.load_cv(non_existent)
    assert "File not found" in str(exc_info.value)


def test_cv_storage_handles_invalid_yaml(cv_storage: CVStorage, tmp_path: Path) -> None:
    invalid_yaml = tmp_path / "invalid.yaml"
    invalid_yaml.write_text("{ invalid: yaml: content:")

    with pytest.raises(CVStorageError) as exc_info:
        cv_storage.load_cv(invalid_yaml)
    assert "YAML parsing error" in str(exc_info.value)
