const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8004'

export const getProblems = () =>
  fetch(`${BASE}/problems`).then((r) => r.json())

export const getProblem = (id) =>
  fetch(`${BASE}/problems/${id}`).then((r) => r.json())

export const runCode = (problemId, body) =>
  fetch(`${BASE}/problems/${problemId}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())

export const submitCode = (problemId, body) =>
  fetch(`${BASE}/problems/${problemId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())

export const getReport = (candidateId) =>
  fetch(`${BASE}/module4/result/${candidateId}`).then((r) => {
    if (!r.ok) throw new Error('not found')
    return r.json()
  })

export const getAllResults = () =>
  fetch(`${BASE}/module4/admin/results`).then((r) => r.json())

export const startSession = (body) =>
  fetch(`${BASE}/session/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => {
    if (!r.ok) throw new Error('session start failed')
    return r.json()
  })

export const getSession = (candidateId) =>
  fetch(`${BASE}/session/${candidateId}`).then((r) => {
    if (!r.ok) throw new Error('no session')
    return r.json()
  })
