# User Guide — CandEvalAI

---

## HR Guide

### 1. Access the HR Portal

1. Open `http://localhost:5175/hr`
2. Enter password: `HCL@2024`

---

### 2. Create a Job Posting

1. Click **Create Job** in the HR dashboard
2. Fill in:
   - **Job Title** — e.g. "Backend Engineer"
   - **Company** — defaults to HCL Technologies
   - **Description** — role summary
   - **Required Skills** — add skills one by one (e.g. Python, SQL, React); these drive the written test questions
   - **Difficulty** — Easy / Medium / Hard
   - **Number of Questions** — how many questions in the written test
3. Click **Create** — job is now live and visible to candidates on the home page

> Without at least one active job, candidates cannot apply.

---

### 3. Monitor Applications

From the HR dashboard you can see every candidate who has applied, with:

| Column | What it shows |
|--------|---------------|
| Name / Email | Candidate details from CV upload |
| Pipeline Stage | Which stage the candidate is currently at |
| CV Score | Parsed from uploaded resume |
| Written Score | % score on the written test |
| Interview Score | AI-graded % from the interview |
| Behavior Score | Proctoring score from camera monitoring |
| Coding Score | Points from coding problems |
| Final Score | Weighted composite of all above |
| Recommendation | Strong Hire / Hire / Maybe / Borderline / Not Recommended |
| Time Taken | How long each test took (Written / Interview / Coding) |
| HR Decision | Your decision: Pending / Approve / Reject |

---

### 4. View a Candidate Report

Click any candidate row to open the full AI-generated report:

- **Scores breakdown** — all 5 dimensions with visual indicators
- **Strengths** — bullet points auto-generated from performance
- **Concerns** — areas where the candidate underperformed
- **Summary** — narrative paragraph for quick review
- **Per-test data** — question-by-question answers and scores for written and interview

---

### 5. Set HR Decision

Inside the candidate report:

1. Select **Approve** or **Reject** from the dropdown
2. Optionally add a note
3. Click **Save Decision**

Decision is stored and visible in the dashboard.

---

---

## Candidate Guide

### 1. Apply for a Job

1. Open `http://localhost:5175`
2. Browse open job listings
3. Click **Apply** on the role you want
4. Fill in:
   - **Full Name**
   - **Email Address**
   - **CV / Resume** — upload as PDF
5. Click **Submit Application**
6. You will receive a **Candidate ID** (e.g. `CAND-AB12XY`) — **save this**, you need it to resume later

---

### 2. Resume the Pipeline

If you close the browser or return later:

1. Go to `http://localhost:5175`
2. Enter your **Candidate ID** in the "Resume Application" field
3. Click **Continue** — you will be taken to where you left off

---

### 3. Written Test

- **Format:** Multiple choice questions + short answer questions
- **Time limit:** 30 minutes (timer shown top-right, turns red under 5 minutes)
- **Auto-submits** when timer reaches zero
- Questions are tailored to the skills listed in the job posting
- You can review and change answers before submitting
- Click **Submit Test** when done

---

### 4. AI Interview

- **Format:** 5 text-based questions (mix of technical and behavioural)
- **Time limit:** 30 minutes (auto-submits on expiry)
- Read each question carefully and type your answer in the text box
- Click **Next** to move to the next question
- You can finish early by clicking **Finish Interview**
- Answers are AI-graded after submission

> Camera is active during the interview for behaviour monitoring. Make sure you are in a well-lit environment with your face visible.

---

### 5. Coding Test

- **Format:** Algorithmic programming problems
- **Time limit:** 45 minutes (auto-submits on expiry)
- **Languages supported:** Python, JavaScript, Java, C++

**Key features:**

| Feature | How to use |
|---------|-----------|
| Switch problems | Click any problem in the left panel — your code is auto-saved |
| Auto-save | Code saves automatically 1 second after you stop typing — look for "Saved at HH:MM:SS" |
| Test against sample inputs | Click **Run** — executes against the provided test cases |
| Test against custom input | Click the **Custom Input** tab, enter your own stdin, click **Run Custom** |
| Submit | Click **Submit** to lock in your solution for that problem |
| Finish early | Click **Finish & Submit All** to end the test before time runs out |

> You do not need to submit every problem — partial credit is given for problems that pass some test cases.

---

### 6. Pipeline Complete

After the coding test, your evaluation is complete. The HR team will review your report and contact you with a decision.

You can view your result summary at `http://localhost:5175` using your Candidate ID.
