import { Progress } from './ui/progress'

export default function MatchScoreBar({ score = 0, showLabel = true, showPercent = true }) {
  const safeScore = Math.max(0, Math.min(100, score))
  const indicatorClassName =
    safeScore >= 75 ? 'bg-slate-900' : safeScore >= 55 ? 'bg-slate-700' : 'bg-slate-500'

  return (
    <div className="w-full">
      {showLabel && (
        <div className="mb-2 flex items-center justify-between text-sm font-medium text-slate-700">
          <span>Match Score</span>
          {showPercent && <span>{safeScore.toFixed(1)}%</span>}
        </div>
      )}
      <Progress value={safeScore} indicatorClassName={indicatorClassName} />
      {!showLabel && showPercent && (
        <div className="mt-2 text-right text-xs font-medium text-slate-500">{safeScore.toFixed(1)}%</div>
      )}
    </div>
  )
}
