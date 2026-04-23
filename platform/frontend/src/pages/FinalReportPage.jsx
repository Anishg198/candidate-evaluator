import { useEffect, useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { generateFinalReport } from '../api'
import PipelineBar from '../components/PipelineBar'
import BehaviorCamera from '../components/BehaviorCamera'
import { CheckCircle2, Loader2, Brain, Copy, Home } from 'lucide-react'

export default function FinalReportPage() {
  const navigate = useNavigate()
  const cameraRef = useRef(null)

  const candidateId    = localStorage.getItem('plt_candidate_id') || ''
  const candidateName  = localStorage.getItem('plt_candidate_name') || ''
  const candidateEmail = localStorage.getItem('plt_candidate_email') || ''
  const cvData         = JSON.parse(localStorage.getItem('plt_cv_data') || 'null')

  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!candidateId) { navigate('/'); return }

    const timer = setTimeout(async () => {
      const scores = [
        parseFloat(localStorage.getItem('plt_behavior_written') || ''),
        parseFloat(localStorage.getItem('plt_behavior_interview') || ''),
        parseFloat(localStorage.getItem('plt_behavior_coding') || ''),
        cameraRef.current?.getScore(),
      ].filter((s) => !isNaN(s) && s !== null)
      const behaviorScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
      try {
        await generateFinalReport({
          candidate_id: candidateId,
          name: candidateName,
          email: candidateEmail,
          cv_data: cvData,
          behavior_score: behaviorScore,
        })
      } catch {
        // Silent — report is best-effort
      }
      setSubmitted(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [candidateId])

  const copyId = () => {
    navigator.clipboard.writeText(candidateId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={5} />

      <div className="fixed bottom-4 right-4 z-50 opacity-0 pointer-events-none">
        <BehaviorCamera ref={cameraRef} compact />
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg text-center space-y-8">
          {!submitted ? (
            <>
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
                  <Brain className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Finalising your assessment…</h1>
                <p className="text-slate-500 mt-2">Compiling your results. Just a moment.</p>
              </div>
              <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto" />
            </>
          ) : (
            <>
              <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 dark:text-emerald-400" />
                </div>
              </div>

              <div>
                <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Thank you{candidateName ? `, ${candidateName.split(' ')[0]}` : ''}!</h1>
                <p className="text-slate-500 mt-3 text-lg leading-relaxed">
                  You've completed all stages of the HCL assessment. Our HR team will review your results and get back to you soon.
                </p>
              </div>

              <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
                <p className="text-slate-500 text-sm">Your Candidate ID — save this to track your application status</p>
                <div className="flex items-center gap-3 bg-slate-100 dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3">
                  <p className="text-slate-900 dark:text-slate-100 font-mono font-bold text-xl flex-1">{candidateId}</p>
                  <button onClick={copyId} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer">
                    <Copy className="w-4 h-4" /> {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-slate-400 dark:text-slate-600 text-xs">Use this ID on the home page to check your application status at any time.</p>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl p-5 text-left space-y-2.5">
                <p className="text-slate-700 dark:text-slate-300 font-semibold text-sm">What happens next?</p>
                <p className="text-slate-500 text-sm">✦ HR reviews your CV, written test, interview, and coding scores</p>
                <p className="text-slate-500 text-sm">✦ You'll hear back via email within a few business days</p>
              </div>

              <Link to="/"
                className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 font-semibold py-3 rounded-xl transition cursor-pointer text-sm">
                <Home className="w-4 h-4" /> Back to Home
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
