import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProblem, runCode, submitCode } from '../api'
import PipelineBar from '../components/PipelineBar'
import CodeEditor, { DEFAULT_CODE } from '../components/CodeEditor'
import LanguageSelector, { LANGUAGES } from '../components/LanguageSelector'
import TestResults from '../components/TestResults'
import BehaviorCamera from '../components/BehaviorCamera'
import Timer from '../components/Timer'
import { ArrowLeft, Play, Send, Loader2, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'

const CODING_DURATION = 45 * 60

function getCodingTimeRemaining(candidateId) {
  const key = `plt_coding_start_${candidateId}`
  const stored = localStorage.getItem(key)
  if (stored) return Math.max(0, CODING_DURATION - Math.floor((Date.now() - parseInt(stored)) / 1000))
  localStorage.setItem(key, String(Date.now()))
  return CODING_DURATION
}

const DIFF_STYLES = {
  easy: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400',
  hard: 'bg-red-50 dark:bg-red-500/15 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400',
}

function saveCompletion(candidateId, problemId, result) {
  try {
    const key = `plt_completions_${candidateId}`
    const existing = JSON.parse(localStorage.getItem(key) || '{}')
    if (!existing[problemId] || result.passed_tests >= (existing[problemId].passed || 0)) {
      existing[problemId] = { accepted: result.status === 'Accepted', passed: result.passed_tests, total: result.total_tests, score: result.score }
      localStorage.setItem(key, JSON.stringify(existing))
    }
  } catch {}
}

export default function CodingEditorPage() {
  const { problemId } = useParams()
  const navigate = useNavigate()
  const candidateId = localStorage.getItem('plt_candidate_id') || 'anonymous'
  const cameraRef = useRef(null)

  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [code, setCode] = useState(DEFAULT_CODE[71])
  const [running, setRunning] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [resultMode, setResultMode] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState('')
  const [expandExamples, setExpandExamples] = useState(true)
  const [justAccepted, setJustAccepted] = useState(false)
  const [timeRemaining] = useState(() => getCodingTimeRemaining(candidateId))

  const handleTimerExpire = useCallback(() => {
    localStorage.setItem(`plt_submitted_${candidateId}`, 'true')
    const behaviorScore = cameraRef.current?.getScore() ?? null
    if (behaviorScore !== null) localStorage.setItem('plt_behavior_coding', String(behaviorScore))
    navigate('/report')
  }, [candidateId, navigate])

  const getStarter = (prob, langId) => prob?.starter_code?.[String(langId)] || DEFAULT_CODE[langId] || ''

  useEffect(() => {
    if (!candidateId || candidateId === 'anonymous') { navigate('/cv'); return }
    getProblem(problemId)
      .then((p) => { setProblem(p); setCode(getStarter(p, language.id)) })
      .catch(() => setError('Failed to load problem.'))
      .finally(() => setLoading(false))
  }, [problemId])

  const handleLangChange = (lang) => {
    setLanguage(lang)
    setCode(getStarter(problem, lang.id))
    setResult(null)
    setShowResults(false)
  }

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError('')
    setJustAccepted(false)
    try {
      const data = await runCode(problemId, { language_id: language.id, source_code: code })
      setResult(data); setResultMode('run'); setShowResults(true)
    } catch { setError('Run failed.') }
    finally { setRunning(false) }
  }, [code, language, problemId])

  const handleSubmit = useCallback(async () => {
    setSubmitting(true)
    setError('')
    setJustAccepted(false)
    try {
      const data = await submitCode(problemId, { candidate_id: candidateId, language_id: language.id, source_code: code })
      setResult(data); setResultMode('submit'); setShowResults(true)
      saveCompletion(candidateId, problemId, data)
      if (data.status === 'Accepted') setJustAccepted(true)
    } catch { setError('Submission failed.') }
    finally { setSubmitting(false) }
  }, [code, language, problemId, candidateId])

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={4} />
      <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col" style={{ height: '100vh' }}>
      <div className="fixed bottom-4 right-4 z-50"><BehaviorCamera ref={cameraRef} compact /></div>
      <PipelineBar currentStep={4} />

      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/30 backdrop-blur">
        <button onClick={() => navigate('/coding')} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition text-sm cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Problems
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-white/10" />
        <h1 className="text-slate-800 dark:text-slate-100 font-semibold text-sm truncate flex-1">{problem?.title}</h1>
        {problem && <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border capitalize ${DIFF_STYLES[problem.difficulty]}`}>{problem.difficulty}</span>}
      </header>

      {justAccepted && (
        <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 border-b border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
          <CheckCircle2 className="w-4 h-4" /> All test cases passed!
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Problem panel */}
        <div className="w-[42%] flex-shrink-0 border-r border-slate-200 dark:border-white/10 overflow-y-auto p-6 space-y-5 bg-white dark:bg-transparent">
          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{problem?.description}</p>

          {problem?.examples?.length > 0 && (
            <div>
              <button onClick={() => setExpandExamples((e) => !e)} className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 cursor-pointer">
                Examples {expandExamples ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {expandExamples && problem.examples.map((ex, i) => (
                <div key={i} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 space-y-2 mb-2">
                  <div><span className="text-xs text-slate-500">Input</span><pre className="text-xs font-mono text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{ex.input}</pre></div>
                  <div><span className="text-xs text-slate-500">Output</span><pre className="text-xs font-mono text-emerald-600 dark:text-emerald-300 mt-1">{ex.output}</pre></div>
                </div>
              ))}
            </div>
          )}

          {problem?.visible_test_cases?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Sample Test Cases</h3>
              <div className="space-y-2">
                {problem.visible_test_cases.map((tc, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-3 grid grid-cols-2 gap-3">
                    <div><p className="text-xs text-slate-500 mb-1">Input</p><pre className="text-xs font-mono text-slate-700 dark:text-slate-300">{tc.input}</pre></div>
                    <div><p className="text-xs text-slate-500 mb-1">Expected</p><pre className="text-xs font-mono text-emerald-600 dark:text-emerald-300">{tc.expected_output}</pre></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Editor panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
            <LanguageSelector value={language.id} onChange={handleLangChange} />
            <div className="flex-1" />
            {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
            <Timer totalSeconds={timeRemaining} onExpire={handleTimerExpire} />
            <button onClick={handleRun} disabled={running || submitting}
              className="flex items-center gap-2 bg-white dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 disabled:opacity-50 text-slate-700 dark:text-slate-200 text-sm font-semibold px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 transition cursor-pointer">
              {running ? <><Loader2 className="w-4 h-4 animate-spin" />Running…</> : <><Play className="w-4 h-4" />Run</>}
            </button>
            <button onClick={handleSubmit} disabled={running || submitting}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition shadow-lg shadow-indigo-500/20 cursor-pointer">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting…</> : <><Send className="w-4 h-4" />Submit</>}
            </button>
          </div>

          <div className={`transition-all duration-300 ${showResults && result ? 'h-[55%]' : 'flex-1'} overflow-hidden`}>
            <CodeEditor languageId={language.id} value={code} onChange={setCode} />
          </div>

          {showResults && result && (
            <div className="flex-shrink-0 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 overflow-y-auto" style={{ maxHeight: '45%' }}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {resultMode === 'run' ? 'Run Results' : 'Submission Results'}
                  </h3>
                  <button onClick={() => setShowResults(false)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">Hide</button>
                </div>
                <TestResults result={result} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
