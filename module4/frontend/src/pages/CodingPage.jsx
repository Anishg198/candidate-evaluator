import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProblem, submitCode } from '../api'
import CodeEditor, { DEFAULT_CODE } from '../components/CodeEditor'
import LanguageSelector, { LANGUAGES } from '../components/LanguageSelector'
import TestResults from '../components/TestResults'
import { ArrowLeft, Play, Loader2, ChevronDown, ChevronUp, Clock, Zap } from 'lucide-react'

const DIFF_STYLES = {
  easy: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
  medium: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
  hard: 'bg-red-500/15 border-red-500/30 text-red-400',
}

export default function CodingPage() {
  const { problemId } = useParams()
  const navigate = useNavigate()
  const [problem, setProblem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [language, setLanguage] = useState(LANGUAGES[0])
  const [code, setCode] = useState(DEFAULT_CODE[71])
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState('')
  const [expandExamples, setExpandExamples] = useState(true)

  const candidateId = localStorage.getItem('hcl_candidate_id') || 'anonymous'

  const getStarter = (prob, langId) =>
    (prob?.starter_code?.[String(langId)]) || DEFAULT_CODE[langId] || ''

  useEffect(() => {
    getProblem(problemId)
      .then(p => {
        setProblem(p)
        setCode(getStarter(p, language.id))
      })
      .catch(() => setError('Failed to load problem.'))
      .finally(() => setLoading(false))
  }, [problemId])

  const handleLangChange = (lang) => {
    setLanguage(lang)
    setCode(getStarter(problem, lang.id))
    setResult(null)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const data = await submitCode(problemId, {
        candidate_id: candidateId,
        language_id: language.id,
        source_code: code,
      })
      setResult(data)
      setShowResults(true)
    } catch {
      setError('Submission failed. Is Judge0 running?')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
    </div>
  )

  if (!problem && error) return (
    <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-400">
      <p>{error}</p>
      <button onClick={() => navigate('/')} className="text-indigo-400 hover:text-indigo-300 underline text-sm">Back</button>
    </div>
  )

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-black/30 backdrop-blur">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Problems
        </button>
        <div className="w-px h-4 bg-white/10" />
        <h1 className="text-slate-100 font-semibold text-sm truncate flex-1">{problem?.title}</h1>
        {problem && (
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border capitalize ${DIFF_STYLES[problem.difficulty]}`}>
            {problem.difficulty}
          </span>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3 h-3" />{problem?.time_limit_seconds}s
          <Zap className="w-3 h-3 ml-1" />{problem?.memory_limit_mb}MB
        </div>
      </header>

      {/* Body: 2-column split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem panel */}
        <div className="w-[42%] flex-shrink-0 border-r border-white/10 overflow-y-auto p-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-100 mb-3">{problem?.title}</h2>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{problem?.description}</p>
          </div>

          {/* Examples */}
          {problem?.examples?.length > 0 && (
            <div>
              <button
                onClick={() => setExpandExamples((e) => !e)}
                className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-2 cursor-pointer"
              >
                Examples
                {expandExamples ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>
              {expandExamples && problem.examples.map((ex, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 mb-2">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Input</span>
                    <pre className="text-xs font-mono text-slate-300 mt-1 whitespace-pre-wrap">{ex.input}</pre>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-medium">Output</span>
                    <pre className="text-xs font-mono text-emerald-300 mt-1">{ex.output}</pre>
                  </div>
                  {ex.explanation && (
                    <p className="text-xs text-slate-500 italic">{ex.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Constraints */}
          {problem?.constraints && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Constraints</h3>
              <p className="text-xs text-slate-400 font-mono bg-white/5 border border-white/10 rounded-xl px-4 py-3 leading-relaxed">
                {problem.constraints.split('|').map((c, i) => <span key={i}>{c.trim()}<br /></span>)}
              </p>
            </div>
          )}

          {/* Visible test cases */}
          {problem?.visible_test_cases?.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Sample Test Cases</h3>
              <div className="space-y-2">
                {problem.visible_test_cases.map((tc, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Input</p>
                      <pre className="text-xs font-mono text-slate-300">{tc.input}</pre>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Expected</p>
                      <pre className="text-xs font-mono text-emerald-300">{tc.expected_output}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Editor + Results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-white/10 bg-black/20">
            <LanguageSelector value={language.id} onChange={handleLangChange} />
            <div className="flex-1" />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-xl transition shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Running…</>
                : <><Play className="w-4 h-4" />Run & Submit</>}
            </button>
          </div>

          {/* Monaco editor */}
          <div className={`transition-all duration-300 ${showResults && result ? 'h-[55%]' : 'flex-1'} overflow-hidden`}>
            <CodeEditor languageId={language.id} value={code} onChange={setCode} />
          </div>

          {/* Results panel */}
          {showResults && result && (
            <div className="flex-shrink-0 border-t border-white/10 bg-black/20 overflow-y-auto" style={{ maxHeight: '45%' }}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-200">Results</h3>
                  <button onClick={() => setShowResults(false)} className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer">
                    Hide
                  </button>
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
