import { create } from 'zustand'

const STORAGE_KEYS = {
  role: 'cvm_role',
  candidates: 'cvm_candidates',
  jobs: 'cvm_jobs',
  draftCandidate: 'cvm_candidate_draft'
}

// Seed data keeps the HR dashboard usable even before any jobs are created manually.
const seedJobs = () => [
  {
    id: crypto.randomUUID(),
    title: 'Full Stack Developer Intern',
    description:
      'Build and maintain web application features across the React frontend and FastAPI backend.',
    requirements: ['React', 'JavaScript', 'Python', 'REST APIs', 'Git'],
    niceToHave: ['TypeScript', 'PostgreSQL', 'Docker'],
    minExperience: 0,
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: crypto.randomUUID(),
    title: 'Machine Learning Intern',
    description:
      'Develop and evaluate NLP and ML models for the candidate evaluation pipeline.',
    requirements: ['Python', 'scikit-learn', 'Pandas', 'NLP', 'Machine Learning'],
    niceToHave: ['TensorFlow', 'spaCy', 'Hugging Face'],
    minExperience: 0,
    createdAt: new Date().toISOString(),
    isActive: true
  }
]

// Local storage can be user-edited or stale, so every read goes through a safe JSON parse.
const safeParse = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const readJobs = () => {
  const parsed = safeParse(localStorage.getItem(STORAGE_KEYS.jobs), [])
  if (parsed.length > 0) return parsed
  const jobs = seedJobs()
  localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs))
  return jobs
}

const initialState = () => ({
  role: localStorage.getItem(STORAGE_KEYS.role) || '',
  candidates: safeParse(localStorage.getItem(STORAGE_KEYS.candidates), []),
  jobs: readJobs(),
  draftCandidate: safeParse(localStorage.getItem(STORAGE_KEYS.draftCandidate), null),
  toasts: []
})

const persist = (key, value) => {
  if (value === null || value === undefined || value === '') {
    localStorage.removeItem(key)
    return
  }
  if (typeof value === 'string') {
    localStorage.setItem(key, value)
    return
  }
  localStorage.setItem(key, JSON.stringify(value))
}

// The store is the single source of truth for role, jobs, candidates, and transient UI state.
export const useAppStore = create((set, get) => ({
  ...initialState(),

  addCandidate: (candidate) =>
    set((state) => {
      const candidates = [...state.candidates, candidate]
      persist(STORAGE_KEYS.candidates, candidates)
      return { candidates }
    }),

  updateCandidate: (id, updates) =>
    set((state) => {
      const candidates = state.candidates.map((candidate) =>
        candidate.id === id ? { ...candidate, ...updates } : candidate
      )
      persist(STORAGE_KEYS.candidates, candidates)
      return { candidates }
    }),

  removeCandidate: (id) =>
    set((state) => {
      const candidates = state.candidates.filter((candidate) => candidate.id !== id)
      persist(STORAGE_KEYS.candidates, candidates)
      return { candidates }
    }),

  getCandidates: () => get().candidates,

  getCandidateById: (id) => get().candidates.find((candidate) => candidate.id === id),

  setDraftCandidate: (candidate) =>
    set(() => {
      persist(STORAGE_KEYS.draftCandidate, candidate)
      return { draftCandidate: candidate }
    }),

  clearDraftCandidate: () =>
    set(() => {
      localStorage.removeItem(STORAGE_KEYS.draftCandidate)
      return { draftCandidate: null }
    }),

  addJob: (job) =>
    set((state) => {
      const jobs = [...state.jobs, job]
      persist(STORAGE_KEYS.jobs, jobs)
      return { jobs }
    }),

  getJobs: () => get().jobs,

  getJobById: (id) => get().jobs.find((job) => job.id === id),

  addMatchResult: (candidateId, matchResult) =>
    set((state) => {
      const candidates = state.candidates.map((candidate) => {
        if (candidate.id !== candidateId) return candidate
        const existing = candidate.matchResults || []
        // Re-score in place for a job if it already exists, otherwise append a fresh match result.
        const nextResults = existing.some((item) => item.jobId === matchResult.jobId)
          ? existing.map((item) => (item.jobId === matchResult.jobId ? matchResult : item))
          : [...existing, matchResult]
        return { ...candidate, matchResults: nextResults }
      })
      persist(STORAGE_KEYS.candidates, candidates)
      return { candidates }
    }),

  setRole: (role) =>
    set(() => {
      persist(STORAGE_KEYS.role, role)
      return { role }
    }),

  getRole: () => get().role,

  pushToast: (toast) =>
    set((state) => {
      const nextToast = {
        id: crypto.randomUUID(),
        variant: 'success',
        ...toast
      }
      return { toasts: [...state.toasts, nextToast].slice(-3) }
    }),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    })),

  clearRole: () =>
    set(() => {
      localStorage.removeItem(STORAGE_KEYS.role)
      return { role: '' }
    }),

  clearAllData: () =>
    set(() => {
      Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
      localStorage.removeItem('cvm_groq_api_key')
      localStorage.removeItem('cvm_grok_api_key')
      const jobs = seedJobs()
      localStorage.setItem(STORAGE_KEYS.jobs, JSON.stringify(jobs))
      return {
        role: '',
        candidates: [],
        jobs,
        draftCandidate: null,
        toasts: []
      }
    })
}))

export { STORAGE_KEYS }
