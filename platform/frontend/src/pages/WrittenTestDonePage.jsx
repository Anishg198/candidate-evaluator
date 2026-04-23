import { useNavigate } from 'react-router-dom'
import PipelineBar from '../components/PipelineBar'
import { CheckCircle2, ChevronRight, Bot, Code2 } from 'lucide-react'

export default function WrittenTestDonePage() {
  const navigate = useNavigate()
  const candidateId = localStorage.getItem('plt_candidate_id') || ''
  // migrate: remove old unscoped key if the scoped one isn't set
  if (localStorage.getItem('plt_m3_session') && !localStorage.getItem(`plt_m3_session_${candidateId}`)) {
    localStorage.removeItem('plt_m3_session')
  }
  const interviewDone = !!localStorage.getItem(`plt_m3_session_${candidateId}`)
  const codingDone = localStorage.getItem(`plt_submitted_${candidateId}`) === 'true'

  const goToInterview = () =>
    navigate('/instructions', {
      state: { testType: 'interview', nextPath: '/interview', nextState: null, meta: {} },
    })

  const goToCoding = () =>
    navigate('/instructions', {
      state: { testType: 'coding', nextPath: '/coding', nextState: null, meta: {} },
    })

  return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={3} />
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Written Test Complete!</h1>
            <p className="text-slate-500 mt-2">Your answers have been submitted and graded. Continue with the remaining assessments below.</p>
          </div>

          <div className="space-y-3 text-left">
            {/* AI Interview card */}
            <div className={`bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border rounded-2xl p-5 ${interviewDone ? 'border-emerald-200 dark:border-emerald-500/30' : 'border-indigo-200 dark:border-indigo-500/30'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${interviewDone ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30'}`}>
                    {interviewDone
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                      : <Bot className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />}
                  </div>
                  <div>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">AI Technical Interview</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {interviewDone
                        ? 'Completed'
                        : '5 questions — 3 technical + 2 behavioral, answered by typing'}
                    </p>
                  </div>
                </div>
                {!interviewDone && (
                  <button onClick={goToInterview}
                    className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 transition cursor-pointer">
                    Start <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Coding Test card */}
            <div className={`bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border rounded-2xl p-5 ${codingDone ? 'border-emerald-200 dark:border-emerald-500/30' : 'border-slate-200 dark:border-white/10'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${codingDone ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                    {codingDone
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                      : <Code2 className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
                  </div>
                  <div>
                    <p className="text-slate-800 dark:text-slate-200 font-semibold text-sm">Coding Assessment</p>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {codingDone ? 'Completed' : 'Solve 2 of 3 algorithmic problems in your preferred language'}
                    </p>
                  </div>
                </div>
                {!codingDone && (
                  <button onClick={goToCoding}
                    className="flex-shrink-0 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl bg-slate-800 dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 text-white transition cursor-pointer">
                    Start <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {interviewDone && codingDone && (
            <button onClick={() => navigate('/report')}
              className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 cursor-pointer">
              View Final Report <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
