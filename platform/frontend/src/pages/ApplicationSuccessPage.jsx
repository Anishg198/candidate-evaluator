import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PipelineBar from '../components/PipelineBar'
import { generateTest } from '../api'
import { CheckCircle2, ChevronRight, Copy, Brain, Loader2, AlertCircle } from 'lucide-react'

export default function ApplicationSuccessPage() {
  const navigate = useNavigate()
  const candidateId = localStorage.getItem('plt_candidate_id') || ''
  const candidateName = localStorage.getItem('plt_candidate_name') || ''
  const candidateEmail = localStorage.getItem('plt_candidate_email') || ''
  const jobTitle = localStorage.getItem('plt_job_title') || ''
  const skills = JSON.parse(localStorage.getItem('plt_skills') || '[]')
  const difficulty = localStorage.getItem('plt_difficulty') || 'medium'
  const numQuestions = parseInt(localStorage.getItem('plt_num_questions') || '10')

  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const copyId = () => {
    navigator.clipboard.writeText(candidateId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const startTest = async () => {
    if (!skills.length) { setError('No skills found. Contact HR.'); return }
    setGenerating(true)
    setError('')
    try {
      const data = await generateTest({
        name: candidateName,
        email: candidateEmail,
        candidate_id: candidateId,
        skills,
        difficulty,
        num_questions: numQuestions,
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
      } else {
        setError(data.detail || 'Failed to generate test. Try again.')
        setGenerating(false)
      }
    } catch {
      setError('Cannot connect to test backend. Please try again in a moment.')
      setGenerating(false)
    }
  }

  if (generating) return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={2} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
          <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-medium">Generating your personalised assessment…</p>
        <p className="text-slate-500 text-sm">This may take 1–3 minutes — AI is crafting your questions</p>
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
        <p className="text-slate-400 dark:text-slate-600 text-xs mt-2">Please keep this tab open</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={2} />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Application Received!</h1>
            <p className="text-slate-500 mt-2">
              {candidateName ? `Welcome, ${candidateName}` : 'Welcome'}
              {jobTitle ? ` — applied for ${jobTitle}` : ''}
            </p>
          </div>

          <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-3">
            <p className="text-slate-500 text-sm font-medium">Your Candidate ID</p>
            <div className="flex items-center gap-3 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3">
              <p className="text-slate-900 dark:text-slate-100 font-mono font-bold text-xl flex-1">{candidateId}</p>
              <button onClick={copyId} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer">
                <Copy className="w-4 h-4" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-xs">Save this ID — you'll need it if you return to complete the assessment later.</p>
          </div>

          {skills.length > 0 && (
            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4">
              <p className="text-slate-500 text-xs mb-2">Your test covers</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s} className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium">{s}</span>
                ))}
              </div>
              <p className="text-slate-400 dark:text-slate-600 text-xs mt-2">{numQuestions} questions · {difficulty} difficulty</p>
            </div>
          )}

          {error && (
            <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </p>
          )}

          <button onClick={startTest}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
            Start Written Assessment <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
