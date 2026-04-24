from __future__ import annotations

import re
from collections import OrderedDict
from dataclasses import dataclass
from datetime import date
from functools import lru_cache
from tempfile import NamedTemporaryFile
from typing import Iterable

import docx2txt
from pdfminer.high_level import extract_text as extract_pdf_text
import spacy
from spacy.tokens import Doc

EMAIL_RE = re.compile(r"[A-Za-z0-9.\-+_]+@[A-Za-z0-9.\-+_]+\.[A-Za-z]+")
PHONE_RE = re.compile(r"(?:(?:\+?\d{1,3}[\s\-().]*)?(?:\d[\s\-().]*){9,15})")
YEAR_RE = re.compile(r"\b(19\d{2}|20\d{2}|21\d{2})\b")
MONTH_YEAR_RE = re.compile(
    r"(?P<month>jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|"
    r"dec(?:ember)?)\s+(?P<year>19\d{2}|20\d{2}|21\d{2})",
    re.IGNORECASE,
)
DATE_RANGE_RE = re.compile(
    r"(?P<start>(?:"
    r"jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|"
    r"aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?"
    r")\s+\d{4}|\d{4})\s*[-–to]+\s*(?P<end>present|current|now|(?:"
    r"jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|"
    r"aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?"
    r")\s+\d{4}|\d{4})",
    re.IGNORECASE,
)

SECTION_TITLES = {
    "skills": {"skills", "technical skills", "core skills", "competencies", "expertise"},
    "experience": {
        "experience",
        "work experience",
        "professional experience",
        "employment history",
        "internships",
    },
    "projects": {"projects", "project experience", "key projects"},
    "research": {"research experience", "research", "publications and research"},
    "education": {"education", "academic background", "academics", "qualifications"},
    "summary": {"summary", "professional summary", "profile", "objective", "about"},
    "awards": {"awards", "awards and achievements", "achievements", "honors"},
}

EDU_KEYWORDS = [
    "school",
    "college",
    "univers",
    "institution",
    "academy",
    "faculty",
    "institute",
    "polytechnic",
    "campus",
]

DEGREE_KEYWORDS = [
    "b.tech",
    "btech",
    "b.e",
    "be ",
    "bachelor",
    "master",
    "m.tech",
    "mtech",
    "mba",
    "b.sc",
    "m.sc",
    "bs",
    "ms",
    "phd",
    "doctorate",
    "diploma",
]

STOPWORDS = {
    "and",
    "the",
    "with",
    "for",
    "from",
    "into",
    "over",
    "using",
    "use",
    "to",
    "a",
    "an",
    "of",
    "in",
    "on",
    "by",
    "or",
    "at",
    "as",
    "is",
    "are",
}

