import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getAllFinalReports, getM2AdminResults, getM4AdminResults, listApplications, createJob, toggleJob, listJobs, setHRDecision, getFinalReport } from '../api'
import {
  BarChart3, Users, Brain, Code2, ChevronLeft, Loader2, TrendingUp, AlertCircle,
  Plus, X, CheckCircle2, Briefcase, ToggleLeft, ToggleRight, ShieldCheck, Eye, EyeOff,
  ThumbsUp, ThumbsDown, Clock, Camera, FileText, PenLine, Video, ChevronDown, LogOut,
} from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

const HR_PASSWORD = 'HCL@2024'
const AUTH_KEY = 'plt_hr_auth'

function HRLogin({ onAuth }) {
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (pw === HR_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, '1')
      onAuth()
    } else {
      setError('Incorrect password.')
      setPw('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">HR Portal</h1>
          <p className="text-slate-500 text-sm mt-1">Enter your HR password to continue</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError('') }}
              placeholder="Password"
              autoFocus
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition pr-11"
            />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer">
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {error && <p className="text-red-500 dark:text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}
          <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-500/25 cursor-pointer">
            Sign In
          </button>
        </form>
        <Link to="/" className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    </div>
  )
}

const SUPPORTED_SKILLS = ['Python', 'SQL', 'Java', 'JavaScript', 'C++', 'Data Structures', 'Algorithms', 'OOP', 'OS', 'Networks', 'Machine Learning']
const DIFF_COLORS = { easy: 'text-emerald-600 dark:text-emerald-400', medium: 'text-amber-600 dark:text-amber-400', hard: 'text-red-600 dark:text-red-400' }
const REC_COLORS = {
  strong_hire: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  hire: 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20',
  maybe: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  review: 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
  not_recommended: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
}

function ScoreBadge({ score }) {
  if (score == null) return <span className="text-slate-400 dark:text-slate-600 text-sm font-medium">—</span>
  const pct = Math.round(score)
  const color = pct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 45 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
  return <span className={`font-bold text-sm ${color}`}>{pct}</span>
}

const DECISION_STYLES = {
  approved: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  rejected: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400',
  pending:  'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400',
}
const DECISION_ICONS = { approved: CheckCircle2, rejected: ThumbsDown, pending: Clock }

