# NLP Pipeline Overview

This project uses a hybrid resume parsing pipeline:

- rule-based parsing for deterministic fields
- spaCy for lightweight NLP assistance
- PDF/DOCX text extraction before any NLP runs

The goal is to keep the parser stable and predictable while improving weak spots such as person-name detection and some organization/date extraction.

## 1. Entry Point

The backend API endpoint is in `backend/app/main.py`.

Flow:

1. The frontend uploads a resume file to `POST /parse-resume`.
2. The backend validates that the file is a `.pdf` or `.docx`.
3. The file content is converted into plain text with `extract_text_from_upload(...)`.
4. The extracted text is passed into `parse_resume(text)`.
5. The backend returns:
   - structured parsed fields
   - `rawText`
   - uploaded file name

So the real NLP/parser logic lives in `backend/app/parser.py`.

## 2. Text Extraction Layer

Before parsing starts, the file is converted into plain text:

- PDFs are read with `pdfminer.six`
- DOCX files are read with `docx2txt`

This happens in:

- `extract_text_from_upload(file_name, content)`

After extraction, `clean_text(...)` normalizes spacing and collapses repeated blank lines.

This means the parser itself is format-agnostic. It works on text, not directly on binary resume files.

## 3. High-Level Parsing Flow

The main orchestration happens inside:

- `parse_resume(text: str)`

This function does the following:

1. cleans and splits the raw text into lines
2. removes obvious noise such as page counters like `1/2`
3. builds a cached spaCy `Doc`
4. splits the resume into sections such as:
   - `education`
   - `experience`
   - `projects`
   - `research`
   - `skills`
   - `summary`
5. extracts each major field
6. computes total years of experience
7. generates parser warnings if important fields are missing

The final return type is `ResumeParseResult`, which contains:

- `name`
- `email`
- `phone`
- `summary`
- `skills`
- `experience`
- `education`
- `totalYearsExperience`
- `warnings`

## 4. What Is Rule-Based vs NLP-Based

### Rule-based parts

These are still the main source of truth:

- `extract_email(...)`
  - regex based
- `extract_phone(...)`
  - regex based
- `extract_skills(...)`
  - keyword and n-gram matching against `SKILLS_DB`
- section splitting
  - done with normalized section headers and heuristics
- education parsing
  - keyword matching using degree/institution terms
- most experience block construction
  - line grouping + metadata heuristics

These were kept because they are deterministic and low-risk.

### NLP-based parts

spaCy is used as a targeted enhancement layer:

- `extract_name_spacy(...)`
  - uses spaCy NER and looks for `PERSON`
- `get_sentences(...)`
  - uses spaCy sentence segmentation via `doc.sents`
- `extract_entities_spacy(...)`
  - uses spaCy NER to collect:
    - `ORG`
    - `DATE`

Important: spaCy does not replace the parser. It only improves places where plain regex/heuristics are weaker.

## 5. spaCy Integration

The parser loads:

- `spacy`
- model: `en_core_web_sm`

This is initialized once globally:

- `nlp = spacy.load("en_core_web_sm")`

To avoid reprocessing the same resume text repeatedly, the code caches spaCy docs:

- `_build_doc(text)`
- `_get_doc(text)`

`parse_resume(...)` creates one cached `Doc` for the full resume and reuses it for:

- name extraction
- sentence segmentation
- entity extraction

This keeps performance reasonable and avoids repeated full NLP passes on the same input.

## 6. Name Extraction Logic

Name extraction is now hybrid.

The flow is:

1. try `extract_name_spacy(text, doc)`
2. if spaCy does not find a valid person name, fall back to:
   - `extract_name(lines, email, phone)`

### spaCy name extraction

`extract_name_spacy(...)`:

- scans named entities
- accepts the first `PERSON` entity that passes validation

Validation is important because resume text often contains misleading title-cased phrases.

The validation rejects entities that:

- contain digits
- look like email/phone fragments
- match section headers
- contain blocked words like `skills`, `education`, `projects`
- appear too far down the resume instead of near the header

### Fallback heuristic extraction

If spaCy does not produce a safe person name, the older heuristic extractor is still used.

This keeps the system robust even when NER is imperfect.

## 7. Section Detection

Section detection is handled by:

- `split_sections(lines)`

It uses `SECTION_TITLES` and `normalize_header(...)` to map headings into known parser sections.

Examples:

- `Experience`
- `Projects`
- `Research Experience`
- `Education`
- `Skills`

