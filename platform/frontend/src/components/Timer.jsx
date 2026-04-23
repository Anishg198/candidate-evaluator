import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'

export default function Timer({ totalSeconds, onExpire }) {
  const [remaining, setRemaining] = useState(totalSeconds)

  useEffect(() => { setRemaining(totalSeconds) }, [totalSeconds])

  useEffect(() => {
    if (remaining <= 0) { onExpire?.(); return }
    const id = setInterval(() => setRemaining((r) => r - 1), 1000)
    return () => clearInterval(id)
  }, [remaining, onExpire])

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const critical = remaining < 300

  return (
    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-lg font-semibold tabular-nums transition-all ${
      critical
        ? 'bg-red-500/15 border-red-500/40 text-red-500 dark:text-red-400 animate-pulse'
        : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200'
    }`}>
      <Clock className="w-4 h-4" />
      {mins}:{secs}
    </div>
  )
}
