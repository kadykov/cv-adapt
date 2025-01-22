from datetime import date
from pathlib import Path

import pytest

from cv_adapter.models.cv import (
    CV,
    Company,
    CoreCompetence,
    CoreCompetences,
    Education,
    Experience,
    Skill,
    SkillGroup,
    Skills,
    Title,
    University,
)
from cv_adapter.models.language import Language
from cv_adapter.models.personal_info import PersonalInfo
from cv_adapter.models.summary import CVSummary
from cv_adapter.services.cv_storage import CVStorage, CVStorageError

SAMPLE_CV_YAML = """
personal_info:
  full_name: John Doe
  contacts:
    email: john.doe@example.com
    phone: "+1234567890"
    linkedin: "linkedin.com/in/johndoe"
title:
  text: Senior Software Engineer
  language: en
summary:
  text: >-
    Senior Software Engineer with 5+ years of experience in Python and cloud
    technologies, specializing in cloud-native applications and CI/CD.
  language: en
core_competences:
  items:
    - text: Python Development
      language: en
    - text: Cloud Architecture
      language: en
    - text: System Design
      language: en
    - text: Team Leadership
      language: en
  language: en
experiences:
  - company:
      name: Tech Corp
      description: Leading cloud technology company
      location: San Francisco, CA
      language: en
    position: Senior Software Engineer
    start_date: 2020-01-01
    end_date: 2023-12-31
    description: >-
      Led development of cloud-native applications using Python and Kubernetes.
      Improved system performance by 40% through microservices architecture redesign.
      Mentored junior developers and implemented CI/CD best practices.
    technologies:
      - Python
      - Docker
      - AWS
    language: en
  - company:
      name: StartUp Inc
      description: Innovative web development startup
      location: New York, NY
      language: en
    position: Software Developer
    start_date: 2018-01-01
    end_date: 2019-12-31
    description: >-
      Full-stack development of web applications. Developed new customer portal
      increasing user engagement by 35%. Improved application performance by 50%
      through database optimization and caching.
    technologies:
      - Python
      - React
      - PostgreSQL
    language: en
education:
  - university:
      name: University of Technology
      description: Leading technical university
      location: San Francisco, CA
      language: en
    degree: MSc in Computer Science
    start_date: 2016-09-01
    end_date: 2018-06-30
    description: >-
      Specialized in distributed systems and cloud computing. Developed scalable
      data processing systems as part of thesis. Collaborated on research projects
      with industry partners.
    language: en
  - university:
      name: Tech University
      description: Top engineering school
      location: Boston, MA
      language: en
    degree: BSc in Software Engineering
    start_date: 2012-09-01
    end_date: 2016-06-30
    description: >-
      Focus on software engineering principles and practices. Led team projects in
      agile development. Completed internship at major tech company.
    language: en

skills:
  groups:
    - name: Programming
      skills:
        - text: Python
          language: en
        - text: Docker
          language: en
        - text: AWS
          language: en
      language: en
    - name: Leadership
      skills:
        - text: Team Management
          language: en
        - text: Mentoring
          language: en
        - text: Agile
          language: en
      language: en
  language: en
language: en
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
    assert cv.personal_info.full_name == "John Doe"
    assert cv.personal_info.contacts["email"] == "john.doe@example.com"
    assert len(cv.core_competences) == 4
    assert len(cv.experiences) == 2
    assert len(cv.education) == 2


def test_load_cv_validates_data(cv_storage: CVStorage, tmp_path: Path) -> None:
    invalid_cv = """
    personal_info:
      full_name: John Doe
      contacts:
        email: john@example.com
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
        personal_info=PersonalInfo(
            full_name="Jane Smith",
            contacts={"email": "jane@example.com"},
        ),
        title=Title(text="Data Scientist", language=Language.ENGLISH),
        summary=CVSummary(
            text=(
                "Data Scientist with PhD and industry experience in machine learning, "
                "specializing in model development and optimization."
            ),
            language=Language.ENGLISH,
        ),
        core_competences=CoreCompetences(
            items=[
                CoreCompetence(text="Machine Learning", language=Language.ENGLISH),
                CoreCompetence(text="Data Analysis", language=Language.ENGLISH),
                CoreCompetence(text="Python Development", language=Language.ENGLISH),
                CoreCompetence(text="Team Leadership", language=Language.ENGLISH),
            ],
            language=Language.ENGLISH,
        ),
        experiences=[
            Experience(
                company=Company(
                    name="AI Corp",
                    description="Leading AI research company",
                    location="Boston, MA",
                    language=Language.ENGLISH,
                ),
                position="Data Scientist",
                start_date=date(2020, 1, 1),
                end_date=date(2023, 12, 31),
                description=(
                    "Led ML research team developing state-of-the-art models. "
                    "Improved model accuracy by 20% and reduced training time by 35%. "
                    "Implemented automated model deployment pipeline."
                ),
                technologies=["Python", "TensorFlow", "PyTorch"],
                language=Language.ENGLISH,
            )
        ],
        education=[
            Education(
                university=University(
                    name="Tech University",
                    description="Leading research university",
                    location="Boston, MA",
                    language=Language.ENGLISH,
                ),
                degree="PhD in Data Science",
                start_date=date(2017, 9, 1),
                end_date=date(2020, 6, 30),
                description=(
                    "Conducted research in machine learning and deep learning. "
                    "Published papers in top conferences. Developed novel algorithms "
                    "for large-scale data processing and analysis."
                ),
                language=Language.ENGLISH,
            )
        ],
        skills=Skills(
            groups=[
                SkillGroup(
                    name="Machine Learning",
                    skills=[
                        Skill(text="TensorFlow", language=Language.ENGLISH),
                        Skill(text="PyTorch", language=Language.ENGLISH),
                        Skill(text="Deep Learning", language=Language.ENGLISH),
                    ],
                    language=Language.ENGLISH,
                ),
                SkillGroup(
                    name="Programming",
                    skills=[
                        Skill(text="Python", language=Language.ENGLISH),
                        Skill(text="SQL", language=Language.ENGLISH),
                    ],
                    language=Language.ENGLISH,
                ),
            ],
            language=Language.ENGLISH,
        ),
        language=Language.ENGLISH,
    )

    output_file = tmp_path / "jane_smith.yaml"
    cv_storage.save_cv(cv, output_file)

    # Verify we can load it back
    loaded_cv = cv_storage.load_cv(output_file)
    assert loaded_cv.personal_info.full_name == cv.personal_info.full_name
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
