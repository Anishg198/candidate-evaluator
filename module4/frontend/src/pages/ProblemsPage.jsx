import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProblems } from '../api'
import { Code2, ChevronRight, Loader2, CheckCircle2, Circle, Send, Info } from 'lucide-react'

const DIFF_STYLES = {
  easy: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  medium: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  hard: 'bg-red-500/15 border-red-500/30 text-red-400',
}

function getCompletions(candidateId) {
  try {
    return JSON.parse(localStorage.getItem(`hcl_completions_${candidateId}`) || '{}')
  } catch { return {} }
}

function getSessionProblemIds(candidateId) {
  try {
    return JSON.parse(localStorage.getItem(`hcl_session_problems_${candidateId}`) || 'null')
  } catch { return null }
}

export default function ProblemsPage() {
  const navigate = useNavigate()
  const candidateId = localStorage.getItem('hcl_candidate_id') || ''
  const candidateName = localStorage.getItem('hcl_candidate_name') || ''

  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [completions, setCompletions] = useState(() => getCompletions(candidateId))

  // Session-assigned problem IDs (only show these 3 to this candidate)
  const sessionProblemIds = getSessionProblemIds(candidateId)

  // Redirect to start if no candidate info, or to report if already submitted
  useEffect(() => {
    if (!candidateId) { navigate('/'); return }
    if (localStorage.getItem(`hcl_submitted_${candidateId}`) === 'true') {
      navigate('/report'); return
    }
    getProblems()
      .then((all) => {
        // Filter to only the session-assigned problems if we have session data
        if (sessionProblemIds && sessionProblemIds.length > 0) {
          // Preserve the order from the session
          const ordered = sessionProblemIds
            .map((id) => all.find((p) => p.id === id))
            .filter(Boolean)
          setProblems(ordered)
        } else {
          setProblems(all)
        }
      })
      .catch(() => setProblems([]))
      .finally(() => setLoading(false))
  }, [])

  // Refresh completions when tab becomes visible (returning from coding page)
  useEffect(() => {
    const refresh = () => setCompletions(getCompletions(candidateId))
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [candidateId])

  const attempted = Object.keys(completions).filter((id) =>
    problems.some((p) => p.id === id)
  ).length
  const solved = problems.filter((p) => completions[p.id]?.accepted).length

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-100">Coding Assessment</h1>
          {candidateName && (
            <p className="text-slate-400 mt-1">Welcome, <span className="text-slate-200 font-medium">{candidateName}</span></p>
          )}
        </div>

        {/* Attempt rule banner */}
        <div className="flex items-start gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-5 py-4 mb-6 text-sm">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-indigo-300">
            <span className="font-semibold">Attempt any 2 of 3 problems.</span>{' '}
            Your score will be based on your best 2 submissions. You may attempt all 3, but only the top 2 count.
          </p>
        </div>

        {/* Progress bar */}
        {problems.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-400">
                  <span className="text-slate-100 font-semibold">{solved}</span> / {problems.length} solved
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">
                  <span className="text-slate-100 font-semibold">{attempted}</span> attempted
                </span>
              </div>
              <span className="text-indigo-400 text-sm font-semibold">
                {problems.length > 0 ? Math.round(solved / problems.length * 100) : 0}%
              </span>
            </div>
            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${problems.length > 0 ? (solved / problems.length * 100) : 0}%` }}
              />
            </div>
          </div>
        )}

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
          <div className="space-y-3 mb-8">
            {problems.map((p, i) => {
              const comp = completions[p.id]
              const isAccepted = comp?.accepted
              const isAttempted = !!comp

              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/problems/${p.id}`)}
                  className={`w-full flex items-center gap-4 backdrop-blur-xl border rounded-2xl px-6 py-5 text-left transition-all duration-150 group cursor-pointer ${
                    isAccepted
                      ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
                      : 'bg-white/5 hover:bg-white/[0.08] border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {isAccepted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : isAttempted ? (
                      <Circle className="w-6 h-6 text-amber-400" />
                    ) : (
                      <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-mono font-semibold group-hover:border-indigo-500/30 group-hover:text-indigo-300 transition">
                        {i + 1}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isAccepted ? 'text-emerald-300' : 'text-slate-100'}`}>
                      {p.title}
                    </p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {p.visible_test_cases_count} visible · {p.total_test_cases} total test cases
                      {comp && (
                        <span className={`ml-2 font-medium ${isAccepted ? 'text-emerald-400' : 'text-amber-400'}`}>
                          · {isAccepted ? 'Accepted' : `${comp.passed}/${comp.total} passed`}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-lg border capitalize ${DIFF_STYLES[p.difficulty] || ''}`}>
                      {p.difficulty}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition" />
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Submit Test button */}
        {problems.length > 0 && (
          <button
            onClick={() => {
              localStorage.setItem(`hcl_submitted_${candidateId}`, 'true')
              navigate('/report')
            }}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Submit Test & View Report
          </button>
        )}
      </div>
    </div>
  )
}
