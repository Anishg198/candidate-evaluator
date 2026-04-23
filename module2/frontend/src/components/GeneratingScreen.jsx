import { useEffect, useState } from 'react'
import { Brain } from 'lucide-react'

const STEPS = [
  'Analysing your profile…',
  'Selecting questions for your skills…',
  'Calibrating difficulty level…',
  'Generating MCQ & short-answer questions…',
  'Finalising your personalised test…',
]

export default function GeneratingScreen() {
  const [stepIdx, setStepIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStepIdx((i) => (i + 1) % STEPS.length)
    }, 1800)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0f]">
      {/* Orbit rings */}
      <div className="relative w-40 h-40 mb-10">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-indigo-500/20 animate-[spin_4s_linear_infinite]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/60" />
        </div>
        {/* Middle ring */}
        <div className="absolute inset-5 rounded-full border border-violet-500/30 animate-[spin_2.5s_linear_infinite_reverse]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400/60" />
        </div>
        {/* Inner ring */}
        <div className="absolute inset-10 rounded-full border border-indigo-400/40 animate-[spin_1.5s_linear_infinite]">
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-300 shadow-md shadow-indigo-300/60" />
        </div>
        {/* Centre icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
            <Brain className="w-7 h-7 text-indigo-400" />
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-slate-100 mb-3">Generating Your Test</h2>

      {/* Step text with fade */}
      <p
        key={stepIdx}
        className="text-slate-400 text-sm text-center max-w-xs animate-[fadeIn_0.4s_ease]"
      >
        {STEPS[stepIdx]}
      </p>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === stepIdx ? 'w-6 bg-indigo-400' : 'w-1.5 bg-white/15'
            }`}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}
