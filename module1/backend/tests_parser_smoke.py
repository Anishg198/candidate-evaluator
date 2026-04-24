from backend.app import parser
from backend.app.parser import parse_resume


def test_parse_resume_smoke() -> None:
    text = """
    Ada Lovelace
    ada@example.com
    +91 99999 88888

    Skills
    Python, React, FastAPI, NLP, Machine Learning

    Experience
    Software Engineer
    Example Labs
    Jan 2022 - Present
    Built internal tools and model-serving workflows.

    Education
    B.Tech in Computer Science | HCL University | 2021
    """
    parsed = parse_resume(text).to_dict()
    assert parsed["email"] == "ada@example.com"
    assert "Python" in parsed["skills"]
    assert parsed["education"][0]["year"] == 2021


def test_extract_name_spacy_prefers_person_entity() -> None:
    parsed = parse_resume(
        """
        Candidate Profile
        Mr. Alan Turing
        alan@example.com
        +91 99999 88888

        Skills
        Python, NLP
        """
    ).to_dict()

    assert parsed["name"] == "Alan Turing"


def test_extract_name_spacy_falls_back_to_rule_based_when_person_is_invalid(monkeypatch) -> None:
    class FakeEntity:
        def __init__(self, text: str, label_: str) -> None:
            self.text = text
            self.label_ = label_

    class FakeDoc:
        def __init__(self) -> None:
            self.ents = [FakeEntity("Experience", "PERSON")]
            self.sents = []

    monkeypatch.setattr(parser, "_get_doc", lambda text: FakeDoc())

    parsed = parse_resume(
        """
        Grace Hopper
        grace@example.com
        +91 99999 88888

        Skills
        Python, FastAPI
        """
    ).to_dict()

    assert parsed["name"] == "Grace Hopper"


def test_parse_resume_handles_projects_research_and_education_boundaries() -> None:
    text = """
    Ritwik Bhattacharyya
    rb213@snu.edu.in
    +91 8712282348

    Education
    Shiv Nadar Institution of Eminence
    Aug 2023 - Present
    Bachelor of Technology (B.Tech), Computer Science and Engineering
    Relevant Coursework: Data Structures, Algorithms, Operating Systems

    Experience
    GitHub: IMD project internship
    India Meteorological Department (IMD), Visakhapatnam
    Forecast Allocator & Verification Platform
    Intern
    Developed a web-based platform for forecast verification.
    ○ Built dashboards and validation workflows.

    HCL
    Ongoing Intern
    AI-Powered Candidate Evaluation Platform
    Developing an end-to-end platform for candidate screening.
    ○ Built NLP-based CV parsing and skill extraction pipelines.

    Projects
    GitHub: chatgit
    ChatGIT
    AI-assisted developer tooling for codebase comprehension.
    ○ Built Retrieval-Augmented Generation pipelines with FastAPI and React.

    Research Experience
    Opportunities for Undergraduate Research (OUR)
    Software-Hardware Co-Design for MRI-Based Brain Tumor Segmentation
    Undergraduate Research (Ongoing)
    Working on acceleration of 3D U-Net inference.
    ○ Performed CPU/GPU profiling with Intel VTune.

    Skills
    Programming Languages: Python, JavaScript, C++, C
    Frameworks / Libraries: FastAPI, React

    Awards and Achievements
    Best Beginner Project
    """
    parsed = parse_resume(text).to_dict()

    assert len(parsed["experience"]) >= 4
    assert any("AI-Powered Candidate Evaluation Platform" in item["title"] for item in parsed["experience"])
    assert any("ChatGIT" in item["title"] for item in parsed["experience"])
    assert any(
        (
            "Undergraduate Research" in f'{item["title"]} {item["description"]}'
            or "Opportunities for Undergraduate Research" in f'{item["title"]} {item["description"]}'
        )
        for item in parsed["experience"]
    )
    assert parsed["education"][0]["degree"] == "Bachelor of Technology (B.Tech)"
    assert parsed["education"][0]["institution"] == "Shiv Nadar Institution of Eminence"
    assert all(skill not in {"Algorithms", "Operating Systems"} for skill in parsed["skills"])


def test_parse_resume_preserves_existing_fields_when_spacy_augments_experience() -> None:
    parsed = parse_resume(
        """
        Ada Lovelace
        ada@example.com
        +91 99999 88888

        Experience
        Data Platform Modernization
        Worked with Example Labs on ETL modernization from Jan 2022 to Present.
        ○ Built internal workflow tooling in Python.

        Skills
        Python, React, FastAPI
        """
    ).to_dict()

    assert parsed["email"] == "ada@example.com"
    assert parsed["phone"] == "+91 99999 88888"
    assert "Python" in parsed["skills"]
    assert len(parsed["experience"]) == 1
    assert parsed["experience"][0]["company"] in {"Example Labs", ""}
    assert isinstance(parsed["experience"][0]["duration"], str)
