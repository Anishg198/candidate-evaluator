import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import MatchScoreBar from '../components/MatchScoreBar'
import SkillBadge from '../components/SkillBadge'
import { useAppStore } from '../store/appStore'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'

const badgeClasses = {
  STRONG_MATCH: 'success',
  GOOD_MATCH: 'info',
  PARTIAL_MATCH: 'warning',
  WEAK_MATCH: 'destructive'
}

export default function CandidateProfile() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const candidate = useAppStore((state) => state.getCandidateById(id))
  const jobs = useAppStore((state) => state.jobs)
  const jobId = searchParams.get('job')
  const matchResult = candidate?.matchResults?.find((result) => result.jobId === jobId)
  const job = jobs.find((item) => item.id === jobId)

  if (!candidate) {
    return <Navigate to="/dashboard" replace />
  }

  const scoreColor =
    (matchResult?.overallScore || 0) >= 75
      ? 'text-emerald-600'
      : (matchResult?.overallScore || 0) >= 55
        ? 'text-amber-600'
        : 'text-rose-600'

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <Link to="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
        ← Back to Dashboard
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr,1fr]">
        <Card className="space-y-6 p-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{candidate.name}</h1>
            <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
              <p>{candidate.email}</p>
              <p>{candidate.phone || 'Phone not provided'}</p>
              <p>{candidate.totalYearsExperience} years experience</p>
              <p>Uploaded {new Date(candidate.uploadedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Professional Summary</h2>
            <p className="mt-3 text-slate-700">{candidate.summary}</p>
          </div>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">All Skills</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {candidate.skills.map((skill) => (
                <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Work Experience</h2>
            <div className="mt-4 space-y-4">
              {candidate.experience.map((item, index) => (
                <div key={`${item.company}-${index}`} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.company}</p>
                  <p className="text-sm text-sky-700">{item.duration}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">Education</h2>
            <div className="mt-4 space-y-3">
              {candidate.education.map((item, index) => (
                <div key={`${item.institution}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">{item.degree}</p>
                  <p className="text-sm text-slate-600">{item.institution}</p>
                  <p className="text-sm text-slate-500">{item.year}</p>
                </div>
              ))}
            </div>
          </section>
        </Card>

        <aside className="space-y-6">
          {matchResult && job && (
            <Card className="p-8">
              <h2 className="text-xl font-semibold text-slate-900">Match Analysis</h2>
              <p className="mt-2 text-sm text-slate-500">{job.title}</p>
              <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                  <p className={`text-4xl font-bold ${scoreColor}`}>{matchResult.overallScore}</p>
                  <p className="text-sm text-slate-500">/ 100</p>
                </div>
                <Badge variant={badgeClasses[matchResult.recommendation]}>
                  {matchResult.recommendation.replace('_', ' ')}
                </Badge>
              </div>
              <div className="mt-5">
                <MatchScoreBar score={matchResult.overallScore} />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Skill Score: {matchResult.skillScore.toFixed(1)}% · Experience Score:{' '}
                {matchResult.expScore}%
              </p>

              <section className="mt-6">
                <h3 className="font-semibold text-emerald-700">
                  Matched Skills ({matchResult.matchedSkills.length})
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {matchResult.matchedSkills.map((skill) => (
                    <SkillBadge key={skill} skill={skill} variant="matched" />
                  ))}
                </div>
              </section>

              <section className="mt-6">
                <h3 className="font-semibold text-rose-700">
                  Missing Critical Skills ({matchResult.missingSkills.length})
                </h3>
                {matchResult.missingSkills.length === 0 ? (
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                    All required skills matched!
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {matchResult.missingSkills.map((skill) => (
                      <SkillBadge key={skill} skill={skill} variant="missing" />
                    ))}
                  </div>
                )}
              </section>
            </Card>
          )}

          <Card className="p-8">
            <CardHeader className="p-0 pb-4">
              <CardTitle>Module 2 Handoff</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Button
                type="button"
                disabled
                variant="secondary"
                className="w-full justify-start"
              >
                Proceed to Module 2: Written Test →
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  )
}
