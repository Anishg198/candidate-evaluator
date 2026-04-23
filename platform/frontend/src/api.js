const M1 = import.meta.env.VITE_MODULE1_URL || 'http://localhost:8000'
const M2 = import.meta.env.VITE_MODULE2_URL || 'http://localhost:8002'
const M4 = import.meta.env.VITE_MODULE4_URL || 'http://localhost:8004'
const M5 = import.meta.env.VITE_MODULE5_URL || 'http://localhost:8005'

const json = (r) => { if (!r.ok) return r.json().then((e) => Promise.reject(e.detail || 'Request failed')); return r.json() }
const post = (url, body) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json)
const get  = (url) => fetch(url).then(json)
const patch = (url) => fetch(url, { method: 'PATCH' }).then(json)

// ── Module 1 — CV ────────────────────────────────────────────────────────
export const parseResume = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return fetch(`${M1}/parse-resume`, { method: 'POST', body: fd }).then(json)
}

// ── Module 2 — Written Test ──────────────────────────────────────────────
export const generateTest = (body) => {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 180_000) // 3-min timeout
  return fetch(`${M2}/tests/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: ctrl.signal,
  }).then(json).finally(() => clearTimeout(timer))
}
export const getTest = (id) => get(`${M2}/tests/${id}`)
export const submitTest = (id, body) => post(`${M2}/tests/${id}/submit`, body)
export const getM2AdminResults = () => get(`${M2}/module2/admin/results`).catch(() => [])

// ── Module 3 — AI Interview ──────────────────────────────────────────────
const M3 = import.meta.env.VITE_MODULE3_URL || 'http://localhost:8003'
export const startInterview = (body) => post(`${M3}/interview/start`, body)
export const submitInterviewAnswer = (id, body) => post(`${M3}/interview/${id}/answer`, body)
export const finishInterviewEarly = (id) => post(`${M3}/interview/${id}/finish`, {})
export const getInterviewResult = (id) => get(`${M3}/interview/${id}/result`)
export const getM3AdminResults = () => get(`${M3}/module3/admin/results`).catch(() => [])
export const transcribeAudio = async (blob) => {
  const form = new FormData()
  form.append('file', blob, 'audio.webm')
  const res = await fetch(`${M3}/transcribe`, { method: 'POST', body: form })
  if (!res.ok) throw new Error('Transcription failed')
  return res.json()
}

// ── Module 4 — Coding ────────────────────────────────────────────────────
export const startCodingSession = (body) => post(`${M4}/session/start`, body)
export const getProblems = () => get(`${M4}/problems`)
export const getProblem = (id) => get(`${M4}/problems/${id}`)
export const runCode = (problemId, body) => post(`${M4}/problems/${problemId}/run`, body)
export const submitCode = (problemId, body) => post(`${M4}/problems/${problemId}/submit`, body)
export const getM4AdminResults = () => get(`${M4}/module4/admin/results`).catch(() => [])

// ── Module 5 — Jobs / Applications / Reports ─────────────────────────────
export const listJobs = () => get(`${M5}/jobs`)
export const getJob = (id) => get(`${M5}/jobs/${id}`)
export const createJob = (body) => post(`${M5}/jobs`, body)
export const toggleJob = (id) => patch(`${M5}/jobs/${id}`)
export const applyToJob = (jobId, body) => post(`${M5}/jobs/${jobId}/apply`, body)
export const getApplication = (candidateId) => get(`${M5}/applications/${candidateId}`)
export const getApplicationStatus = (candidateId) => get(`${M5}/applications/${candidateId}/status`)
export const setHRDecision = (candidateId, body) => fetch(`${M5}/applications/${candidateId}/decision`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json)
export const listApplications = () => get(`${M5}/module5/admin/applications`).catch(() => [])
export const deleteApplication = (candidateId) => fetch(`${M5}/applications/${candidateId}`, { method: 'DELETE' }).then(json)
export const generateFinalReport = (body) => post(`${M5}/module5/report`, body)
export const getFinalReport = (candidateId) => get(`${M5}/module5/report/${candidateId}`)
export const getAllFinalReports = () => get(`${M5}/module5/admin/reports`).catch(() => [])
