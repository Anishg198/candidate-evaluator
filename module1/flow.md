# Project Flow

This file gives a point-by-point flow of the entire project so it is easy to refer to and explain verbally.

## 1. What the project does

1. This project is an AI-assisted candidate evaluation platform.
2. It has two main sides:
   - candidate side
   - HR side
3. The candidate uploads resume data and submits an application.
4. The system parses the resume and structures the information.
5. The HR side then views candidates ranked against job roles.

## 2. Main tech flow

1. Frontend is built with React.
2. State is managed with Zustand.
3. Backend is built with FastAPI.
4. Resume parsing happens in Python.
5. Parsing is hybrid:
   - rule-based logic
   - spaCy-assisted NLP

## 3. App entry flow

1. The app starts in `src/App.jsx`.
2. `App.jsx` defines all routes.
3. It also applies role-based access control using the `Guard` component.
4. There are two main role paths:
   - `CANDIDATE`
   - `HR`
5. The navbar is shown for the internal app pages and hidden during candidate onboarding screens.

## 4. Landing page flow

1. The first page is `src/pages/Login.jsx`.
2. This page acts as the candidate landing page.
3. The candidate sees:
   - the portal heading
   - a `Start Application` button
   - an `HR Sign In` button
4. If the candidate clicks `Start Application`:
   - role is set to `CANDIDATE`
   - app navigates to `/register`
5. If HR clicks `HR Sign In`:
   - app navigates to `/hr`

## 5. Candidate registration flow

1. The candidate registration page is `src/pages/CandidateRegister.jsx`.
2. Candidate enters:
   - name
   - email
   - phone
3. Frontend validates:
   - name is required
   - email is required
   - email format must be valid
4. If valid:
   - a draft candidate is created in Zustand store
   - candidate is navigated to `/upload`
5. At this point, this is not yet a final submission.
6. It is only a draft profile used for the next step.

## 6. Candidate upload and parsing flow

1. The upload page is `src/pages/CandidateUpload.jsx`.
2. Candidate uploads a resume file.
3. Supported file types are:
   - PDF
   - DOCX
4. When the candidate clicks `Analyze Resume`:
   - frontend calls `parseResume(file)` from `src/services/resumeApi.js`
   - request is sent to backend endpoint `/api/parse-resume`
5. While parsing is happening:
   - a progress UI is shown
   - elapsed time is displayed

## 7. Backend API flow

1. Backend API entry is `backend/app/main.py`.
2. The route is:
   - `POST /parse-resume`
3. Backend first validates the file type.
4. Then it reads the uploaded file bytes.
5. Then it calls:
   - `extract_text_from_upload(...)`
   - `parse_resume(raw_text)`
6. Finally it returns:
   - parsed structured data
   - raw extracted text
   - uploaded file name

## 8. Resume text extraction flow

1. File extraction logic is in `backend/app/parser.py`.
2. `extract_text_from_upload(...)` converts files into text.
3. For PDF:
   - it uses `pdfminer.six`
4. For DOCX:
   - it uses `docx2txt`
5. After extraction, `clean_text(...)` normalizes spacing and blank lines.
6. From here onward, the parser only works with plain text.

## 9. NLP parsing flow

1. Main parser function is:
   - `parse_resume(text: str)`
2. This function orchestrates the whole NLP pipeline.
3. It first:
   - splits text into lines
   - removes noise like page counters
   - builds a cached spaCy document
4. It then extracts:
   - name
   - email
   - phone
   - skills
   - experience
   - education
   - summary
   - warnings

## 10. Name extraction flow

1. Name extraction is hybrid.
2. First the parser tries:
   - `extract_name_spacy(...)`
3. This uses spaCy NER and looks for `PERSON`.
4. It validates the detected name so bad matches are rejected.
5. If spaCy does not return a good result, parser falls back to:
   - `extract_name(...)`
6. `extract_name(...)` is the older heuristic-based method.

## 11. Email and phone extraction flow

1. Email extraction uses regex.
2. Phone extraction also uses regex.
3. These are intentionally kept rule-based because they are reliable and deterministic.
4. No spaCy is used for these fields.

## 12. Skills extraction flow

1. Skills extraction is still custom and rule-based.
2. It uses:
   - `SKILLS_DB`
   - `SKILL_ALIASES`
   - `normalize_skill(...)`
3. The parser prefers to scan the `Skills` section if available.
4. Otherwise it falls back to scanning the full resume text.
5. It builds 1-gram, 2-gram, and 3-gram candidates.
6. Then it normalizes and matches them against the known skill database.
7. This keeps skills extraction controlled and predictable.

## 13. Experience parsing flow

1. Experience parsing is mostly heuristic-based but enhanced by spaCy.
2. The parser combines:
   - `Experience`
   - `Projects`
   - `Research`
   into one experience-style parsing flow
