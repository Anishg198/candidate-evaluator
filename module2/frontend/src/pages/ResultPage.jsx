import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, Mail } from 'lucide-react'

export default function ResultPage() {
  const { sessionId } = useParams()
  const navigate = useNavigate()

  const candidateName = sessionStorage.getItem('candidate_name') || ''
  const candidateId = sessionStorage.getItem('candidate_id') || ''

  useEffect(() => {
    if (!sessionId) navigate('/')
  }, [sessionId])

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-slate-100">
            Thank You{candidateName ? `, ${candidateName}` : ''}!
          </h1>
          <p className="text-slate-400 text-lg">Your assessment has been submitted successfully.</p>
        </div>

        {/* Info card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-slate-200 font-medium text-sm">What happens next?</p>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                Our HR team will review your submission and get back to you within{' '}
                <span className="text-slate-200 font-medium">3–5 business days</span>. Please keep an eye on your email for further communication.
              </p>
            </div>
          </div>

          {candidateId && (
            <div className="border-t border-white/10 pt-4">
              <p className="text-slate-500 text-xs">
                Candidate ID: <span className="text-slate-400 font-mono">{candidateId}</span>
              </p>
              <p className="text-slate-500 text-xs mt-1">Please keep this ID handy for future reference.</p>
            </div>
          )}
        </div>

        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white font-medium py-3 rounded-xl transition cursor-pointer"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
