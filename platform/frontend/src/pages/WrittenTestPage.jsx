import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getTest, submitTest } from '../api'
import PipelineBar from '../components/PipelineBar'
import BehaviorCamera from '../components/BehaviorCamera'
import Timer from '../components/Timer'
import MCQQuestion from '../components/MCQQuestion'
import ShortAnswer from '../components/ShortAnswer'
import { Loader2, Send, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

export default function WrittenTestPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const cameraRef = useRef(null)

  const [questions, setQuestions] = useState(location.state?.questions || [])
  const [timeRemaining, setTimeRemaining] = useState((location.state?.duration || 30) * 60)
  const [answers, setAnswers] = useState({})
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(!location.state?.questions)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!location.state?.questions) {
      getTest(sessionId).then((data) => {
        setQuestions(data.questions || [])
        setTimeRemaining(data.time_remaining_seconds || 1800)
        setLoading(false)
        if (data.submitted) navigate('/written-test-done')
      })
    }
  }, [sessionId])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    try {
      const payload = { answers: questions.map((q) => ({ question_id: q.id, answer: answers[q.id] || '' })) }
      await submitTest(sessionId, payload)
      const behaviorScore = cameraRef.current?.getScore() ?? null
      if (behaviorScore !== null) localStorage.setItem('plt_behavior_written', String(behaviorScore))
      navigate('/written-test-done')
    } catch {
      setError('Submission failed. Please try again.')
      setSubmitting(false)
    }
  }, [answers, questions, sessionId, navigate])

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={2} />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
    </div>
  )

  const q = questions[current]
  const answered = Object.values(answers).filter(Boolean).length
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0

  return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={2} />
      <div className="fixed bottom-4 right-4 z-50">
        <BehaviorCamera ref={cameraRef} compact />
      </div>

      {/* Test header */}
      <header className="sticky top-0 z-10 bg-white/90 dark:bg-black/40 backdrop-blur-xl border-b border-slate-200 dark:border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 text-sm font-medium">Question</span>
            <span className="text-slate-900 dark:text-slate-100 font-semibold">{current + 1} / {questions.length}</span>
            <span className="text-slate-400 text-xs">({answered} answered)</span>
          </div>
          <Timer totalSeconds={timeRemaining} onExpire={handleSubmit} />
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 cursor-pointer">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Test
          </button>
        </div>
        <div className="h-0.5 bg-slate-100 dark:bg-white/5">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Question dots */}
        <div className="flex flex-wrap gap-2 mb-8">
          {questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrent(i)}
              className={`w-9 h-9 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                i === current ? 'bg-indigo-500 border-indigo-400 text-white'
                : answers[q.id] ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
                : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20'
              }`}>{i + 1}</button>
          ))}
        </div>

        {/* Question */}
        {q && (
          <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-8">
            <div className="flex items-start gap-4 mb-6">
              <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm font-bold">{current + 1}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${q.type === 'mcq' ? 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-700 dark:text-sky-400' : 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400'}`}>
                    {q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
                  </span>
                  {q.skill && <span className="text-xs text-slate-500 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-lg">{q.skill}</span>}
                  <span className="text-xs text-slate-500 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 px-2.5 py-1 rounded-lg ml-auto">{q.max_points} pts</span>
                </div>
                <p className="text-slate-900 dark:text-slate-100 text-base leading-relaxed">{q.question_text}</p>
              </div>
            </div>

            {q.type === 'mcq'
              ? <MCQQuestion question={q} selectedAnswer={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
              : <ShortAnswer question={q} value={answers[q.id] || ''} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
            }
          </div>
        )}

        {error && <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 mt-4 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</p>}

        {/* Nav */}
        <div className="flex gap-3 mt-6">
          <button onClick={() => setCurrent((c) => Math.max(0, c - 1))} disabled={current === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08] disabled:opacity-30 transition text-sm cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} disabled={current === questions.length - 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.08] disabled:opacity-30 transition text-sm cursor-pointer">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  )
}
