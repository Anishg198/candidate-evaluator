import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getJob, applyToJob, parseResume } from '../api'
import PipelineBar from '../components/PipelineBar'
import {
  FileText, Upload, X, Loader2, CheckCircle2, AlertCircle, ChevronRight, ArrowLeft, Brain,
} from 'lucide-react'

export default function ApplyPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [job, setJob] = useState(null)
  const [jobLoading, setJobLoading] = useState(true)
  const [form, setForm] = useState({ name: '', email: '' })
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeState, setResumeState] = useState('idle')
  const [cvData, setCvData] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getJob(jobId)
      .then(setJob)
      .catch(() => setError('Job not found.'))
      .finally(() => setJobLoading(false))
  }, [jobId])

  const handleDrop = (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['pdf', 'docx'].includes(ext)) { setError('Only PDF or DOCX.'); return }
    setResumeFile(file)
    setResumeState('parsing')
    setError('')
    parseResume(file)
      .then((data) => {
        setCvData(data)
        setResumeState('done')
        setForm((f) => ({ ...f, name: f.name || data.name || '', email: f.email || data.email || '' }))
      })
      .catch(() => setResumeState('error'))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email) { setError('Name and email required.'); return }
    setSubmitting(true)
    setError('')
    try {
      const result = await applyToJob(jobId, { name: form.name, email: form.email, cv_data: cvData })
      localStorage.setItem('plt_candidate_id', result.candidate_id)
      localStorage.setItem('plt_candidate_name', result.name || form.name)
      localStorage.setItem('plt_candidate_email', result.email || form.email)
      localStorage.setItem('plt_skills', JSON.stringify(result.merged_skills))
      localStorage.setItem('plt_difficulty', result.difficulty)
      localStorage.setItem('plt_num_questions', String(result.num_questions))
      localStorage.setItem('plt_job_title', result.job_title)
      localStorage.setItem('plt_cv_data', JSON.stringify(cvData || {}))
      navigate('/applied')
    } catch (e) {
      setError(typeof e === 'string' ? e : 'Application failed.')
      setSubmitting(false)
    }
  }

  if (jobLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={1} />
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-sm mb-6 transition">
            <ArrowLeft className="w-4 h-4" /> Back to jobs
          </Link>

          {job && (
            <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-2xl px-5 py-4 mb-6">
              <p className="text-indigo-700 dark:text-indigo-300 font-semibold text-sm">{job.title}</p>
              <p className="text-slate-500 text-xs mt-0.5">{job.company} · {job.required_skills.join(', ')}</p>
            </div>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Apply for this Role</h1>
            <p className="text-slate-500 mt-2">Upload your CV — we'll auto-detect your skills and generate a tailored test.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* CV Upload */}
            <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Upload className="w-4 h-4 text-sky-500 dark:text-sky-400" /> Upload Resume
                <span className="text-slate-400 font-normal">(optional but recommended)</span>
              </p>
              {!resumeFile ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); handleDrop(e.dataTransfer.files[0]) }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragOver ? 'border-sky-400 bg-sky-50 dark:bg-sky-500/10' : 'border-slate-200 dark:border-white/15 hover:border-sky-300 dark:hover:border-sky-400/40 hover:bg-slate-50 dark:hover:bg-white/[0.03]'}`}
                >
                  <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">Drop your resume here</p>
                  <p className="text-slate-400 text-xs mt-1">or click to browse · PDF or DOCX</p>
                  <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => handleDrop(e.target.files[0])} />
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3">
                  <FileText className="w-5 h-5 text-sky-500 dark:text-sky-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 dark:text-slate-200 text-sm font-medium truncate">{resumeFile.name}</p>
                    {resumeState === 'parsing' && <p className="text-slate-500 text-xs flex items-center gap-1 mt-0.5"><Loader2 className="w-3 h-3 animate-spin" /> Parsing…</p>}
                    {resumeState === 'done' && (
                      <p className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        {cvData?.skills?.length ? `${cvData.skills.length} skills detected: ${cvData.skills.slice(0, 4).join(', ')}${cvData.skills.length > 4 ? '…' : ''}` : 'Parsed — using job requirements for test'}
                      </p>
                    )}
                    {resumeState === 'error' && <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">Could not parse — test will use job skill requirements only</p>}
                  </div>
                  <button type="button" onClick={() => { setResumeFile(null); setResumeState('idle'); setCvData(null) }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 space-y-4">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Your Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Full Name</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe"
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com"
                    className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition text-sm" />
                </div>
              </div>
            </div>

            {/* Test preview */}
            {job && (
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/10 rounded-2xl px-5 py-4">
                <p className="text-slate-500 text-xs mb-2 flex items-center gap-1.5">
                  <Brain className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Your test will include
                </p>
                <div className="flex flex-wrap gap-2">
                  {job.required_skills.map((s) => (
                    <span key={s} className="px-3 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-medium">{s}</span>
                  ))}
                  {cvData?.skills?.length > 0 && <span className="text-slate-400 text-xs self-center">+ skills from your CV</span>}
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </p>
            )}

            <button type="submit" disabled={submitting || resumeState === 'parsing'}
              className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</> : <>Submit Application <ChevronRight className="w-5 h-5" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
