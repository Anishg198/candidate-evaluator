import { Check } from 'lucide-react'
import { cn } from '../lib/utils'

const steps = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Resume' },
  { id: 3, label: 'Review' }
]

export default function OnboardingShell({
  step = 1,
  title,
  description,
  children,
  compact = false
}) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          {steps.map((item) => {
            const isComplete = step > item.id
            const isActive = step === item.id

            return (
              <div key={item.id} className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold',
                    isComplete && 'border-slate-900 bg-slate-900 text-white',
                    isActive && 'border-slate-900 bg-slate-900 text-white',
                    !isComplete && !isActive && 'border-slate-300 bg-white text-slate-500'
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : item.id}
                </div>
                <div className="min-w-[72px]">
                  <p className={cn('text-xs uppercase tracking-wide', isActive ? 'text-slate-900' : 'text-slate-400')}>
                    Step {item.id}
                  </p>
                  <p className={cn('text-sm font-medium', isActive ? 'text-slate-900' : 'text-slate-500')}>
                    {item.label}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className={cn('max-w-2xl', compact && 'max-w-xl')}>
          <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
          {description && <p className="mt-2 text-slate-600">{description}</p>}
        </div>
      </div>

      {children}
    </main>
  )
}