function ScoreBar({ label, score }) {
  const pct = Math.round(score ?? 0)
  const barColor = pct >= 70 ? 'bg-emerald-500' : pct >= 45 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className={`font-semibold ${pct >= 70 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 45 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{score != null ? `${pct}%` : '—'}</span>
      </div>
      <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: score != null ? `${pct}%` : '0%' }} />
      </div>
    </div>
  )
}

function ReportDetailModal({ candidateId, onClose }) {
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getFinalReport(candidateId)
      .then(setReport)
      .catch(() => setError('Could not load report.'))
      .finally(() => setLoading(false))
  }, [candidateId])

  const final = report?.scores?.final ?? report?.final_score
  const finalColor = final >= 70 ? 'text-emerald-600 dark:text-emerald-400' : final >= 45 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="ml-auto w-full max-w-2xl h-full bg-white dark:bg-[#0d0d14] border-l border-slate-200 dark:border-white/10 overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-[#0d0d14]/90 backdrop-blur border-b border-slate-200 dark:border-white/10 px-6 py-4 flex items-center gap-3">
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"><X className="w-5 h-5" /></button>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 dark:text-slate-100 font-bold">{report?.name || candidateId}</p>
            <p className="text-slate-500 text-xs font-mono">{candidateId}</p>
          </div>
          {report && <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${REC_COLORS[report.recommendation] || ''}`}>{report.recommendation_label}</span>}
        </div>

        {loading && <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>}
        {error && <p className="text-red-500 dark:text-red-400 text-sm px-6 py-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}

        {report && (
          <div className="px-6 py-6 space-y-6">
            {/* Score ring + breakdown */}
            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0 w-20 h-20 rounded-full border-4 border-slate-200 dark:border-white/10 flex items-center justify-center relative">
                  <span className={`text-2xl font-black ${finalColor}`}>{Math.round(final ?? 0)}</span>
                  <span className="text-slate-400 text-xs absolute bottom-3">/ 100</span>
                </div>
                <div className="flex-1 space-y-2.5">
                  <ScoreBar label="CV / Resume" score={report.scores?.cv ?? report.cv_score} />
                  <ScoreBar label="Written Test" score={report.scores?.written ?? report.written_score} />
                  {(report.scores?.interview ?? report.interview_score) != null && <ScoreBar label="AI Interview" score={report.scores?.interview ?? report.interview_score} />}
                  {(report.scores?.behavior ?? report.behavior_score) != null && <ScoreBar label="Behavior (Camera)" score={report.scores?.behavior ?? report.behavior_score} />}
                  <ScoreBar label="Coding Test" score={report.scores?.coding ?? report.coding_score} />
                </div>
              </div>
            </div>

            {/* AI Summary */}
            {report.summary && (
              <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl p-5">
                <p className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> AI Summary</p>
                <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">{report.summary}</p>
              </div>
            )}

            {/* Strengths + Concerns */}
            {(report.strengths?.length > 0 || report.concerns?.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {report.strengths?.length > 0 && (
                  <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4">
                    <p className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold mb-2">Strengths</p>
                    <ul className="space-y-1">
                      {report.strengths.map((s, i) => <li key={i} className="text-slate-700 dark:text-slate-300 text-xs flex gap-1.5"><span className="text-emerald-500 mt-0.5">✦</span>{s}</li>)}
                    </ul>
                  </div>
                )}
                {report.concerns?.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl p-4">
                    <p className="text-red-700 dark:text-red-400 text-xs font-semibold mb-2">Concerns</p>
                    <ul className="space-y-1">
                      {report.concerns.map((c, i) => <li key={i} className="text-slate-700 dark:text-slate-300 text-xs flex gap-1.5"><span className="text-red-500 mt-0.5">✦</span>{c}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* CV / Skills */}
            {report.cv_data && (
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
                <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-slate-400" /> CV Details</p>
                {report.cv_data.skills?.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs mb-2">Skills detected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {report.cv_data.skills.map((s) => <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400">{s}</span>)}
                    </div>
                  </div>
                )}
                {Array.isArray(report.cv_data.experience) && report.cv_data.experience.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-slate-500 text-xs font-medium">Experience</p>
                    {report.cv_data.experience.map((exp, i) => (
                      <div key={i} className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2.5">
                        <p className="font-medium text-slate-800 dark:text-slate-300">{exp.title}{exp.company ? ` · ${exp.company}` : ''}</p>
                        {exp.duration && <p className="text-slate-500 mt-0.5">{exp.duration}{exp.years ? ` (${exp.years}y)` : ''}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {typeof report.cv_data.experience === 'string' && report.cv_data.experience && (
                  <p className="text-slate-600 dark:text-slate-400 text-xs"><span className="text-slate-500">Experience:</span> {report.cv_data.experience}</p>
                )}
                {Array.isArray(report.cv_data.education) && report.cv_data.education.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-slate-500 text-xs font-medium">Education</p>
                    {report.cv_data.education.map((edu, i) => (
                      <div key={i} className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-3 py-2.5">
                        <p className="font-medium text-slate-800 dark:text-slate-300">{edu.degree || edu.institution}</p>
                        {edu.degree && edu.institution && <p className="text-slate-500 mt-0.5">{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</p>}
                      </div>
                    ))}
                  </div>
                )}
                {typeof report.cv_data.education === 'string' && report.cv_data.education && (
                  <p className="text-slate-600 dark:text-slate-400 text-xs"><span className="text-slate-500">Education:</span> {report.cv_data.education}</p>
                )}
                {report.cv_data.totalYearsExperience != null && (
                  <p className="text-slate-600 dark:text-slate-400 text-xs"><span className="text-slate-500">Total experience:</span> {report.cv_data.totalYearsExperience}y</p>
                )}
              </div>
            )}

            {/* Written test */}
            {report.written_data && (
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center gap-2"><PenLine className="w-4 h-4 text-slate-400" /> Written Test</p>
                  <p className="text-slate-500 text-xs">
                    {Math.round(report.written_data.score ?? report.written_data.raw_score ?? 0)} /
                    {Math.round(report.written_data.total ?? report.written_data.max_score ?? 100)} pts ·
                    <span className="ml-1 font-semibold text-slate-700 dark:text-slate-300">{Math.round(report.written_data.percentage ?? report.written_data.total_score ?? 0)}%</span>
                  </p>
                </div>
                {report.written_data.breakdown?.length > 0 && (
                  <div className="space-y-2">
                    {report.written_data.breakdown.map((b) => (
                      <ScoreBar key={b.skill} label={b.skill}
                        score={b.max_points > 0 ? Math.round(b.points / b.max_points * 100) : 0} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Interview Q&A */}
            {report.interview_data?.answers?.length > 0 && (
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
                <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center gap-2"><Video className="w-4 h-4 text-slate-400" /> Interview Responses</p>
                {report.interview_data.answers.map((ans, i) => (
                  <div key={i} className="space-y-1.5">
                    <p className="text-slate-600 dark:text-slate-400 text-xs font-semibold">Q{i + 1}: {ans.question}</p>
                    <p className="text-slate-700 dark:text-slate-300 text-sm bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 leading-relaxed">{ans.answer || <span className="text-slate-400 italic">No response</span>}</p>
                    {ans.score != null && (
                      <p className="text-xs text-slate-500">Score: <span className={ans.score >= 7 ? 'text-emerald-600 dark:text-emerald-400' : ans.score >= 4 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}>{ans.score}/10</span>
                        {ans.feedback && <span className="text-slate-400"> · {ans.feedback}</span>}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Coding results */}
            {report.coding_data && (
              <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm flex items-center gap-2"><Code2 className="w-4 h-4 text-slate-400" /> Coding Test</p>
                  <p className="text-slate-500 text-xs">
                    {report.coding_data.problems_solved ?? (report.coding_data.problem_results?.filter(p => p.status === 'Accepted').length ?? '—')} /
                    {report.coding_data.total_problems ?? report.coding_data.problem_results?.length ?? '—'} solved
                  </p>
                </div>
                {report.coding_data.problem_results?.map((p, i) => {
                  const accepted = p.status === 'Accepted' || p.accepted === true
                  const attempted = p.attempted || p.attempt_count > 0
                  return (
                    <div key={i} className="flex items-center justify-between text-xs bg-white dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2.5">
                      <div>
                        <span className="text-slate-800 dark:text-slate-300 font-medium">{p.title || `Problem ${i + 1}`}</span>
                        {p.difficulty && <span className={`ml-2 capitalize ${p.difficulty === 'easy' ? 'text-emerald-600 dark:text-emerald-500' : p.difficulty === 'hard' ? 'text-red-600 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'}`}>{p.difficulty}</span>}
                      </div>
                      <span className={accepted ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : attempted ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}>
                        {accepted ? 'Accepted' : attempted ? `${p.passed_tests ?? 0}/${p.total_tests ?? 0} passed` : 'Not attempted'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ReportCard({ r, onDecision }) {
  const [dec, setDec] = useState(r.hr_decision || 'pending')
  const [saving, setSaving] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const DecIcon = DECISION_ICONS[dec] || Clock

  const decide = async (d) => {
    setSaving(true)
    await onDecision(r.candidate_id, d)
    setDec(d)
    setSaving(false)
  }

  return (
    <>
      {showReport && <ReportDetailModal candidateId={r.candidate_id} onClose={() => setShowReport(false)} />}
      <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-slate-800 dark:text-slate-200 font-semibold">{r.name || r.candidate_id}</p>
            <p className="text-slate-500 text-xs mt-0.5">{r.email} · {r.candidate_id}</p>
          </div>
          <div className="flex items-center gap-4 text-sm flex-wrap">
            {[['CV', r.cv_score], ['Written', r.written_score], ['Interview', r.interview_score], ['Coding', r.coding_score], ['Final', r.final_score]].map(([label, score]) => (
              <div key={label} className="text-center"><p className="text-slate-500 text-xs">{label}</p><ScoreBadge score={score} /></div>
            ))}
            {r.behavior_score != null && (
              <div className="text-center">
                <p className="text-slate-500 text-xs flex items-center gap-1"><Camera className="w-3 h-3" />Behavior</p>
                <ScoreBadge score={r.behavior_score} />
              </div>
            )}
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border whitespace-nowrap ${REC_COLORS[r.recommendation] || ''}`}>
            {r.recommendation_label}
          </span>
        </div>
        <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-white/5">
          <span className="text-slate-400 text-xs font-medium">HR Decision:</span>
          <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${DECISION_STYLES[dec] || DECISION_STYLES.pending}`}>
            <DecIcon className="w-3 h-3" /> {dec.charAt(0).toUpperCase() + dec.slice(1)}
          </span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => setShowReport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer">
              <FileText className="w-3 h-3" /> View Report
            </button>
            <button disabled={saving || dec === 'approved'} onClick={() => decide('approved')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">
              <ThumbsUp className="w-3 h-3" /> Approve
            </button>
            <button disabled={saving || dec === 'rejected'} onClick={() => decide('rejected')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer">
              <ThumbsDown className="w-3 h-3" /> Reject
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

function JobForm({ onCreated }) {
  const [form, setForm] = useState({ title: '', company: 'HCL Technologies', description: '', difficulty: 'medium', num_questions: 10 })
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggle = (s) => setSkills((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s])

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title) { setError('Title required.'); return }
    if (!skills.length) { setError('Select at least one skill.'); return }
    setLoading(true)
    setError('')
    try {
      const job = await createJob({ ...form, required_skills: skills })
      onCreated(job)
      setForm({ title: '', company: 'HCL Technologies', description: '', difficulty: 'medium', num_questions: 10 })
      setSkills([])
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Failed to create job.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
      <h3 className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2"><Plus className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> New Job Posting</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Job Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Software Engineer Intern"
            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 transition text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1.5">Company</label>
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })}
            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 transition text-sm" />
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-1.5">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Role overview…"
          className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 transition text-sm resize-none" />
      </div>

      <div>
        <label className="block text-xs text-slate-500 mb-2">Required Skills * <span className="text-slate-400">(test will cover these + candidate's CV skills)</span></label>
        <div className="flex flex-wrap gap-2">
          {SUPPORTED_SKILLS.map((s) => (
            <button key={s} type="button" onClick={() => toggle(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${skills.includes(s) ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20'}`}>{s}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-500 mb-2">Difficulty</label>
          <div className="flex gap-2">
            {['easy', 'medium', 'hard'].map((d) => (
              <button key={d} type="button" onClick={() => setForm({ ...form, difficulty: d })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium border capitalize transition cursor-pointer ${form.difficulty === d ? d === 'easy' ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300' : d === 'medium' ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-300' : 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-300' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20'}`}>{d}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-2">Questions</label>
          <div className="flex gap-2">
            {[5, 10, 15].map((n) => (
              <button key={n} type="button" onClick={() => setForm({ ...form, num_questions: n })}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${form.num_questions === n ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20'}`}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>}

      <button type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition text-sm cursor-pointer">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Post Job
      </button>
    </form>
  )
}

export default function HRDashboard() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === '1')
  const [data, setData] = useState({ reports: [], written: [], coding: [], applications: [], jobs: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('jobs')
  const [showJobForm, setShowJobForm] = useState(false)

  const logout = () => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false) }

  useEffect(() => {
    if (!authed) return
    Promise.all([
      getAllFinalReports(),
      getM2AdminResults(),
      getM4AdminResults(),
      listApplications(),
      listJobs(),
    ]).then(([reports, written, coding, applications, jobs]) => {
      setData({ reports, written, coding, applications, jobs })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [authed])

  if (!authed) return <HRLogin onAuth={() => setAuthed(true)} />

  const handleJobCreated = (job) => {
    setData((d) => ({ ...d, jobs: [job, ...d.jobs] }))
    setShowJobForm(false)
  }

  const handleToggleJob = async (id) => {
    const result = await toggleJob(id).catch(() => null)
    if (result) setData((d) => ({ ...d, jobs: d.jobs.map((j) => j.id === id ? { ...j, is_active: result.is_active } : j) }))
  }

  const avgScore = data.reports.length > 0 ? Math.round(data.reports.reduce((s, r) => s + r.final_score, 0) / data.reports.length) : 0
  const hireCount = data.reports.filter((r) => ['strong_hire', 'hire'].includes(r.recommendation)).length

  const TABS = [
    ['jobs', 'Job Postings', data.jobs.length],
    ['applications', 'Applications', data.applications.length],
    ['final', 'Final Reports', data.reports.length],
    ['written', 'Written Tests', data.written.length],
    ['coding', 'Coding Tests', data.coding.length],
  ]

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition text-sm cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="w-px h-5 bg-slate-200 dark:bg-white/10" />
          <BarChart3 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          <h1 className="text-slate-900 dark:text-slate-100 font-bold flex-1">HR Dashboard</h1>
          <ThemeToggle />
          <button onClick={logout} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-sm px-3 py-2 rounded-xl transition cursor-pointer">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Open Jobs', value: data.jobs.filter((j) => j.is_active).length, icon: Briefcase, color: 'text-indigo-600 dark:text-indigo-400' },
            { label: 'Applications', value: data.applications.length, icon: Users, color: 'text-sky-600 dark:text-sky-400' },
            { label: 'Avg Score', value: `${avgScore}/100`, icon: TrendingUp, color: 'text-violet-600 dark:text-violet-400' },
            { label: 'Hire / Strong Hire', value: hireCount, icon: Brain, color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Coding Tests', value: data.coding.length, icon: Code2, color: 'text-amber-600 dark:text-amber-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2"><s.icon className={`w-4 h-4 ${s.color}`} /><p className="text-slate-500 text-xs">{s.label}</p></div>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {TABS.map(([tab, label, count]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition cursor-pointer ${activeTab === tab ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'}`}>
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === tab ? 'bg-indigo-200 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}>{count}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
        ) : (
          <>
            {/* Jobs tab */}
            {activeTab === 'jobs' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setShowJobForm((v) => !v)}
                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer">
                    {showJobForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Post Job</>}
                  </button>
                </div>
                {showJobForm && <JobForm onCreated={handleJobCreated} />}
                {data.jobs.length === 0 && !showJobForm && (
                  <div className="text-center py-16 text-slate-400"><Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No jobs yet. Click "Post Job" to create one.</p></div>
                )}
                {data.jobs.map((j) => (
                  <div key={j.id} className={`bg-white dark:bg-white/5 shadow-sm dark:shadow-none border rounded-2xl px-6 py-4 flex items-center gap-4 ${j.is_active ? 'border-slate-200 dark:border-white/10' : 'border-slate-100 dark:border-white/5 opacity-60'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">{j.title}</p>
                        {j.is_active
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400">Active</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500">Closed</span>}
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{j.company} · <span className={DIFF_COLORS[j.difficulty]}>{j.difficulty}</span> · {j.num_questions} questions</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {j.required_skills.map((s) => <span key={s} className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400">{s}</span>)}
                      </div>
                    </div>
                    <button onClick={() => handleToggleJob(j.id)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer">
                      {j.is_active ? <ToggleRight className="w-6 h-6 text-emerald-500 dark:text-emerald-400" /> : <ToggleLeft className="w-6 h-6" />}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Applications tab */}
            {activeTab === 'applications' && (
              data.applications.length === 0
                ? <div className="text-center py-16 text-slate-400"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No applications yet.</p></div>
                : <div className="space-y-3">
                  {data.applications.map((a) => (
                    <div key={a.candidate_id} className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-800 dark:text-slate-200 font-semibold">{a.name || a.candidate_id}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{a.email} · Applied for <span className="text-slate-600 dark:text-slate-400">{a.job_title}</span></p>
                        <p className="text-slate-400 dark:text-slate-600 text-xs font-mono mt-1">{a.candidate_id}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5 flex-shrink-0 max-w-xs">
                        {(a.merged_skills || []).slice(0, 4).map((s) => <span key={s} className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400">{s}</span>)}
                        {(a.merged_skills || []).length > 4 && <span className="text-xs text-slate-400">{`+${a.merged_skills.length - 4}`}</span>}
                      </div>
                    </div>
                  ))}
                </div>
            )}

            {/* Final reports tab */}
            {activeTab === 'final' && (
              data.reports.length === 0
                ? <div className="text-center py-16 text-slate-400"><AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No final reports yet.</p></div>
                : <div className="space-y-3">
                  {data.reports.map((r) => (
                    <ReportCard key={r.candidate_id} r={r} onDecision={(id, dec) => {
                      setHRDecision(id, { decision: dec }).then(() => {
                        data.reports.forEach(rep => { if (rep.candidate_id === id) rep.hr_decision = dec })
                        setData(d => ({ ...d, reports: [...d.reports] }))
                      }).catch(() => {})
                    }} />
                  ))}
                </div>
            )}

            {/* Written tab */}
            {activeTab === 'written' && (
              data.written.length === 0
                ? <div className="text-center py-16 text-slate-400"><AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No written test results.</p></div>
                : <div className="space-y-3">
                  {data.written.map((r, i) => (
                    <div key={i} className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
                      <div className="flex-1"><p className="text-slate-800 dark:text-slate-200 font-semibold">{r.name || r.candidate_id}</p><p className="text-slate-500 text-xs">{r.candidate_id}</p></div>
                      <div className="text-right"><p className="text-slate-900 dark:text-slate-100 font-bold">{Math.round(r.total_score || r.percentage || 0)}%</p><p className="text-slate-500 text-xs">{Math.round(r.raw_score || 0)}/{Math.round(r.max_score || 0)} pts</p></div>
                    </div>
                  ))}
                </div>
            )}

            {/* Coding tab */}
            {activeTab === 'coding' && (
              data.coding.length === 0
                ? <div className="text-center py-16 text-slate-400"><AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No coding test results.</p></div>
                : <div className="space-y-3">
                  {data.coding.map((r, i) => (
                    <div key={i} className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
                      <div className="flex-1"><p className="text-slate-800 dark:text-slate-200 font-semibold">{r.name || r.candidate_id}</p><p className="text-slate-500 text-xs">{r.candidate_id}</p></div>
                      <div className="flex items-center gap-4">
                        <div className="text-center"><p className="text-slate-500 text-xs">Solved</p><p className="text-slate-800 dark:text-slate-200 font-bold">{r.problems_solved}/{r.total_problems}</p></div>
                        <div className="text-center"><p className="text-slate-500 text-xs">Score</p><ScoreBadge score={r.total_score} /></div>
                      </div>
                    </div>
                  ))}
                </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
