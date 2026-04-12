import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateTest } from '../api'
import { Brain, ChevronRight, Loader2 } from 'lucide-react'

const ALL_SKILLS = ['Python', 'SQL', 'Java', 'JavaScript', 'C++', 'Data Structures', 'Algorithms', 'OOP', 'OS', 'Networks']
const DIFFICULTIES = ['easy', 'medium', 'hard']
const QUESTION_COUNTS = [5, 10, 15]

export default function StartPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    candidate_id: '',
    skills: [],
    difficulty: 'medium',
    num_questions: 10,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const toggleSkill = (skill) =>
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.candidate_id) return setError('Please fill all fields.')
    if (form.skills.length === 0) return setError('Select at least one skill.')
    setLoading(true)
    try {
      const data = await generateTest(form)
      if (data.session_id) navigate(`/test/${data.session_id}`, { state: { questions: data.questions, duration: data.duration_minutes } })
      else setError(data.detail || 'Failed to generate test. Try again.')
    } catch {
      setError('Cannot connect to server. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 mb-4">
            <Brain className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Written Assessment</h1>
          <p className="text-slate-400 mt-2">AI-powered adaptive test — HCL Evaluation Platform</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-6">
          {/* Name & Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="John Doe"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
              />
            </div>
          </div>

          {/* Candidate ID */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Candidate ID</label>
            <input
              type="text"
              value={form.candidate_id}
              onChange={(e) => setForm({ ...form, candidate_id: e.target.value })}
              placeholder="e.g. CAND-2024-001"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">Select Skills <span className="text-slate-500">(pick at least one)</span></label>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => {
                const active = form.skills.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Difficulty & Questions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm({ ...form, difficulty: d })}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border capitalize transition-all cursor-pointer ${
                      form.difficulty === d
                        ? d === 'easy' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : d === 'medium' ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-red-500/20 border-red-500/50 text-red-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Questions</label>
              <div className="flex gap-2">
                {QUESTION_COUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setForm({ ...form, num_questions: n })}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                      form.num_questions === n
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating Test…</>
            ) : (
              <>Start Test <ChevronRight className="w-5 h-5" /></>
            )}
          </button>

          <p className="text-center text-slate-500 text-xs">
            Test duration: 30 minutes · Questions are AI-generated
          </p>
        </form>
      </div>
    </div>
  )
}