SKILL_ALIASES = OrderedDict(
    {
        # Languages
        "js": "JavaScript",
        "javascript": "JavaScript",
        "ts": "TypeScript",
        "typescript": "TypeScript",
        "py": "Python",
        "golang": "Go",
        "rust lang": "Rust",
        "kotlin": "Kotlin",
        "swift": "Swift",
        "r lang": "R",
        "r programming": "R",
        # Frameworks
        "react.js": "React",
        "reactjs": "React",
        "react native": "React Native",
        "vue.js": "Vue.js",
        "vuejs": "Vue.js",
        "angular.js": "Angular",
        "angularjs": "Angular",
        "next.js": "Next.js",
        "nextjs": "Next.js",
        "node.js": "Node.js",
        "nodejs": "Node.js",
        "express.js": "Express.js",
        "expressjs": "Express.js",
        "fast api": "FastAPI",
        "fastapi": "FastAPI",
        "spring boot": "Spring Boot",
        "spring": "Spring Boot",
        "hibernate": "Hibernate",
        # ML/AI
        "nlp": "NLP",
        "ml": "Machine Learning",
        "ai": "Artificial Intelligence",
        "artificial intelligence": "Artificial Intelligence",
        "deep learning": "Deep Learning",
        "data science": "Data Science",
        "computer vision": "Computer Vision",
        "cv": "Computer Vision",
        "reinforcement learning": "Reinforcement Learning",
        "llm": "LLM",
        "large language model": "LLM",
        "transformer": "Transformers",
        "bert": "BERT",
        "gpt": "GPT",
        "langchain": "LangChain",
        "rag": "RAG",
        # DBs
        "postgres": "PostgreSQL",
        "postgresql": "PostgreSQL",
        "mongodb": "MongoDB",
        "mongo": "MongoDB",
        "redis": "Redis",
        "elasticsearch": "Elasticsearch",
        "cassandra": "Cassandra",
        "dynamodb": "DynamoDB",
        "firebase": "Firebase",
        "supabase": "Supabase",
        "ms sql": "SQL Server",
        "sql server": "SQL Server",
        "t-sql": "SQL Server",
        "pl/sql": "Oracle DB",
        "oracle": "Oracle DB",
        "hive": "Hive",
        "sqlite": "SQLite",
        # Cloud/DevOps
        "amazon web services": "AWS",
        "google cloud": "GCP",
        "google cloud platform": "GCP",
        "microsoft azure": "Azure",
        "kubernetes": "Kubernetes",
        "k8s": "Kubernetes",
        "docker compose": "Docker",
        "ci/cd": "CI/CD",
        "github actions": "GitHub Actions",
        "jenkins": "Jenkins",
        "terraform": "Terraform",
        "ansible": "Ansible",
        "nginx": "Nginx",
        # Tools
        "scikit learn": "scikit-learn",
        "scikit-learn": "scikit-learn",
        "sklearn": "scikit-learn",
        "tail wind": "Tailwind CSS",
        "tailwind": "Tailwind CSS",
        "tailwind css": "Tailwind CSS",
        "html": "HTML",
        "css": "CSS",
        "sass": "SASS",
        "graphql": "GraphQL",
        "rest api": "REST APIs",
        "rest apis": "REST APIs",
        "restful": "REST APIs",
        "grpc": "gRPC",
        "websocket": "WebSockets",
        # Testing
        "unit test": "Unit Testing",
        "jest": "Jest",
        "pytest": "pytest",
        # Data
        "power bi": "Power BI",
        "tableau": "Tableau",
        "matplotlib": "Matplotlib",
        "seaborn": "Seaborn",
        "plotly": "Plotly",
        "excel": "Excel",
    }
)

SKILLS_DB = {
    # Languages
    "python", "java", "c", "c++", "c#", "javascript", "typescript", "go",
    "rust", "kotlin", "swift", "scala", "r", "matlab", "perl", "php", "ruby",
    # Web
    "html", "css", "react", "vue.js", "angular", "next.js", "node.js",
    "express.js", "fastapi", "django", "flask", "spring boot", "tailwind css",
    "bootstrap", "graphql", "rest apis", "websockets", "grpc",
    # DB
    "sql", "mysql",
    "sqlite",
    "oracle",
    "pl/sql",
    "t-sql",
    "ms sql",
    "sql server",
    "hive",
    "data structures",
    "algorithms",
    "oop",
    "object oriented",
    "operating systems",
    "computer networks",
    "networking",
    "javascript",
    "typescript",
    "react",
    "node.js",
    "fastapi",
    "django",
    "flask",
    "html", "css", "tailwind css", "bootstrap", "sass",
    # DevOps / Cloud
    "git", "docker", "kubernetes", "aws", "azure", "gcp", "ci/cd",
    "github actions", "jenkins", "terraform", "ansible", "nginx", "linux", "unix",
    # DB
    "mysql", "postgresql", "mongodb", "redis", "sqlite", "elasticsearch",
    "cassandra", "dynamodb", "firebase", "supabase", "sql server", "oracle db", "hive",
    # Data / ML
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras",
    "machine learning", "deep learning", "data science", "data analysis",
    "nlp", "natural language processing", "computer vision", "transformers",
    "bert", "gpt", "llm", "langchain", "rag",
    "hugging face", "spacy", "nltk", "opencv", "matplotlib", "seaborn", "plotly",
    # Tools
    "figma", "power bi", "tableau", "excel", "jira", "agile", "scrum",
    "rest apis", "graphql", "grpc", "websockets",
    # Testing
    "unit testing", "jest", "pytest",
    # Security
    "cybersecurity", "penetration testing", "owasp",
    # Misc
    "blockchain", "web3", "solidity",
}
NORMALIZED_SKILLS_DB = {value.lower() for value in SKILLS_DB}

