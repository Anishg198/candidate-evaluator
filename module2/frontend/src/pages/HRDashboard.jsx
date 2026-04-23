import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllResults } from '../api'
import {
  Loader2, Trophy, Users, ChevronDown, ChevronUp,
  CheckCircle2, ShieldCheck, Eye, EyeOff, LogOut,
  ExternalLink, Brain, FileQuestion, AlignLeft,
} from 'lucide-react'

const HR_PASSWORD = 'HCL@2024'

const DIFF_STYLES = {
  easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  hard: 'bg-red-500/15 text-red-400 border-red-500/30',
}

function grade(score) {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' }
  if (score >= 60) return { label: 'Good', color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' }
  if (score >= 40) return { label: 'Average', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' }
  return { label: 'Poor', color: 'text-red-400 bg-red-500/15 border-red-500/30' }
}

function ScoreCell({ score }) {
  const { label, color } = grade(score)
  const barColor = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div>
      <div className="flex items-center gap-3 mb-1.5">
        <span className="text-slate-100 font-black text-lg tabular-nums w-8">{score}</span>
        <span className="text-slate-500 text-sm font-medium">/ 100</span>
        <span className={`ml-1 inline-flex items-center px-2.5 py-0.5 rounded-lg border text-xs font-semibold ${color}`}>
          {label}
        </span>
      </div>
      <div className="w-36 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: barColor }}
        />
      </div>
    </div>
  )
}

function SkillBar({ pct }) {
  const barColor = pct >= 80 ? '#10b981' : pct >= 60 ? '#6366f1' : pct >= 40 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-2 w-28">
      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <span className="text-xs text-slate-400 tabular-nums w-8 text-right">{pct}%</span>
    </div>
  )
}

function CandidateRow({ row, rank }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr
        className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition"
        onClick={() => setExpanded((e) => !e)}
      >
        <td className="px-5 py-4 text-slate-500 text-sm font-mono">#{rank}</td>
        <td className="px-5 py-4">
          {row.name && <p className="text-slate-100 font-semibold text-sm">{row.name}</p>}
          <p className={`font-mono ${row.name ? 'text-slate-500 text-xs' : 'text-slate-100 font-semibold text-sm'}`}>
            {row.candidate_id}
          </p>
          {row.email && <p className="text-slate-500 text-xs mt-0.5">{row.email}</p>}
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs capitalize ${DIFF_STYLES[row.difficulty] || ''}`}>
              {row.difficulty}
            </span>
            <span className="text-slate-600 text-xs">
              Started {new Date(row.started_at).toLocaleString()}
            </span>
          </div>
        </td>
        <td className="px-5 py-4">
          <ScoreCell score={row.total_score} />
        </td>
        <td className="px-5 py-4 text-center">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-sm">
              <FileQuestion className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-100 font-semibold">{row.mcq_correct}</span>
              <span className="text-slate-500">/{row.mcq_total}</span>
            </div>
            <p className="text-slate-500 text-xs">MCQ correct</p>
          </div>
        </td>
        <td className="px-5 py-4 text-center">
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1 text-sm">
              <AlignLeft className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-100 font-semibold">{row.subjective_total}</span>
            </div>
            <p className="text-slate-500 text-xs">subjective</p>
          </div>
        </td>
        <td className="px-5 py-4 text-right text-slate-500">
          {expanded ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
        </td>
      </tr>

      {expanded && (
        <tr className="bg-black/20 border-b border-white/5">
          <td colSpan={6} className="px-8 py-5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Skill Breakdown</p>
            <div className="space-y-2">
              {row.skill_breakdown.map((s) => (
                <div
                  key={s.skill}
                  className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                >
                  <div className="w-28 flex-shrink-0">
                    <span className="text-slate-200 text-sm font-medium">{s.skill}</span>
                  </div>
                  <SkillBar pct={s.score_pct} />
                  <div className="flex items-center gap-4 ml-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="w-3.5 h-3.5 text-indigo-400" />
                      MCQ: {s.mcq_correct}/{s.mcq_total}
                    </span>
                    {s.subjective_total > 0 && (
                      <span className="flex items-center gap-1">
                        <AlignLeft className="w-3.5 h-3.5 text-amber-400" />
                        Subj: {s.subjective_total} q · {s.subjective_points}/{s.subjective_max} pts
                      </span>
                    )}
                    <span className="text-slate-500">
                      {s.points}/{s.max_points} pts total
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Submitted {new Date(row.submitted_at).toLocaleString()} ·
              Skills: {row.skills.join(', ')}
            </p>
          </td>
        </tr>
      )}
    </>
  )
}

function LoginScreen({ onLogin }) {
  const navigate = useNavigate()
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [err, setErr] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (pw === HR_PASSWORD) { onLogin() }
    else { setErr(true); setPw('') }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
            <ShieldCheck className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">HR Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Enter the admin password to continue</p>
        </div>
        <form onSubmit={submit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-7 space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setErr(false) }}
              placeholder="Password"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {err && <p className="text-red-400 text-xs">Incorrect password.</p>}
          <button
            type="submit"
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3 rounded-xl transition cursor-pointer"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition cursor-pointer"
          >
            ← Back to Candidate Portal
          </button>
        </form>
      </div>
    </div>
  )
}

export default function HRDashboard() {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('hr_authed_m2') === 'true')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const handleLogin = () => {
    sessionStorage.setItem('hr_authed_m2', 'true')
    setAuthed(true)
  }

  const handleSignOut = () => {
    sessionStorage.removeItem('hr_authed_m2')
    setAuthed(false)
  }

  useEffect(() => {
    if (!authed) return
    getAllResults()
      .then((rows) => setData(rows.filter((r) => r.name && r.name.trim() !== '')))
      .catch(() => setError('Failed to load results. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [authed])

  if (!authed) return <LoginScreen onLogin={handleLogin} />

  const avgScore = data.length
    ? Math.round(data.reduce((s, r) => s + r.total_score, 0) / data.length)
    : 0
  const fullyAttempted = data.filter((r) => r.questions_attempted >= r.questions_total).length

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100">HR Dashboard</h1>
              <p className="text-slate-500 text-xs mt-0.5">Written Assessment Results — Module 2</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              Candidate Portal
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-sm text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Summary cards */}
        {!loading && data.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Candidates', value: data.length, icon: <Users className="w-5 h-5 text-indigo-400" /> },
              { label: 'Avg Score', value: `${avgScore} / 100`, icon: <Trophy className="w-5 h-5 text-amber-400" /> },
              { label: 'Fully Submitted', value: `${fullyAttempted} / ${data.length}`, icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> },
            ].map((c) => (
              <div key={c.label} className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                  {c.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-100">{c.value}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{c.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-slate-400">{error}</div>
        ) : data.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-slate-500">
            <Brain className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No candidates have completed the assessment yet.</p>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left">Rank</th>
                  <th className="px-5 py-3 text-left">Candidate / ID</th>
                  <th className="px-5 py-3 text-left">Score / 100</th>
                  <th className="px-5 py-3 text-center">MCQ</th>
                  <th className="px-5 py-3 text-center">Subjective</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <CandidateRow key={row.candidate_id} row={row} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
