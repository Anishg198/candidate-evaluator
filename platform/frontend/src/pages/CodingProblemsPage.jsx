import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { startCodingSession, getProblems } from '../api'
import PipelineBar from '../components/PipelineBar'
import BehaviorCamera from '../components/BehaviorCamera'
import { Code2, ChevronRight, Loader2, CheckCircle2, Circle, Send, Info, AlertCircle, Bot, Clock, FileText } from 'lucide-react'

const DIFF_STYLES = {
  easy: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
  hard: 'bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400',
}

function getCompletions(candidateId) {
  try { return JSON.parse(localStorage.getItem(`plt_completions_${candidateId}`) || '{}') } catch { return {} }
}

export default function CodingProblemsPage() {
  const navigate = useNavigate()
  const cameraRef = useRef(null)
  const candidateId = localStorage.getItem('plt_candidate_id') || ''
  const candidateName = localStorage.getItem('plt_candidate_name') || ''

  const [problems, setProblems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [completions, setCompletions] = useState(() => getCompletions(candidateId))
  const [sessionProblemIds, setSessionProblemIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`plt_session_problems_${candidateId}`) || 'null') } catch { return null }
  })
  const [showSubmitPrompt, setShowSubmitPrompt] = useState(false)
  const interviewDone = !!localStorage.getItem(`plt_m3_session_${candidateId}`)

  useEffect(() => {
    if (!candidateId) { navigate('/'); return }
    if (localStorage.getItem(`plt_submitted_${candidateId}`) === 'true') { navigate('/report'); return }

    const initSession = async () => {
      try {
        const session = await startCodingSession({
          candidate_id: candidateId,
          name: candidateName,
          email: localStorage.getItem('plt_candidate_email') || '',
        })
        if (!sessionProblemIds) {
          localStorage.setItem(`plt_session_problems_${candidateId}`, JSON.stringify(session.problem_ids))
          setSessionProblemIds(session.problem_ids)
        }
      } catch {
        setError('Could not start coding session. Is Module 4 backend running?')
      }
    }

    initSession().then(async () => {
      try {
        const all = await getProblems()
        const ids = JSON.parse(localStorage.getItem(`plt_session_problems_${candidateId}`) || 'null')
        if (ids?.length) {
          setProblems(ids.map((id) => all.find((p) => p.id === id)).filter(Boolean))
        } else {
          setProblems(all)
        }
      } catch {
        setError('Could not load problems.')
      }
      setLoading(false)
    })
  }, [candidateId])

  useEffect(() => {
    const refresh = () => setCompletions(getCompletions(candidateId))
    window.addEventListener('focus', refresh)
    return () => window.removeEventListener('focus', refresh)
  }, [candidateId])

  const solved = problems.filter((p) => completions[p.id]?.accepted).length
  const attempted = Object.keys(completions).filter((id) => problems.some((p) => p.id === id)).length

  const finishAndSubmit = (dest) => {
    localStorage.setItem(`plt_submitted_${candidateId}`, 'true')
    const behaviorScore = cameraRef.current?.getScore() ?? null
    if (behaviorScore !== null) localStorage.setItem('plt_behavior_coding', String(behaviorScore))
    navigate(dest)
  }

  const handleFinish = () => {
    if (!interviewDone) { setShowSubmitPrompt(true); return }
    finishAndSubmit('/report')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="fixed bottom-4 right-4 z-50"><BehaviorCamera ref={cameraRef} compact /></div>
      <PipelineBar currentStep={4} />

      {/* Submit prompt modal — shown when interview not done */}
      {showSubmitPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">One more step</h2>
              <p className="text-slate-500 text-sm mt-1">You haven't taken the AI Technical Interview yet. What would you like to do?</p>
            </div>
            <div className="space-y-2.5">
              <button
                onClick={() => {
                  setShowSubmitPrompt(false)
                  localStorage.setItem(`plt_submitted_${candidateId}`, 'true')
                  const bs = cameraRef.current?.getScore() ?? null
                  if (bs !== null) localStorage.setItem('plt_behavior_coding', String(bs))
                  navigate('/instructions', { state: { testType: 'interview', nextPath: '/interview', nextState: null, meta: {} } })
                }}
                className="w-full flex items-center gap-4 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 rounded-xl px-4 py-3.5 text-left transition cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-slate-100 font-semibold text-sm">Take AI Interview Now</p>
                  <p className="text-slate-500 text-xs mt-0.5">5 questions — complete your assessment today</p>
                </div>
                <ChevronRight className="w-4 h-4 text-indigo-400 ml-auto flex-shrink-0" />
              </button>

              <button
                onClick={() => {
                  setShowSubmitPrompt(false)
                  localStorage.setItem(`plt_submitted_${candidateId}`, 'true')
                  const bs = cameraRef.current?.getScore() ?? null
                  if (bs !== null) localStorage.setItem('plt_behavior_coding', String(bs))
                  navigate('/')
                }}
                className="w-full flex items-center gap-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-left transition cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-slate-100 font-semibold text-sm">Do It Later</p>
                  <p className="text-slate-500 text-xs mt-0.5">Return to your assessment dashboard — interview stays available</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto flex-shrink-0" />
              </button>

              <button
                onClick={() => finishAndSubmit('/report')}
                className="w-full flex items-center gap-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.08] border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-left transition cursor-pointer">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <p className="text-slate-800 dark:text-slate-100 font-semibold text-sm">Submit Without Interview</p>
                  <p className="text-slate-500 text-xs mt-0.5">View your final report now — interview score won't be included</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto flex-shrink-0" />
              </button>
            </div>
            <button onClick={() => setShowSubmitPrompt(false)} className="w-full text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer text-center py-1">
              Cancel — keep working
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Coding Assessment</h1>
            {candidateName && <p className="text-slate-500 mt-1">Welcome, <span className="text-slate-700 dark:text-slate-200 font-medium">{candidateName}</span></p>}
          </div>

          <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl px-5 py-4 mb-6 text-sm">
            <Info className="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
            <p className="text-indigo-700 dark:text-indigo-300"><span className="font-semibold">Attempt any 2 of 3 problems.</span> Your score is based on the top 2 submissions. You may attempt all 3.</p>
          </div>

          {problems.length > 0 && (
            <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500"><span className="text-slate-900 dark:text-slate-100 font-semibold">{solved}</span> / {problems.length} solved</span>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="text-slate-500"><span className="text-slate-900 dark:text-slate-100 font-semibold">{attempted}</span> attempted</span>
                </div>
                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold">{problems.length > 0 ? Math.round(solved / problems.length * 100) : 0}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${problems.length > 0 ? solved / problems.length * 100 : 0}%` }} />
              </div>
            </div>
          )}

          {error && <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}

          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
          ) : problems.length === 0 ? (
            <div className="text-center py-16 text-slate-400"><Code2 className="w-10 h-10 mx-auto mb-3 opacity-40" /><p>No problems found.</p></div>
          ) : (
            <div className="space-y-3 mb-8">
              {problems.map((p, i) => {
                const comp = completions[p.id]
                const isAccepted = comp?.accepted
                const isAttempted = !!comp
                return (
                  <button key={p.id} onClick={() => navigate(`/coding/${p.id}`)}
                    className={`w-full flex items-center gap-4 backdrop-blur-xl border rounded-2xl px-6 py-5 text-left transition-all group cursor-pointer shadow-sm dark:shadow-none ${
                      isAccepted ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-500/40' : 'bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.08] border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
                    }`}>
                    <div className="flex-shrink-0">
                      {isAccepted ? <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                        : isAttempted ? <Circle className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                        : <span className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 text-sm font-mono font-semibold group-hover:border-indigo-300 dark:group-hover:border-indigo-500/30 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition">{i + 1}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${isAccepted ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-900 dark:text-slate-100'}`}>{p.title}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {p.visible_test_cases_count} visible · {p.total_test_cases} total
                        {comp && <span className={`ml-2 font-medium ${isAccepted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>· {isAccepted ? 'Accepted' : `${comp.passed}/${comp.total} passed`}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-lg border capitalize ${DIFF_STYLES[p.difficulty] || ''}`}>{p.difficulty}</span>
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {problems.length > 0 && (
            <button onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
              <Send className="w-4 h-4" /> Submit & View Final Report
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
