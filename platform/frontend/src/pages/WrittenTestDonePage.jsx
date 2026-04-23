import { useNavigate } from 'react-router-dom'
import PipelineBar from '../components/PipelineBar'
import { CheckCircle2, ChevronRight, Bot } from 'lucide-react'

export default function WrittenTestDonePage() {
  const navigate = useNavigate()

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
            <p className="text-slate-500 mt-2">Your answers have been submitted and graded.</p>
          </div>

          <div className="bg-white dark:bg-white/5 shadow-sm dark:shadow-none backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-left space-y-3">
            <p className="text-slate-700 dark:text-slate-300 font-medium text-sm flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> Next: AI Technical Interview
            </p>
            <p className="text-slate-500 text-sm">
              An AI interviewer will ask you 5 questions — 3 technical based on your skills and 2 behavioral.
              Type your answers and submit each one.
            </p>
          </div>

          <button onClick={() => navigate('/instructions', { state: { testType: 'interview', nextPath: '/interview', nextState: null, meta: {} } })}
            className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/25 cursor-pointer">
            Start Interview <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
