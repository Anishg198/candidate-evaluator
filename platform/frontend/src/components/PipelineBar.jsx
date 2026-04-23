import { CheckCircle2, Circle } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'CV Scan', short: 'CV' },
  { id: 2, label: 'Written Test', short: 'Written' },
  { id: 3, label: 'Interview', short: 'Interview' },
  { id: 4, label: 'Coding Test', short: 'Coding' },
  { id: 5, label: 'Final Report', short: 'Report' },
]

export default function PipelineBar({ currentStep }) {
  return (
    <div className="w-full bg-white/90 dark:bg-black/30 backdrop-blur border-b border-slate-200 dark:border-white/10">
      <div className="max-w-4xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-1">
          {STEPS.map((step, idx) => {
            const done = step.id < currentStep
            const active = step.id === currentStep
            const future = step.id > currentStep

            return (
              <div key={step.id} className="flex items-center gap-1 flex-1 min-w-0">
                <div className={`flex items-center gap-2 flex-shrink-0 ${future ? 'opacity-40' : ''}`}>
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  ) : active ? (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 border-2 border-indigo-300 flex-shrink-0 animate-pulse" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                  )}
                  <div className="hidden sm:block">
                    <p className={`text-xs font-semibold leading-none ${done ? 'text-emerald-500 dark:text-emerald-400' : active ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400 dark:text-slate-500'}`}>
                      {step.label}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${active ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-600'}`}>
                      Step {step.id}
                    </p>
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${done ? 'bg-emerald-400/50' : 'bg-slate-200 dark:bg-white/10'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