This matters because later parsing depends on section-aware logic instead of scanning the entire resume blindly.

## 8. Skills Extraction

Skills are still extracted entirely through custom logic.

Relevant pieces:

- `SKILLS_DB`
- `SKILL_ALIASES`
- `normalize_skill(...)`
- `extract_skills(...)`

How it works:

1. choose the `Skills` section if present, otherwise fall back to the whole resume text
2. tokenize the text
3. generate 1-gram, 2-gram, and 3-gram candidates
4. normalize those candidates
5. match against `SKILLS_DB`
6. deduplicate and return a sorted list

This means skills are not generated by spaCy NER. They come from a controlled database of known skill terms.

## 9. Experience Parsing

Experience parsing is still primarily heuristic-based, but now enhanced with spaCy.

Main functions:

- `extract_experience(...)`
- `split_experience_blocks(...)`
- `build_experience_entry(...)`
- `extract_experience_title(...)`
- `extract_experience_company(...)`

### Step 1: block splitting

`split_experience_blocks(...)` groups resume lines into experience-like blocks.

It uses:

- bullet detection
- line shape
- sentence heuristics
- section-aware grouping

This is why `Projects` and `Research` can also feed into the same experience-style output.

### Step 2: metadata vs description

Inside each block, the parser tries to separate:

- metadata lines
  - role
  - company
  - project title
  - date line
- description lines
  - bullet points
  - narrative text

### Step 3: rule-based extraction first

The parser first tries to derive:

- title
- company
- duration

using the original heuristics.

### Step 4: spaCy enhancement

If the rule-based path is weak, the parser uses:

- `extract_entities_spacy(block_text)`

to recover:

- `ORG` entities for company names
- `DATE` entities for durations

This enhancement is fallback-first:

- if the old logic already found a good value, it is preserved
- spaCy only helps fill missing or weak values

That design reduces regression risk.

## 10. Education Parsing

Education parsing remains rule-based.

Main functions:

- `extract_education(...)`
- `extract_degree(...)`
- `extract_institution(...)`

It uses:

- `DEGREE_KEYWORDS`
- `EDU_KEYWORDS`
- date/year matching

The parser tries to recover:

- degree
- institution
- graduation year

This logic is deliberately simple and predictable.

## 11. Summary Generation

Summary generation is handled by:

- `extract_summary(...)`

Behavior:

- if the resume has an explicit summary/profile section, the parser uses it
- otherwise it generates a short fallback summary using:
  - leading experience title
  - detected skills
  - computed years of experience

This is not generative AI. It is templated text assembly from parsed fields.

## 12. Experience Duration Calculation

Experience years are derived from parsed date ranges using:

- `compute_range_years(...)`
- `parse_date_token(...)`

Supported duration patterns include:

- `Jan 2022 - Present`
- `2021 - 2023`

Then `parse_resume(...)` sums all parsed experience years into:

- `totalYearsExperience`

## 13. Warning System

The parser emits warnings when important structured fields are missing.

Examples:

- candidate name not confidently inferred
- no structured skills detected
- no experience parsed
- no education parsed
- summary had to fall back

These warnings are returned to the frontend and shown on the review screen so the candidate can manually sanity-check the extracted output.

## 14. Current Dependencies Used by the NLP Pipeline

Backend dependencies relevant to NLP/parsing:

- `pdfminer.six`
  - PDF text extraction
- `docx2txt`
  - DOCX text extraction
- `spacy`
  - NER and sentence segmentation
- `en_core_web_sm`
  - spaCy English model

The parser is not currently using:

- transformers
- embeddings
- LLM APIs
- OCR

So this is still a lightweight backend parser, not a deep-learning-heavy pipeline.

## 15. Practical Design Philosophy

The current system follows a hybrid design:

- use rules where structure is clear and predictable
- use spaCy where layout variation makes rules brittle
- keep output stable
- avoid expensive NLP passes

This is why the parser is relatively fast, easy to debug, and still more robust than a purely regex-based implementation.

## 16. Current Limitations

Even with spaCy, the parser is still heuristic-heavy.

Known limitations include:

- PDF extraction artifacts can distort line order
- some `ORG` detections may be noisy in project sections
- experience duration parsing still depends heavily on date text quality
- education and experience are not using full semantic understanding
- skills are limited to the curated skills database

So the current pipeline is best described as:

- structured resume parser
- rule-first
- spaCy-assisted
- deterministic output schema