# Also build a quick-lookup from aliases → canonical for direct extraction
ALIAS_LOOKUP = {k.lower(): v for k, v in SKILL_ALIASES.items()}


# spaCy supplements the rule-based parser with NER and sentence boundaries for resumes whose layout
# makes names, companies, and date fragments hard to recover with regexes alone.
nlp = spacy.load("en_core_web_sm")


@dataclass
class ResumeParseResult:
    name: str
    email: str
    phone: str
    summary: str
    skills: list[str]
    experience: list[dict]
    education: list[dict]
    totalYearsExperience: float
    warnings: list[str]

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "summary": self.summary,
            "skills": self.skills,
            "experience": self.experience,
            "education": self.education,
            "totalYearsExperience": self.totalYearsExperience,
            "warnings": self.warnings,
        }


def extract_text_from_upload(file_name: str, content: bytes) -> str:
    import os
    # delete=False so Windows can open the file by name after writing
    suffix = f".{file_name.lower().split('.')[-1]}" if "." in file_name else ""
    tmp = NamedTemporaryFile(delete=False, suffix=suffix)
    try:
        tmp.write(content)
        tmp.close()
        if file_name.lower().endswith(".pdf"):
            return clean_text(extract_pdf_text(tmp.name))
        if file_name.lower().endswith(".docx"):
            return clean_text(docx2txt.process(tmp.name) or "")
        raise ValueError("Only PDF and DOCX files are supported.")
    finally:
        os.unlink(tmp.name)


