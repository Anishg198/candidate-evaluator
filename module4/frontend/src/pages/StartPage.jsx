import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Terminal, ChevronRight, AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { startSession } from '../api'

export default function StartPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', candidate_id: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleStart = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.candidate_id) {
      setError('Please fill all fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const session = await startSession({
        candidate_id: form.candidate_id,
        name: form.name,
        email: form.email,
      })
      localStorage.setItem('hcl_candidate_id', form.candidate_id)
      localStorage.setItem('hcl_candidate_name', form.name)
      localStorage.setItem('hcl_candidate_email', form.email)
      // Store the assigned problem IDs for this candidate
      localStorage.setItem(`hcl_session_problems_${form.candidate_id}`, JSON.stringify(session.problem_ids))
      localStorage.removeItem(`hcl_completions_${form.candidate_id}`)
      navigate('/problems')
    } catch (err) {
      setError('Failed to start session. Is the backend running?')
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
            <Terminal className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Coding Assessment</h1>
          <p className="text-slate-400 mt-2">Self-hosted execution · No internet required · HCL Evaluation Platform</p>
        </div>

        <form onSubmit={handleStart} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-5">
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

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Preparing your session…</>
            ) : (
              <>Begin Assessment <ChevronRight className="w-5 h-5" /></>
            )}
          </button>

          <p className="text-center text-slate-500 text-xs">
            3 problems · Python, JavaScript, Java, C++ supported
          </p>
        </form>
      </div>

      {/* HR Login link */}
      <Link
        to="/hr"
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-lg backdrop-blur"
      >
        <ShieldCheck className="w-4 h-4" />
        HR Login
      </Link>
    </div>
  )
}
