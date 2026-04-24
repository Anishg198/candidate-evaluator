import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import CandidateCard from '../components/CandidateCard'
import SkillBadge from '../components/SkillBadge'
import { useAppStore } from '../store/appStore'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '../components/ui/alert-dialog'

export default function HRDashboard() {
  const navigate = useNavigate()
  const jobs = useAppStore((state) => state.jobs)
  const candidates = useAppStore((state) => state.candidates)
  const removeCandidate = useAppStore((state) => state.removeCandidate)
  const pushToast = useAppStore((state) => state.pushToast)
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '')
  const [candidateToRemove, setCandidateToRemove] = useState(null)

  const selectedJob = useMemo(
    () => jobs.find((job) => job.id === selectedJobId) || null,
    [jobs, selectedJobId]
  )

  const rankedCandidates = useMemo(() => {
    if (!selectedJob) return []
    return candidates
      .map((candidate) => ({
        candidate,
        matchResult: candidate.matchResults?.find((result) => result.jobId === selectedJob.id)
      }))
      .filter((item) => item.matchResult)
      .sort((a, b) => b.matchResult.overallScore - a.matchResult.overallScore)
  }, [candidates, selectedJob])

  const handleRemoveCandidate = (candidate) => {
    removeCandidate(candidate.id)
    pushToast({
      message: `${candidate.name} was removed from the candidate list.`,
      variant: 'success'
    })
    setCandidateToRemove(null)
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">HR Manager Dashboard</h1>
          <p className="mt-2 text-slate-600">
            Review open roles and inspect ranked candidates by fit score.
          </p>
        </div>
        <Button type="button" onClick={() => navigate('/jobs/new')}>
          <Plus className="h-4 w-4" />
          Post New Job
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr,2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Open Positions</CardTitle>
            <CardDescription>Select a role to review ranked applicants.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-slate-500">
                No job postings yet. Create your first role.
              </div>
            ) : (
              jobs.map((job) => {
                const count = candidates.filter((candidate) =>
                  candidate.matchResults?.some((result) => result.jobId === job.id)
                ).length
                return (
                  <button
                    type="button"
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedJobId === job.id
                        ? 'border-slate-900 bg-slate-100'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{job.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Posted {new Date(job.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-2">
                        <Badge variant="secondary">{job.requirements.length} required skills</Badge>
                        <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                          {count} candidates
                        </Badge>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            {!selectedJob ? (
              <div className="flex min-h-[400px] items-center justify-center text-slate-500">
                ← Select a job from the left to view candidates
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-200 pb-6">
                  <h2 className="text-2xl font-bold text-slate-900">{selectedJob.title}</h2>
                  <p className="mt-2 text-slate-600">{selectedJob.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedJob.requirements.map((skill) => (
                      <SkillBadge key={skill} skill={skill} variant="neutral" />
                    ))}
                    {selectedJob.niceToHave.map((skill) => (
                      <SkillBadge key={skill} skill={skill} variant="preferred" />
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {rankedCandidates.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                      No candidates have applied to this role yet.
                    </div>
                  ) : (
                    rankedCandidates.map(({ candidate, matchResult }, index) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        matchResult={matchResult}
                        rank={index + 1}
                        onRemoveCandidate={() => setCandidateToRemove(candidate)}
                        onViewProfile={() =>
                          navigate(`/candidate/${candidate.id}?job=${selectedJob.id}`)
                        }
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={Boolean(candidateToRemove)} onOpenChange={(open) => !open && setCandidateToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove candidate profile?</AlertDialogTitle>
            <AlertDialogDescription>
              {candidateToRemove?.name} will be removed from the dashboard and local candidate storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => handleRemoveCandidate(candidateToRemove)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
