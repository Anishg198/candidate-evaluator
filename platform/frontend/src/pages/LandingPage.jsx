import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { listJobs, getApplicationStatus, generateTest } from '../api'
import {
  Brain, Briefcase, ChevronRight, Loader2, AlertCircle, ShieldCheck, MapPin,
  Code2, Search, CheckCircle2, Clock, XCircle, Play,
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

const DIFF_COLORS = {
  easy: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  medium: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  hard: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
}

const DECISION_STYLES = {
  approved: { icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30', label: 'Approved' },
  rejected: { icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30', label: 'Not Selected' },
  pending:  { icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', label: 'Under Review' },
}

function StatusTracker() {
  const navigate = useNavigate()
  const [id, setId] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [resuming, setResuming] = useState(false)
  const [error, setError] = useState('')

  const check = async (e) => {
    e.preventDefault()
    if (!id.trim()) return
    setLoading(true)
    setError('')
    setStatus(null)
    try {
      const data = await getApplicationStatus(id.trim().toUpperCase())
      setStatus(data)
    } catch {
      setError('Candidate ID not found. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  const resume = async () => {
    if (!status) return
    setResuming(true)
    const r = status.resume
    localStorage.setItem('plt_candidate_id', status.candidate_id)
    localStorage.setItem('plt_candidate_name', status.name)
    localStorage.setItem('plt_candidate_email', status.email || '')
    localStorage.setItem('plt_job_title', status.job_title)
    localStorage.setItem('plt_skills', JSON.stringify(r.skills || []))
    localStorage.setItem('plt_difficulty', r.difficulty || 'medium')
    localStorage.setItem('plt_num_questions', String(r.num_questions || 10))

    if (!r.written_done) {
      try {
        const data = await generateTest({
          name: status.name,
          email: status.email || '',
          candidate_id: status.candidate_id,
          skills: r.skills,
          difficulty: r.difficulty,
          num_questions: r.num_questions,
        })
        if (data.session_id) {
          localStorage.setItem('plt_m2_session', data.session_id)
          const totalPoints = (data.questions || []).reduce((s, q) => s + (q.max_points || 0), 0)
          navigate('/instructions', {
            state: {
              testType: 'written',
              nextPath: `/written-test/${data.session_id}`,
              nextState: { questions: data.questions, duration: data.duration_minutes },
              meta: { questions: data.questions?.length, duration: data.duration_minutes, totalPoints: totalPoints || undefined },
            },
          })
        }
      } catch {
        setError('Could not start written test. Try again.')
        setResuming(false)
      }
    } else if (!r.interview_done) {
      navigate('/instructions', { state: { testType: 'interview', nextPath: '/interview', nextState: null, meta: {} } })
    } else if (!r.coding_done) {
      navigate('/instructions', { state: { testType: 'coding', nextPath: '/coding', nextState: null, meta: {} } })
    } else {
      navigate('/report')
    }
  }

  const decision = status ? (DECISION_STYLES[status.hr_decision] || DECISION_STYLES.pending) : null
  const DecisionIcon = decision?.icon
  const r = status?.resume
  const allDone = r && r.written_done && r.interview_done && r.coding_done
  const canResume = r && !allDone && status.hr_decision !== 'rejected'

  return (
    <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
      <div>
        <h2 className="text-slate-900 dark:text-slate-200 font-bold text-lg">Track Your Application</h2>
        <p className="text-slate-500 text-sm mt-0.5">Enter your candidate ID to check progress or continue</p>
      </div>
      <form onSubmit={check} className="flex gap-2">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="e.g. CAND-AB12CD"
          className="flex-1 min-w-0 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition text-sm font-mono"
        />
        <button type="submit" disabled={loading || !id.trim()} className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-semibold px-3 py-2.5 rounded-xl transition text-sm cursor-pointer flex-shrink-0 whitespace-nowrap">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Check
        </button>
      </form>

      {error && <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</p>}

      {status && (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <p className="text-slate-800 dark:text-slate-200 font-semibold">{status.name}</p>
              <p className="text-slate-500 text-xs mt-0.5">{status.job_title} · {status.company}</p>
            </div>
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold ${decision.bg}`}>
              <DecisionIcon className={`w-3.5 h-3.5 ${decision.color}`} />
              <span className={decision.color}>{decision.label}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {status.stages.map((stage) => (
              <div key={stage.id} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${stage.done ? 'bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/15' : 'bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5'}`}>
                {stage.done
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                  : <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0" />}
                <span className={`text-sm font-medium ${stage.done ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}>{stage.label}</span>
              </div>
            ))}
          </div>

          {canResume && (
            <button onClick={resume} disabled={resuming}
              className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition text-sm cursor-pointer shadow-lg shadow-indigo-500/20">
              {resuming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {resuming ? 'Loading…' : 'Continue Assessment'}
            </button>
          )}
          {allDone && (
            <p className="text-center text-emerald-600 dark:text-emerald-400 text-xs font-medium">Assessment complete — awaiting HR review</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listJobs()
      .then(setJobs)
      .catch(() => setError('Could not load job postings. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/30 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-900 dark:text-slate-100 font-bold text-sm leading-none">HCL Eval Platform</p>
              <p className="text-slate-500 text-xs">AI-powered candidate assessment</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/hr" className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm px-3 py-2 rounded-xl transition">
              <ShieldCheck className="w-4 h-4" /> HR Portal
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-14">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-4 leading-tight">Start Your Journey at HCL</h1>
          <p className="text-slate-600 dark:text-slate-400 text-xl max-w-lg mx-auto">
            Apply to an open role. We'll assess your skills through CV scan, written test, AI interview, and coding challenge.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full min-w-0">
          {/* Job listings — 2/3 */}
          <div className="lg:col-span-2 space-y-4 min-w-0">
            {loading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}
            {error && !loading && (
              <div className="flex flex-col items-center gap-3 py-20 text-slate-500">
                <AlertCircle className="w-10 h-10 text-red-400 opacity-60" />
                <p className="text-red-500 dark:text-red-400">{error}</p>
              </div>
            )}
            {!loading && !error && jobs.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-20 text-slate-500">
                <Briefcase className="w-12 h-12 opacity-30" />
                <p className="text-lg font-medium">No open positions right now</p>
                <p className="text-sm">Check back soon, or ask HR to post a role.</p>
                <Link to="/hr" className="mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-sm underline">Go to HR Portal →</Link>
              </div>
            )}
            {!loading && jobs.length > 0 && (
              <>
                <p className="text-slate-500 text-sm font-medium">{jobs.length} open position{jobs.length !== 1 ? 's' : ''}</p>
                {jobs.map((job) => (
                  <div key={job.id} className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 hover:border-indigo-300 dark:hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-white/[0.07] transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                            <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <h2 className="text-slate-900 dark:text-slate-100 font-bold text-lg leading-tight">{job.title}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="text-slate-500 text-xs">{job.company}</span>
                            </div>
                          </div>
                        </div>
                        {job.description && <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4 line-clamp-2">{job.description}</p>}
                        <div className="flex flex-wrap items-center gap-2">
                          {job.required_skills.map((s) => (
                            <span key={s} className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs font-medium">{s}</span>
                          ))}
                          <span className={`px-3 py-1 rounded-lg border text-xs font-semibold capitalize ${DIFF_COLORS[job.difficulty] || DIFF_COLORS.medium}`}>{job.difficulty}</span>
                          <span className="text-slate-400 dark:text-slate-600 text-xs">{job.num_questions} questions</span>
                        </div>
                      </div>
                      <button onClick={() => navigate(`/apply/${job.id}`)}
                        className="flex-shrink-0 flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 cursor-pointer text-sm">
                        Apply <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Status tracker — 1/3 */}
          <div className="lg:col-span-1 min-w-0">
            <StatusTracker />
          </div>
        </div>
      </div>
    </div>
  )
}
