export default function ScoreRing({ percentage, grade }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const offset = circ - (percentage / 100) * circ

  const gradeColor =
    grade === 'A' ? '#10b981'
    : grade === 'B' ? '#6366f1'
    : grade === 'C' ? '#f59e0b'
    : '#ef4444'

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r}
          fill="none"
          stroke={gradeColor}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 8px ${gradeColor}88)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-slate-100">{Math.round(percentage)}%</span>
        <span className="text-xs text-slate-400 mt-0.5">Score</span>
      </div>
    </div>
  )
}
