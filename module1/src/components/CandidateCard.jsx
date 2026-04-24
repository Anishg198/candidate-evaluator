import MatchScoreBar from './MatchScoreBar'
import SkillBadge from './SkillBadge'
import { Button } from './ui/button'
import { Card } from './ui/card'

const rankClasses = {
  1: 'bg-slate-900 text-white',
  2: 'bg-slate-700 text-white',
  3: 'bg-slate-500 text-white'
}

const recClasses = {
  STRONG_MATCH: 'border border-slate-900 bg-slate-900 text-white',
  GOOD_MATCH: 'border border-slate-700 bg-slate-700 text-white',
  PARTIAL_MATCH: 'border border-slate-400 bg-slate-200 text-slate-900',
  WEAK_MATCH: 'border border-slate-300 bg-slate-100 text-slate-700'
}

export default function CandidateCard({
  candidate,
  matchResult,
  rank,
  onViewProfile,
  onRemoveCandidate
}) {
  return (
    <Card className="flex items-start gap-4 p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          rankClasses[rank] || 'bg-slate-100 text-slate-700'
        }`}
      >
        #{rank}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{candidate.name}</h3>
            <p className="text-sm text-slate-500">{candidate.email}</p>
          </div>
          <div className="w-full max-w-xs">
            <MatchScoreBar score={matchResult.overallScore} showLabel={false} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {candidate.skills.slice(0, 4).map((skill) => (
            <SkillBadge key={skill} skill={skill} />
          ))}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-3">
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${recClasses[matchResult.recommendation]}`}>
          {matchResult.recommendation.replace('_', ' ')}
        </span>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onRemoveCandidate}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
          >
            Remove
          </Button>
          <Button type="button" onClick={onViewProfile}>
            View Profile
          </Button>
        </div>
      </div>
    </Card>
  )
}