3. It splits those into blocks using:
   - line patterns
   - bullet patterns
   - metadata vs sentence heuristics
4. For each block it tries to extract:
   - title
   - company
   - duration
   - description
5. Rule-based logic is still primary.
6. spaCy is used as backup for:
   - `ORG`
   - `DATE`
7. If the heuristic logic is weak, spaCy helps fill missing company/date information.

## 14. Education parsing flow

1. Education parsing remains rule-based.
2. It uses:
   - education keywords
   - degree keywords
   - year extraction
3. It tries to derive:
   - institution
   - degree
   - year
4. This is intentionally simple so the output remains stable.

## 15. Summary generation flow

1. If the resume already has a summary section, parser uses it.
2. If not, parser generates a fallback summary.
3. That fallback summary is built from:
   - top experience title
   - skills
   - total years of experience
4. This is template-based generation, not LLM-based generation.

## 16. Warning generation flow

1. Parser creates warnings when major fields are missing.
2. Example warnings include:
   - name could not be inferred
   - no skills found
   - no experience parsed
   - no education parsed
   - summary had to fall back
3. These warnings are returned to the frontend for review.

## 17. Candidate review and submission flow

1. After parsing, `CandidateUpload.jsx` stores the extracted data in local page state.
2. Candidate sees a review page with:
   - summary
   - skills
   - work experience
   - education
   - warnings
3. If everything looks good, candidate clicks `Submit Application`.
4. On submit:
   - final candidate object is created
   - candidate is saved to Zustand store
   - candidate is matched against all active jobs
   - match results are stored
   - draft candidate is cleared
   - app navigates to confirmation page

## 18. Candidate scoring flow

1. Candidate-job matching logic is in `src/services/matcher.js`.
2. It compares candidate skills with job requirements.
3. It calculates:
   - required skill score
   - preferred skill bonus
   - experience score
   - overall score
4. It also returns:
   - matched skills
   - missing skills
   - recommendation label
5. Recommendation categories are:
   - `STRONG_MATCH`
   - `GOOD_MATCH`
   - `PARTIAL_MATCH`
   - `WEAK_MATCH`

## 19. State management flow

1. Shared app state is managed in `src/store/appStore.js`.
2. Zustand store holds:
   - current role
   - candidates
   - jobs
   - draft candidate
   - toast notifications
3. Local storage is used for persistence.
4. This means the app can retain state across refreshes.
5. Seed jobs are added automatically if no jobs exist yet.

## 20. HR entry flow

1. HR entry page is `src/pages/HRPortal.jsx`.
2. HR clicks continue to enter the HR workspace.
3. Role is set to `HR`.
4. App navigates to `/dashboard`.

## 21. HR dashboard flow

1. Main HR screen is `src/pages/HRDashboard.jsx`.
2. Left side shows open job positions.
3. HR selects a job.
4. The dashboard then:
   - finds all candidates with match results for that job
   - sorts them by overall score
   - displays ranked candidate cards
5. HR can then:
   - view a candidate profile
   - remove a candidate
   - post a new job

## 22. Candidate profile flow for HR

1. Candidate profile page is `src/pages/CandidateProfile.jsx`.
2. HR can inspect:
   - parsed summary
   - parsed skills
   - parsed experience
   - parsed education
   - match score
   - matched skills
   - missing skills
3. This is the detailed review page after dashboard ranking.

## 23. Job creation flow

1. New jobs are created from `src/pages/JobCreate.jsx`.
2. HR enters:
   - role title
   - description
   - required skills
   - preferred skills
   - minimum experience
3. After submission:
   - job is added to store
   - it becomes available for matching
   - dashboard can immediately rank candidates against it

## 24. Role switching flow

1. Internal pages show a header with current role.
2. Top-right button currently says:
   - `Back to Candidate Page`
3. Clicking it:
   - clears the current role
   - navigates back to `/`

## 25. End-to-end summary flow

1. Candidate opens landing page.
2. Candidate starts application.
3. Candidate enters personal details.
4. Candidate uploads resume.
5. Backend extracts text from PDF/DOCX.
6. Parser converts text into structured candidate information.
7. Candidate reviews parsed output.
8. Candidate submits application.
9. App scores candidate against active jobs.
10. HR opens dashboard.
11. HR selects a job.
12. HR sees ranked candidates.
13. HR opens detailed candidate profile.
14. HR reviews skills, experience, education, and match quality.

## 26. One-line speaking version

If you want to explain the full project quickly, you can say:

"This project is a candidate evaluation platform where applicants upload resumes, the backend parses them using a hybrid rule-based and spaCy-assisted NLP pipeline, the system structures candidate data, scores candidates against job requirements, and then presents ranked applicants to HR through a dashboard."

