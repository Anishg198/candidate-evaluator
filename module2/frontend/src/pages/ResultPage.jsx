import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getResult } from '../api'
import ScoreRing from '../components/ScoreRing'
import { Home, ChevronDown, ChevronUp, CheckCircle2, XCircle, MinusCircle } from 'lucide-react'

function getGrade(pct) {
  if (pct >= 90) return 'A'
  if (pct >= 75) return 'B'
  if (pct >= 60) return 'C'
  return 'D'
}

function getGradeColor(g) {
  return g === 'A' ? 'text-emerald-400' : g === 'B' ? 'text-indigo-400' : g === 'C' ? 'text-amber-400' : 'text-red-400'
}

export default function ResultPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [result, setResult] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    // Try sessionStorage first (set by TestPage on submit)
    const stored = sessionStorage.getItem(`result_${sessionId}`)
    if (stored) { setResult(JSON.parse(stored)); return }
    // Fallback: fetch from API (handles page refresh / direct URL)
    getResult(sessionId).then(setResult).catch(() => {})
  }, [sessionId])

  if (!result) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-slate-400">
      <p>Result not found.</p>
      <button onClick={() => navigate('/')} className="text-indigo-400 hover:text-indigo-300 underline text-sm">
        Go home
      </button>
    </div>
  )

  const pct = result.percentage || 0
  const grade = getGrade(pct)

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
          <p className="text-slate-400 text-sm mb-6">Assessment Complete</p>
          <div className="flex flex-col items-center gap-4">
            <ScoreRing percentage={pct} grade={grade} />
            <div>
              <span className={`text-6xl font-black ${getGradeColor(grade)}`}>{grade}</span>
              <p className="text-slate-400 text-sm mt-1">{result.score} / {result.total} points</p>
            </div>
          </div>
        </div>

        {/* Skill breakdown */}
        {result.breakdown && result.breakdown.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="font-semibold text-slate-100">Breakdown by Skill</h2>
            </div>
            {result.breakdown.map((row, i) => {
              const skillPct = row.max_points > 0 ? (row.points / row.max_points) * 100 : 0
              return (
                <div key={i} className="px-6 py-4 border-b border-white/5 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-100 font-medium text-sm">{row.skill}</span>
                      <span className="text-xs text-slate-500">{row.questions_correct}/{row.questions_attempted} correct</span>
                    </div>
                    <span className="text-slate-300 text-sm font-semibold">{row.points.toFixed(1)} / {row.max_points}</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${skillPct}%`,
                        background: skillPct >= 75 ? '#10b981' : skillPct >= 50 ? '#6366f1' : '#ef4444'
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Per-question answers */}
        {result.breakdown_questions && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="font-semibold text-slate-100">Answer Review</h2>
            </div>
            {result.breakdown_questions.map((row, i) => {
              const isOpen = expanded === i
              const color = row.is_correct ? 'text-emerald-400' : row.similarity_score > 0.3 ? 'text-amber-400' : 'text-red-400'
              const Icon = row.is_correct ? CheckCircle2 : row.similarity_score > 0.3 ? MinusCircle : XCircle
              return (
                <div key={i} className="border-b border-white/5 last:border-0">
                  <button
                    onClick={() => setExpanded(isOpen ? null : i)}
                    className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/5 transition cursor-pointer"
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-200 text-sm font-medium line-clamp-1">{row.question_text}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{row.skill} · {row.type === 'mcq' ? 'MCQ' : 'Short Answer'}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-sm font-semibold ${color}`}>{row.points_awarded}/{row.max_points}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 space-y-3 bg-white/[0.02]">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Your answer</p>
                        <p className="text-sm text-slate-300 bg-white/5 rounded-lg px-3 py-2">{row.candidate_answer || <em className="text-slate-500">No answer</em>}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Correct answer</p>
                        <p className="text-sm text-emerald-300 bg-emerald-500/10 rounded-lg px-3 py-2">{row.correct_answer}</p>
                      </div>
                      {row.similarity_score != null && (
                        <p className="text-xs text-slate-500">Similarity score: <span className="text-slate-300">{(row.similarity_score * 100).toFixed(1)}%</span></p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/10 text-slate-300 hover:border-white/20 hover:text-slate-100 transition cursor-pointer"
        >
          <Home className="w-4 h-4" /> Back to Home
        </button>
      </div>
    </div>
  )
}
