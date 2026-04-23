import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateTest } from '../api'
import PipelineBar from '../components/PipelineBar'
import { Brain, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'

const ALL_SKILLS = ['Python', 'SQL', 'Java', 'JavaScript', 'C++', 'Data Structures', 'Algorithms', 'OOP', 'OS', 'Networks', 'Machine Learning']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const QUESTION_COUNTS = [5, 10, 15]

export default function WrittenTestStartPage() {
  const navigate = useNavigate()
  const candidateId = localStorage.getItem('plt_candidate_id') || ''
  const candidateName = localStorage.getItem('plt_candidate_name') || ''
  const candidateEmail = localStorage.getItem('plt_candidate_email') || ''
  const cvSkills = JSON.parse(localStorage.getItem('plt_skills') || '[]')

  const [skills, setSkills] = useState(cvSkills.filter((s) => ALL_SKILLS.includes(s)))
  const [difficulty, setDifficulty] = useState('medium')
  const [numQuestions, setNumQuestions] = useState(10)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!candidateId) {
    navigate('/cv')
    return null
  }

  const toggle = (skill) =>
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill])

  const handleStart = async () => {
    if (skills.length === 0) { setError('Select at least one skill.'); return }
    setError('')
    setLoading(true)
    try {
      const data = await generateTest({ name: candidateName, email: candidateEmail, candidate_id: candidateId, skills, difficulty, num_questions: numQuestions })
      if (data.session_id) {
        localStorage.setItem('plt_m2_session', data.session_id)
        navigate(`/written-test/${data.session_id}`, { state: { questions: data.questions, duration: data.duration_minutes } })
      } else {
        setError(data.detail || 'Failed to generate test.')
        setLoading(false)
      }
    } catch {
      setError('Cannot connect to Module 2 backend. Is it running?')
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={2} />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
          <Brain className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
        </div>
        <p className="text-slate-700 dark:text-slate-300 font-medium">Generating your personalised test…</p>
        <p className="text-slate-500 text-sm">This takes 15–30 seconds</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={2} />
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl space-y-5">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Written Assessment</h1>
            <p className="text-slate-500 mt-2">Confirm your skills and difficulty</p>
          </div>

          {/* Skills */}
          <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Skills <span className="text-slate-400 font-normal">(auto-detected from CV — adjust if needed)</span></p>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => {
                const active = skills.includes(skill)
                const fromCv = cvSkills.includes(skill)
                return (
                  <button key={skill} type="button" onClick={() => toggle(skill)}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                      active
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300 shadow-sm dark:shadow-lg dark:shadow-indigo-500/10'
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 hover:text-slate-800 dark:hover:text-slate-300'
                    }`}>
                    {skill}
                    {fromCv && active && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-[#0a0a0f]" />}
                  </button>
                )
              })}
            </div>
            {cvSkills.length > 0 && <p className="text-xs text-slate-500 mt-3 flex items-center gap-1"><span className="inline-block w-2 h-2 bg-emerald-400 rounded-full" /> Green dot = auto-detected from resume</p>}
          </div>

          {/* Difficulty & Count */}
          <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Difficulty</p>
                <div className="flex gap-2">
                  {DIFFICULTIES.map((d) => (
                    <button key={d} type="button" onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border capitalize transition-all cursor-pointer ${
                        difficulty === d
                          ? d === 'easy' ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300' : d === 'medium' ? 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-300' : 'bg-red-100 dark:bg-red-500/20 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-300'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                      }`}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Questions</p>
                <div className="flex gap-2">
                  {QUESTION_COUNTS.map((n) => (
                    <button key={n} type="button" onClick={() => setNumQuestions(n)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                        numQuestions === n ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-300 dark:border-indigo-500/50 text-indigo-700 dark:text-indigo-300' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300 dark:hover:border-white/20'
                      }`}>{n}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {error && <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}</p>}

          <button onClick={handleStart} className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
            Start Written Test <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
