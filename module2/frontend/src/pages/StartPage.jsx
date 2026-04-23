import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { generateTest, parseResume } from '../api'
import GeneratingScreen from '../components/GeneratingScreen'
import { Brain, ChevronRight, Upload, FileText, X, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react'

const ALL_SKILLS = [
  'Python', 'SQL', 'Java', 'JavaScript', 'C++',
  'Data Structures', 'Algorithms', 'OOP', 'OS', 'Networks', 'Machine Learning',
]
const DIFFICULTIES = ['easy', 'medium', 'hard']
const QUESTION_COUNTS = [5, 10, 15]

export default function StartPage() {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [form, setForm] = useState({
    name: '', email: '', candidate_id: '',
    skills: [], difficulty: 'medium', num_questions: 10,
  })
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  // Resume state
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeState, setResumeState] = useState('idle') // idle | parsing | done | error
  const [resumeError, setResumeError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [autoDetected, setAutoDetected] = useState([])

  const toggleSkill = (skill) =>
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }))

  const handleResumeDrop = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) {
      setResumeError('Only PDF and DOCX files are supported.')
      return
    }
    setResumeFile(file)
    setResumeState('parsing')
    setResumeError('')
    setAutoDetected([])

    parseResume(file)
      .then((data) => {
        const detected = data.skills || []
        setAutoDetected(detected)
        setResumeState('done')
        // Merge detected skills into form without removing manually selected
        setForm((f) => ({
          ...f,
          skills: [...new Set([...f.skills, ...detected])],
          name: f.name || data.name || '',
          email: f.email || data.email || '',
        }))
      })
      .catch((msg) => {
        setResumeState('error')
        setResumeError(typeof msg === 'string' ? msg : 'Could not parse resume.')
      })
  }

  const clearResume = () => {
    setResumeFile(null)
    setResumeState('idle')
    setResumeError('')
    setAutoDetected([])
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.candidate_id) return setError('Please fill all fields.')
    if (form.skills.length === 0) return setError('Select at least one skill.')
    setGenerating(true)
    try {
      const data = await generateTest(form)
      if (data.session_id) {
        sessionStorage.setItem('candidate_name', form.name)
        sessionStorage.setItem('candidate_id', form.candidate_id)
        navigate(`/test/${data.session_id}`, { state: { questions: data.questions, duration: data.duration_minutes } })
      } else {
        setError(data.detail || 'Failed to generate test. Try again.')
        setGenerating(false)
      }
    } catch {
      setError('Cannot connect to server. Is the backend running?')
      setGenerating(false)
    }
  }

  if (generating) return <GeneratingScreen />

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 mb-4">
            <Brain className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold text-slate-100">Written Assessment</h1>
          <p className="text-slate-400 mt-2">AI-powered adaptive test — HCL Evaluation Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Resume Upload ───────────────────────────────────── */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <p className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              Upload Resume <span className="text-slate-500 font-normal">(optional — auto-fills skills)</span>
            </p>

            {!resumeFile ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleResumeDrop(e.dataTransfer.files[0]) }}
                onClick={() => fileRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? 'border-indigo-400/70 bg-indigo-500/10'
                    : 'border-white/15 hover:border-indigo-400/40 hover:bg-white/[0.03]'
                }`}
              >
                <FileText className="w-8 h-8 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-300 text-sm font-medium">Drop your resume here</p>
                <p className="text-slate-500 text-xs mt-1">or click to browse · PDF or DOCX · max 10 MB</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => handleResumeDrop(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-slate-200 text-sm font-medium truncate">{resumeFile.name}</p>
                  {resumeState === 'parsing' && (
                    <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                      <Loader2 className="w-3 h-3 animate-spin" /> Extracting skills…
                    </p>
                  )}
                  {resumeState === 'done' && (
                    <p className="text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
                      <CheckCircle2 className="w-3 h-3" />
                      {autoDetected.length > 0
                        ? `Detected: ${autoDetected.join(', ')}`
                        : 'Parsed — no matching skills detected, select manually'}
                    </p>
                  )}
                  {resumeState === 'error' && (
                    <p className="text-red-400 text-xs flex items-center gap-1 mt-0.5">
                      <AlertCircle className="w-3 h-3" /> {resumeError}
                    </p>
                  )}
                </div>
                <button type="button" onClick={clearResume} className="text-slate-500 hover:text-slate-300 transition flex-shrink-0 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ── Candidate Details ───────────────────────────────── */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
            <p className="text-sm font-medium text-slate-300">Candidate Details</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="john@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Candidate ID</label>
              <input
                type="text"
                value={form.candidate_id}
                onChange={(e) => setForm({ ...form, candidate_id: e.target.value })}
                placeholder="e.g. CAND-2024-001"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition text-sm"
              />
            </div>
          </div>

          {/* ── Skills ─────────────────────────────────────────── */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <p className="text-sm font-medium text-slate-300 mb-4">
              Skills <span className="text-slate-500 font-normal">(select at least one)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((skill) => {
                const active = form.skills.includes(skill)
                const wasAutoDetected = autoDetected.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`relative px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 shadow-lg shadow-indigo-500/10'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
                    }`}
                  >
                    {skill}
                    {wasAutoDetected && active && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0a0f]" />
                    )}
                  </button>
                )
              })}
            </div>
            {autoDetected.length > 0 && (
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full" />
                Green dot = auto-detected from resume
              </p>
            )}
          </div>

          {/* ── Difficulty & Count ──────────────────────────────── */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Difficulty</p>
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
                <p className="text-sm font-medium text-slate-300 mb-3">Questions</p>
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
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={resumeState === 'parsing'}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            Start Test <ChevronRight className="w-5 h-5" />
          </button>

          <p className="text-center text-slate-500 text-xs">
            Test duration: 30 minutes · Questions are AI-generated
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
