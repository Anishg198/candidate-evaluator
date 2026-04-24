import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import PipelineBar from '../components/PipelineBar'
import BehaviorCamera from '../components/BehaviorCamera'
import Timer from '../components/Timer'
import { startInterview, submitInterviewAnswer, finishInterviewEarly } from '../api'
import {
  Bot, User, ChevronRight, Loader2, CheckCircle2, AlertCircle, Send, Brain,
} from 'lucide-react'

const INTERVIEW_DURATION = 30 * 60

function getInterviewTimeRemaining(candidateId) {
  const key = `plt_interview_start_${candidateId}`
  const stored = localStorage.getItem(key)
  if (stored) return Math.max(0, INTERVIEW_DURATION - Math.floor((Date.now() - parseInt(stored)) / 1000))
  localStorage.setItem(key, String(Date.now()))
  return INTERVIEW_DURATION
}

const CATEGORY_COLORS = {
  technical: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20',
  behavioral: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
}

const speak = (text) => {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.rate = 0.95
  utt.pitch = 1
  window.speechSynthesis.speak(utt)
}

export default function InterviewPage() {
  const navigate = useNavigate()
  const cameraRef = useRef(null)
  const candidateId   = localStorage.getItem('plt_candidate_id') || ''
  const candidateName = localStorage.getItem('plt_candidate_name') || 'Candidate'
  const jobTitle      = localStorage.getItem('plt_job_title') || ''
  const skills        = JSON.parse(localStorage.getItem('plt_skills') || '[]')

  const [sessionId, setSessionId] = useState(null)
  const [currentQ, setCurrentQ] = useState(null)
  const [history, setHistory] = useState([])
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [timeRemaining] = useState(() => getInterviewTimeRemaining(candidateId))

  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      try {
        const data = await startInterview({ candidate_id: candidateId, name: candidateName, job_title: jobTitle, skills })
        setSessionId(data.session_id)
        setCurrentQ(data.question)
        setHistory([{ role: 'ai', text: data.question.text, skill: data.question.skill, category: data.question.category, qNum: data.question.number, total: data.question.total }])
        const name = candidateName !== 'Candidate' ? `, ${candidateName}` : ''
        const welcome = `Welcome${name} to your AI technical interview. I'll ask you ${data.question.total} questions. Type your answers and press send. Let's begin.`
        speak(welcome)
        setTimeout(() => speak(data.question.text), 4000)
      } catch {
        setError('Could not connect to interview service. You can skip to the coding test.')
      } finally {
        setLoading(false)
      }
    }
    init()
    return () => window.speechSynthesis?.cancel()
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  const handleFinishEarly = async () => {
    window.speechSynthesis?.cancel()
    const behaviorScore = cameraRef.current?.getScore() ?? null
    if (behaviorScore !== null) localStorage.setItem('plt_behavior_interview', String(behaviorScore))
    if (sessionId) {
      try {
        const data = await finishInterviewEarly(sessionId)
        setResult(data)
        localStorage.setItem(`plt_m3_session_${candidateId}`, sessionId)
      } catch {
        // still mark done locally even if backend call fails
        localStorage.setItem(`plt_m3_session_${candidateId}`, sessionId)
      }
    }
    setCompleted(true)
  }

  const handleSubmit = async () => {
    if (!answer.trim() || submitting) return
    const trimmed = answer.trim()
    setAnswer('')
    setSubmitting(true)
    setError('')
    setHistory((h) => [...h, { role: 'user', text: trimmed }])
    try {
      const data = await submitInterviewAnswer(sessionId, { answer: trimmed })
      if (data.completed) {
        setCompleted(true)
        setResult(data.result)
        localStorage.setItem(`plt_m3_session_${candidateId}`, sessionId)
        const closing = "Great work! You've completed all the interview questions. Your responses have been recorded. Please continue to the coding test."
        setHistory((h) => [...h, { role: 'ai', text: closing, skill: '', category: 'system' }])
        speak(closing)
        const behaviorScore = cameraRef.current?.getScore() ?? null
        if (behaviorScore !== null) localStorage.setItem('plt_behavior_interview', String(behaviorScore))
      } else {
        setCurrentQ(data.question)
        setHistory((h) => [...h, { role: 'ai', text: data.question.text, skill: data.question.skill, category: data.question.category, qNum: data.question.number, total: data.question.total }])
        speak(data.question.text)
      }
    } catch {
      setError('Failed to submit. Try again.')
      setHistory((h) => h.slice(0, -1))
      setAnswer(trimmed)
    } finally {
      setSubmitting(false)
      setTimeout(() => textareaRef.current?.focus(), 100)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSubmit() }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={3} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
          <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-medium">Preparing your interview…</p>
        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
      </div>
    </div>
  )

  if (error && !sessionId) return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={3} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-red-500 dark:text-red-400 text-center max-w-sm">{error}</p>
        <button onClick={() => navigate('/instructions', { state: { testType: 'coding', nextPath: '/coding', nextState: null, meta: {} } })} className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-6 py-3 rounded-xl transition cursor-pointer">
          Skip to Coding Test <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  const progress = currentQ ? ((currentQ.number - 1) / currentQ.total) * 100 : 100

  return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={3} />

      {/* Header */}
      <div className="border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/20 backdrop-blur px-6 py-3 flex-shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">AI Interviewer</p>
              <p className="text-slate-500 text-xs">{jobTitle || 'Technical Interview'}</p>
            </div>
          </div>
          {!completed && currentQ ? (
            <div className="flex items-center gap-4">
              {!completed && <Timer totalSeconds={timeRemaining} onExpire={handleFinishEarly} />}
              <div className="text-right">
                <p className="text-slate-500 text-xs">Question {currentQ.number} of {currentQ.total}</p>
                <div className="w-32 h-1.5 bg-slate-100 dark:bg-white/10 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
          ) : completed ? (
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Complete
            </div>
          ) : null}
        </div>
      </div>

      {/* Body: chat + camera side by side */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chat */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-2xl mx-auto space-y-4">
            {history.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${msg.role === 'ai' ? 'bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-200 dark:bg-slate-700/50 border border-slate-300 dark:border-white/10'}`}>
                  {msg.role === 'ai' ? <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> : <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                </div>
                <div className={`max-w-[80%] space-y-1.5 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.role === 'ai' && msg.qNum && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">Q{msg.qNum}/{msg.total}</span>
                      {msg.skill && (
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-medium ${CATEGORY_COLORS[msg.category] || 'text-slate-500 bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>{msg.skill}</span>
                      )}
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'ai' ? 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 shadow-sm dark:shadow-none rounded-tl-sm' : 'bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-slate-100 rounded-tr-sm'}`}>
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            {submitting && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                  <span className="text-slate-500 text-sm">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Camera panel */}
        <div className="w-52 border-l border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex-shrink-0 flex flex-col items-center pt-6 px-3 gap-3">
          <BehaviorCamera ref={cameraRef} compact />
          <p className="text-slate-400 dark:text-slate-600 text-[10px] text-center px-2 leading-relaxed">Your camera feed is analyzed locally for behavioral patterns</p>
        </div>
      </div>

      {/* Input / completion footer */}
      <div className="border-t border-slate-200 dark:border-white/10 bg-white/80 dark:bg-black/20 backdrop-blur px-6 py-4 flex-shrink-0">
        <div className="max-w-2xl mx-auto">
          {!completed ? (
            <div className="space-y-2">
              {error && <p className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>}
              <div className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer… (Ctrl+Enter to submit)"
                  rows={3}
                  disabled={submitting}
                  className="flex-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:ring-indigo-500/20 transition resize-none text-sm disabled:opacity-50"
                />
                <button onClick={handleSubmit} disabled={!answer.trim() || submitting}
                  className="w-11 h-11 flex items-center justify-center bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition shadow-lg shadow-indigo-500/20 cursor-pointer">
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button onClick={handleFinishEarly} disabled={submitting}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer underline underline-offset-2">
                  Skip / finish interview early
                </button>
                <p className="text-slate-400 dark:text-slate-600 text-xs">Ctrl+Enter to submit</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {result && (
                <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none rounded-xl px-5 py-3 flex items-center justify-between">
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">Interview Score</p>
                  <p className={`text-2xl font-bold ${result.percentage >= 70 ? 'text-emerald-600 dark:text-emerald-400' : result.percentage >= 45 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>{result.percentage}%</p>
                </div>
              )}
              <button onClick={() => {
                  const codingDone = localStorage.getItem(`plt_submitted_${candidateId}`) === 'true'
                  navigate(codingDone ? '/report' : '/coding')
                }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
                {localStorage.getItem(`plt_submitted_${candidateId}`) === 'true' ? 'View Final Report' : 'Continue to Coding Test'} <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
