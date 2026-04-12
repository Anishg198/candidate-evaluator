import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProblems } from '../api'
import { Code2, ChevronRight, Loader2, Terminal } from 'lucide-react'

const DIFF_STYLES = {
  easy: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  medium: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  hard: 'bg-red-500/15 border-red-500/30 text-red-400',
}

export default function ProblemsPage() {
  const navigate = useNavigate()
  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [candidateId, setCandidateId] = useState(() => localStorage.getItem('hcl_candidate_id') || '')

  useEffect(() => {
    getProblems()
      .then(setProblems)
      .catch(() => setProblems([]))
      .finally(() => setLoading(false))
  }, [])

  const saveCandidateId = (val) => {
    setCandidateId(val)
    localStorage.setItem('hcl_candidate_id', val)
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
            <Terminal className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Coding Assessment</h1>
          <p className="text-slate-400 mt-2">Self-hosted execution · No internet required · HCL Evaluation Platform</p>
        </div>

        {/* Candidate ID */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Your Candidate ID</label>
          <input
            type="text"
            value={candidateId}
            onChange={(e) => saveCandidateId(e.target.value)}
            placeholder="e.g. CAND-2024-001"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>

        {/* Language badges */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['Python 3', 'JavaScript', 'Java', 'C++'].map((lang) => (
            <span key={lang} className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 font-mono">
              {lang}
            </span>
          ))}
        </div>

        {/* Problem list */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : problems.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Code2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No problems found. Is the backend running?</p>
          </div>
        ) : (
          <div className="space-y-3">
            {problems.map((p, i) => (
              <button
                key={p.id}
                onClick={() => navigate(`/problems/${p.id}`)}
                className="w-full flex items-center gap-4 bg-white/5 hover:bg-white/[0.08] backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl px-6 py-5 text-left transition-all duration-150 group cursor-pointer"
              >
                <span className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-mono font-semibold group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-100 font-semibold">{p.title}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{p.visible_test_cases_count} visible · {p.total_test_cases} total test cases</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-lg border capitalize ${DIFF_STYLES[p.difficulty] || ''}`}>
                    {p.difficulty}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
