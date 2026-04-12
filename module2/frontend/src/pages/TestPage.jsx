import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getTest, submitTest } from '../api'
import Timer from '../components/Timer'
import MCQQuestion from '../components/MCQQuestion'
import ShortAnswer from '../components/ShortAnswer'
import { Loader2, Send, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

export default function TestPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

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
        if (data.submitted) navigate(`/result/${sessionId}`)
      })
    }
  }, [sessionId])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    try {
      const payload = {
        answers: questions.map((q) => ({ question_id: q.id, answer: answers[q.id] || '' })),
      }
      const data = await submitTest(sessionId, payload)
      sessionStorage.setItem(`result_${sessionId}`, JSON.stringify({
        ...data,
        breakdown_questions: data.breakdown,
      }))
      navigate(`/result/${sessionId}`)
    } catch {
      setError('Submission failed. Please try again.')
      setSubmitting(false)
    }
  }, [answers, questions, sessionId, navigate])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  )

  const q = questions[current]
  const answered = Object.values(answers).filter(Boolean).length
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm font-medium">Question</span>
            <span className="text-slate-100 font-semibold">{current + 1} / {questions.length}</span>
            <span className="text-slate-500 text-xs">({answered} answered)</span>
          </div>
          <Timer totalSeconds={timeRemaining} onExpire={handleSubmit} />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Test
          </button>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-white/5">
          <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        {/* Question dots */}
        <div className="flex flex-wrap gap-2 mb-8">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrent(i)}
              className={`w-9 h-9 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                i === current
                  ? 'bg-indigo-500 border-indigo-400 text-white'
                  : answers[q.id]
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question card */}
        {q && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
            {/* Meta */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                {q.skill}
              </span>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 capitalize">
                {q.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
              </span>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 capitalize">
                {q.difficulty}
              </span>
              <span className="ml-auto text-xs text-slate-500">{q.max_points} pts</span>
            </div>

            {/* Text */}
            <p className="text-slate-100 text-base leading-relaxed font-medium">{q.question_text}</p>

            {/* Input */}
            {q.type === 'mcq' ? (
              <MCQQuestion
                question={q}
                selectedAnswer={answers[q.id] || ''}
                onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
              />
            ) : (
              <ShortAnswer
                question={q}
                value={answers[q.id] || ''}
                onChange={(val) => setAnswers({ ...answers, [q.id]: val })}
              />
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Nav */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setCurrent((c) => Math.max(0, c - 1))}
            disabled={current === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:border-white/20 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}
            disabled={current === questions.length - 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:border-white/20 hover:text-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  )
}
