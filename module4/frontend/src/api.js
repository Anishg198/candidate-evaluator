const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8004'

export const getProblems = () =>
  fetch(`${BASE}/problems`).then((r) => r.json())

export const getProblem = (id) =>
  fetch(`${BASE}/problems/${id}`).then((r) => r.json())

export const submitCode = (problemId, body) =>
  fetch(`${BASE}/problems/${problemId}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())