def clean_text(text: str) -> str:
    text = (text or "").replace("\x00", " ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


@lru_cache(maxsize=32)
def _build_doc(text: str) -> Doc:
    return nlp(text)


def _get_doc(text: str) -> Doc:
    return _build_doc(text)


def parse_resume(text: str) -> ResumeParseResult:
    warnings: list[str] = []
    # Early cleanup removes bullets/page markers so later heuristics operate on cleaner line-level data.
    lines = [
        line.strip("•-\t ").strip()
        for line in text.splitlines()
        if line.strip() and not is_noise_line(line)
    ]
    doc = _get_doc(text)
    sections = split_sections(lines)
    email = extract_email(text)
    phone = extract_phone(text)
    name = extract_name_spacy(text, doc) or extract_name(lines, email, phone)
    skills = extract_skills(text, sections.get("skills", []))
    # Projects and research are treated as experience-like blocks because HR review uses a single timeline-style view.
    experience_lines = combine_sections(sections, ("experience", "projects", "research"))
    experience = extract_experience(lines, experience_lines, doc)
    education = extract_education(lines, sections.get("education", []))
    total_years = round(sum(item["years"] for item in experience), 1)
    summary = extract_summary(sections.get("summary", []), skills, total_years, experience)

    if not name:
        warnings.append("Could not confidently infer the candidate name.")
    if not skills:
      warnings.append("No structured skills were detected from the resume text.")
    if not experience:
      warnings.append("No work-experience entries were confidently parsed.")
    if not education:
      warnings.append("No education entries were confidently parsed.")
    if not summary:
      warnings.append("Professional summary was generated as a minimal fallback.")

    return ResumeParseResult(
        name=name,
        email=email,
        phone=phone,
        summary=summary,
        skills=skills,
        experience=experience,
        education=education,
        totalYearsExperience=total_years,
        warnings=warnings,
    )


def split_sections(lines: list[str]) -> dict[str, list[str]]:
    sections: dict[str, list[str]] = {}
    current_key: str | None = None

    for line in lines:
        # Resume headings are usually short standalone lines, so we treat matching headers as section boundaries.
        normalized = normalize_header(line)
        matched = next(
            (section for section, aliases in SECTION_TITLES.items() if normalized in aliases),
            None,
        )
        if matched:
            current_key = matched
            sections.setdefault(matched, [])
            continue
        if current_key:
            sections[current_key].append(line)

    return sections


def combine_sections(sections: dict[str, list[str]], keys: Iterable[str]) -> list[str]:
    combined: list[str] = []
    for key in keys:
        combined.extend(sections.get(key, []))
    return combined


def normalize_header(line: str) -> str:
    return re.sub(r"[^a-z ]", "", line.lower()).strip()


def is_noise_line(line: str) -> bool:
    normalized = line.strip().lower()
    return bool(re.fullmatch(r"\d+\s*/\s*\d+", normalized))


def extract_email(text: str) -> str:
    match = EMAIL_RE.search(text)
    return match.group(0) if match else ""


def extract_phone(text: str) -> str:
    for match in PHONE_RE.findall(text):
        digits = re.sub(r"\D", "", match)
        if 10 <= len(digits) <= 15:
            return match.strip()
    return ""


def extract_name_spacy(text: str, doc: Doc | None = None) -> str:
    working_doc = doc or _get_doc(text)
    for entity in working_doc.ents:
        if entity.label_ != "PERSON":
            continue
        candidate = clean_inline(entity.text)
        if not is_valid_person_entity(candidate, text):
            continue
        return candidate
    return ""


def is_valid_person_entity(candidate: str, source_text: str) -> bool:
    lowered = candidate.lower()
    header_lines = [line.strip() for line in source_text.splitlines() if line.strip()]
    candidate_line_index = next(
        (index for index, line in enumerate(header_lines) if candidate.lower() in line.lower()),
        None,
    )
    if not candidate or len(candidate.split()) < 2 or len(candidate.split()) > 5:
        return False
    if candidate_line_index is None or candidate_line_index > 5:
        return False
    if re.search(r"\d", candidate):
        return False
    if EMAIL_RE.search(candidate) or PHONE_RE.search(candidate):
        return False
    if normalize_header(candidate) in {alias for aliases in SECTION_TITLES.values() for alias in aliases}:
        return False
    blocked_words = {
        "resume",
        "curriculum vitae",
        "profile",
        "summary",
        "skills",
        "experience",
        "coursework",
        "education",
        "projects",
        "research",
        "awards",
    }
    if any(word in lowered for word in blocked_words):
        return False
    if candidate.lower() not in source_text.lower():
        return False
    return True


def extract_name(lines: list[str], email: str, phone: str) -> str:
    blocked_words = {"resume", "curriculum vitae", "profile", "summary", "skills", "experience"}
    for line in lines[:8]:
        lowered = line.lower()
        if email and email.lower() in lowered:
            continue
        if phone and phone in line:
            continue
        if any(word in lowered for word in blocked_words):
            continue
        if len(line.split()) < 2 or len(line.split()) > 5:
            continue
        if re.search(r"\d", line):
            continue
        if line.isupper():
            return line.title()
        if all(part[:1].isupper() for part in line.split() if part):
            return line
    return ""


def tokenize(text: str) -> list[str]:
    return re.findall(r"[A-Za-z][A-Za-z.+#-]*", text.lower())


def get_sentences(text: str, doc: Doc | None = None) -> list[str]:
    working_doc = doc or _get_doc(text)
    return [sent.text.strip() for sent in working_doc.sents if sent.text.strip()]


def extract_entities_spacy(text: str, doc: Doc | None = None) -> dict[str, list[str]]:
    working_doc = doc or _get_doc(text)
    companies: list[str] = []
    dates: list[str] = []

    for entity in working_doc.ents:
        cleaned = clean_inline(entity.text)
        if entity.label_ == "ORG" and cleaned:
            companies.append(cleaned)
        elif entity.label_ == "DATE" and cleaned:
            dates.append(cleaned)

    return {
        "companies": dedupe_preserve_order(companies),
        "dates": dedupe_preserve_order(dates),
    }


def extract_skills(text: str, section_lines: list[str]) -> list[str]:
    sources = [text]
    if section_lines:
        sources.insert(0, " ".join(section_lines))
    source = " ".join(sources)
    tokens = [token for token in tokenize(source) if token not in STOPWORDS]
    words_only = [token for token in tokens if re.search(r"[a-z]", token)]
    ngrams = set(words_only)
    for size in (2, 3, 4):
        for index in range(len(words_only) - size + 1):
            ngrams.add(" ".join(words_only[index : index + size]))

    found: list[str] = []
    for term in ngrams:
        key = term.strip().lower()
        # Direct alias hit (highest priority)
        if key in ALIAS_LOOKUP:
            found.append(ALIAS_LOOKUP[key])
            continue
        normalized = normalize_skill(term)
        if normalized.lower() in NORMALIZED_SKILLS_DB:
            found.append(normalized)

    return sorted(dedupe_preserve_order(found))


def normalize_skill(skill: str) -> str:
    key = skill.strip().lower()
    if key in SKILL_ALIASES:
        return SKILL_ALIASES[key]
    if key in {"c", "c++", "css", "html", "sql", "aws", "gcp", "nlp", "llm"}:
        return key.upper() if key in {"css", "html", "sql", "aws", "gcp", "nlp", "llm"} else key
    if key == "python":
        return "Python"
    return " ".join(part.capitalize() for part in key.split())


def extract_experience(lines: list[str], section_lines: list[str], doc: Doc | None = None) -> list[dict]:
    source_lines = section_lines or lines
    entries = [build_experience_entry(block, doc) for block in split_experience_blocks(source_lines)]

    normalized = [entry for entry in entries if entry["title"] or entry["company"] or entry["duration"]]
    return normalized[:6]


def split_experience_blocks(lines: list[str]) -> list[list[str]]:
    blocks: list[list[str]] = []
    current: list[str] = []
    saw_bullet = False

    for index, raw_line in enumerate(lines):
        line = raw_line.strip()
        if not line or is_noise_line(line):
            continue

        is_bullet = line.startswith("○")
        next_line = lines[index + 1].strip() if index + 1 < len(lines) else ""
        # A new block typically starts after a bullet-heavy description when we hit another metadata-looking line.
        if current and saw_bullet and not is_bullet and looks_like_entry_start(line, next_line):
            blocks.append(current)
            current = [line]
            saw_bullet = False
            continue

        current.append(line)
        if is_bullet:
            saw_bullet = True

    if current:
        blocks.append(current)

    return blocks


def build_experience_entry(lines: list[str], doc: Doc | None = None) -> dict:
    lines = [line for line in lines if line]
    duration_line = next((line for line in lines if DATE_RANGE_RE.search(line)), "")
    meta_lines: list[str] = []
    description_lines: list[str] = []

    for line in lines:
        if line == duration_line:
            continue
        if line.startswith("○"):
            description_lines.append(line.lstrip("○ ").strip())
            continue
        # Once the block turns into narrative text, the remaining lines are treated as description.
        if description_lines or looks_like_sentence(line):
            description_lines.append(line)
        else:
            meta_lines.append(line)

    title = extract_experience_title(meta_lines)
    company = extract_experience_company(meta_lines, title)
    block_text = " ".join(lines)
    spacy_entities = extract_entities_spacy(block_text)
    if not company or is_role_line(company):
        company = select_company_from_spacy(spacy_entities["companies"], title)
    if not duration_line:
        duration_line = select_duration_from_spacy(spacy_entities["dates"])
    description = " ".join(description_lines)
    years = round(compute_range_years(duration_line), 1) if duration_line else 0.0

    return {
        "title": clamp_text(clean_inline(title), 80),
        "company": clamp_text(clean_inline(company), 80),
        "duration": clean_inline(duration_line),
        "years": years,
        "description": clamp_text(description or "", 220),
    }


def split_title_company(line: str) -> tuple[str, str]:
    left, right = re.split(r"\bat\b", line, maxsplit=1, flags=re.IGNORECASE)
    return left.strip(), right.strip()


def extract_education(lines: list[str], section_lines: list[str]) -> list[dict]:
    if section_lines:
        # Education usually has one compact block, so we assemble institution/degree/year from nearby lines.
        institution = next((line for line in section_lines if matches_phrase_list(line, EDU_KEYWORDS)), "")
        degree = next((line for line in section_lines if matches_phrase_list(line, DEGREE_KEYWORDS)), "")
        year_source = next(
            (line for line in section_lines if YEAR_RE.search(line) or DATE_RANGE_RE.search(line)),
            "",
        )
        year_match = YEAR_RE.search(year_source)
        entries = [
            {
                "degree": extract_degree(degree),
                "institution": extract_institution(institution),
                "year": int(year_match.group(1)) if year_match else None,
            }
        ]
    else:
        source_lines = lines
        entries: list[dict] = []
        for line in source_lines:
            if not (
                matches_phrase_list(line, DEGREE_KEYWORDS) or matches_phrase_list(line, EDU_KEYWORDS)
            ):
                continue
            year_match = YEAR_RE.search(line)
            entries.append(
                {
                    "degree": extract_degree(line),
                    "institution": extract_institution(line),
                    "year": int(year_match.group(1)) if year_match else None,
                }
            )

    deduped = []
    seen = set()
    for item in entries:
        if not item["degree"] and not item["institution"]:
            continue
        marker = (item["degree"].lower(), item["institution"].lower(), item["year"])
        if marker in seen:
            continue
        seen.add(marker)
        deduped.append(item)
    return deduped[:5]


def extract_degree(line: str) -> str:
    parts = re.split(r"[|,]", line)
    degree = next((part.strip() for part in parts if matches_phrase_list(part, DEGREE_KEYWORDS)), "")
    return clamp_text(degree or line.strip(), 120)


def extract_institution(line: str) -> str:
    parts = [part.strip() for part in re.split(r"[|,]", line)]
    institution = next(
        (part for part in parts if matches_phrase_list(part, EDU_KEYWORDS)),
        "",
    )
    return clamp_text(institution, 120)


def matches_phrase_list(text: str, phrases: list[str]) -> bool:
    normalized_text = normalize_phrase(text)
    padded_text = f" {normalized_text} "
    for phrase in phrases:
        normalized_phrase = normalize_phrase(phrase)
        if normalized_phrase and f" {normalized_phrase} " in padded_text:
            return True
    return False


def normalize_phrase(text: str) -> str:
    return re.sub(r"[^a-z0-9+#]+", " ", text.lower()).strip()


def looks_like_sentence(line: str) -> bool:
    # This heuristic helps distinguish section metadata like job title/company from free-form bullet descriptions.
    if re.search(r"[.!?]$", line):
        return True
    lowered = line.lower()
    if any(
        lowered.startswith(token)
        for token in (
            "developed",
            "developing",
            "working on",
            "built",
            "implemented",
            "performed",
            "designed",
            "ai-assisted",
        )
    ):
        return True
    words = line.split()
    return len(words) >= 9 and any(word.islower() for word in words[1:])


def looks_like_entry_start(line: str, next_line: str) -> bool:
    if not line:
        return False
    if line.lower().startswith("and "):
        return False
    if next_line and next_line[:1].islower():
        return False
    if len(line.split()) == 1 and line.lower() not in {"hcl"} and not line.isupper():
        return False
    return not looks_like_sentence(line)


def extract_experience_title(meta_lines: list[str]) -> str:
    if not meta_lines:
        return ""

    company_line = next(
        (
            line
            for line in meta_lines
            if not line.lower().startswith("github:")
            and re.search(
                r"\b(department|institute|institution|university|laborator|research|hcl|meteorological)\b",
                line.lower(),
            )
        ),
        "",
    )
    role_line = next(
        (line for line in meta_lines if is_role_line(line)),
        "",
    )
    project_line = next(
        (
            line
            for line in meta_lines
            if not line.lower().startswith("github:")
            and line != company_line
            and line != role_line
            and not matches_phrase_list(line, EDU_KEYWORDS)
            and not re.fullmatch(r"[A-Z]{2,10}", line)
            and (len(line.split()) >= 2 or has_distinctive_single_token(line))
        ),
        next((line for line in meta_lines if not line.lower().startswith("github:") and line != company_line and line != role_line), meta_lines[0]),
    )
    if project_line.lower().startswith("github:"):
        project_line = next(
            (
                line
                for line in meta_lines
                if not line.lower().startswith("github:")
                and line != company_line
                and line != role_line
            ),
            project_line,
        )

    if role_line and project_line and role_line != project_line:
        return f"{role_line} - {project_line}"
    return role_line or project_line


def extract_experience_company(meta_lines: list[str], title: str) -> str:
    for line in meta_lines:
        lowered = line.lower()
        if line == title:
            continue
        if lowered.startswith("github:"):
            continue
        if re.search(r"\b(department|institute|institution|university|laborator|research|hcl|meteorological)\b", lowered):
            return line
        if len(line.split()) <= 5 and line.isupper():
            return line

    fallback = [
        line
        for line in meta_lines
        if line != title
        and not line.lower().startswith("github:")
        and len(line.split()) <= 5
        and not is_role_line(line)
    ]
    return fallback[0] if fallback else ""


def select_company_from_spacy(companies: list[str], title: str) -> str:
    for company in companies:
        if company == title:
            continue
        if company.lower() == "github":
            continue
        if normalize_header(company) in {alias for aliases in SECTION_TITLES.values() for alias in aliases}:
            continue
        return company
    return ""


def select_duration_from_spacy(dates: list[str]) -> str:
    for candidate in dates:
        lowered = candidate.lower()
        if DATE_RANGE_RE.search(candidate):
            return clean_inline(candidate)
        if any(token in lowered for token in {"present", "current", "now"}) and YEAR_RE.search(candidate):
            return clean_inline(candidate)
        if MONTH_YEAR_RE.search(candidate):
            return clean_inline(candidate)
    return ""


def has_distinctive_single_token(line: str) -> bool:
    return len(line.split()) == 1 and any(char.isupper() for char in line[1:])


def is_role_line(line: str) -> bool:
    lowered = line.lower()
    if "opportunities for" in lowered:
        return False
    return bool(
        re.search(
            r"\b(intern|engineer|developer|analyst|assistant|manager|lead|scientist)\b",
            lowered,
        )
        or "ongoing" in lowered
        or lowered.endswith("research")
        or "research(" in lowered
    )


def extract_summary(
    section_lines: list[str], skills: list[str], total_years: float, experience: list[dict]
) -> str:
    if section_lines:
        return clamp_text(" ".join(section_lines), 320)

    focus = ", ".join(skills[:5])
    lead = experience[0]["title"] if experience else "candidate"
    if total_years > 0 and focus:
        return clamp_text(
            f"{lead} with approximately {total_years:.1f} years of experience across {focus}. "
            f"Resume highlights include hands-on work in project delivery and technical execution.",
            320,
        )
    if focus:
        return clamp_text(
            f"Candidate profile highlights experience or exposure in {focus}. "
            f"Resume content indicates practical technical work and academic preparation.",
            320,
        )
    return ""


def compute_range_years(duration_line: str) -> float:
    match = DATE_RANGE_RE.search(duration_line)
    if not match:
        return 0.0
    start = parse_date_token(match.group("start"))
    end = parse_date_token(match.group("end"))
    if not start or not end or end < start:
        return 0.0
    months = (end.year - start.year) * 12 + (end.month - start.month) + 1
    return max(0.0, months / 12)


def parse_date_token(token: str) -> date | None:
    token = token.strip().lower()
    if token in {"present", "current", "now"}:
        today = date.today()
        return date(today.year, today.month, 1)
    month_match = MONTH_YEAR_RE.match(token)
    if month_match:
        month_map = {
            "jan": 1,
            "january": 1,
            "feb": 2,
            "february": 2,
            "mar": 3,
            "march": 3,
            "apr": 4,
            "april": 4,
            "may": 5,
            "jun": 6,
            "june": 6,
            "jul": 7,
            "july": 7,
            "aug": 8,
            "august": 8,
            "sep": 9,
            "sept": 9,
            "september": 9,
            "oct": 10,
            "october": 10,
            "nov": 11,
            "november": 11,
            "dec": 12,
            "december": 12,
        }
        return date(int(month_match.group("year")), month_map[month_match.group("month")], 1)
    year_match = YEAR_RE.match(token)
    if year_match:
        return date(int(year_match.group(1)), 1, 1)
    return None


def clean_inline(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip(" |-")


def clamp_text(text: str, limit: int) -> str:
    text = clean_inline(text)
    return text if len(text) <= limit else text[: limit - 1].rstrip() + "…"


def dedupe_preserve_order(values: Iterable[str]) -> list[str]:
    seen = set()
    output = []
    for value in values:
        marker = value.lower()
        if marker in seen:
            continue
        seen.add(marker)
        output.append(value)
    return output
