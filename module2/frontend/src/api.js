const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8002'

export const generateTest = (body) =>
  fetch(`${BASE}/tests/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())

export const getTest = (id) =>
  fetch(`${BASE}/tests/${id}`).then((r) => r.json())

export const submitTest = (id, body) =>
  fetch(`${BASE}/tests/${id}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json())

export const getResult = (id) =>
  fetch(`${BASE}/tests/${id}/result`).then((r) => {
    if (!r.ok) throw new Error('not found')
    return r.json()
  })
