import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'
import FileUploader from '../components/FileUploader'
import SkillBadge from '../components/SkillBadge'
import OnboardingShell from '../components/OnboardingShell'
import { parseResume } from '../services/resumeApi'
import { scoreCandidate } from '../services/matcher'
import { useAppStore } from '../store/appStore'
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Progress } from '../components/ui/progress'
import { Separator } from '../components/ui/separator'

// This progress bar is cosmetic; the real parsing time depends on the backend and file size.
const progressValue = (elapsedSeconds) => Math.min(92, 18 + elapsedSeconds * 11)

export default function CandidateUpload() {
  const navigate = useNavigate()
  const draftCandidate = useAppStore((state) => state.draftCandidate)
  const addCandidate = useAppStore((state) => state.addCandidate)
  const addMatchResult = useAppStore((state) => state.addMatchResult)
  const clearDraftCandidate = useAppStore((state) => state.clearDraftCandidate)
  const jobs = useAppStore((state) => state.jobs)
  const pushToast = useAppStore((state) => state.pushToast)

  const [file, setFile] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!isAnalyzing) return undefined
    // Keep the review screen feeling responsive while the parser works in the background.
    const intervalId = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(intervalId)
  }, [isAnalyzing])

  const activeJobs = useMemo(() => jobs.filter((job) => job.isActive), [jobs])

  if (!draftCandidate) {
    return <Navigate to="/register" replace />
  }

  const analyzeCV = async () => {
    if (!file) return
    setError('')
    setAnalysis(null)
    setElapsed(0)
    setIsAnalyzing(true)
    try {
      // The backend returns both raw extracted text and structured NLP output for review.
      const extracted = await parseResume(file)
      setAnalysis({
        rawText: extracted.rawText || '',
        cvFileName: extracted.cvFileName || file.name,
        summary: extracted.summary || '',
        skills: extracted.skills || [],
        experience: extracted.experience || [],
        education: extracted.education || [],
        totalYearsExperience: extracted.totalYearsExperience || 0,
        warnings: extracted.warnings || [],
        inferredName: extracted.name || draftCandidate.name,
        inferredEmail: extracted.email || draftCandidate.email,
        inferredPhone: extracted.phone || draftCandidate.phone
      })
    } catch (err) {
      setError(err.message || 'Something went wrong while analyzing the resume. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const submitApplication = async () => {
    if (!analysis || isSubmitting) return
    setIsSubmitting(true)
    // Once the candidate confirms the parsed data, we persist it and score against active jobs.
    const candidate = {
      id: draftCandidate.id,
      name: draftCandidate.name,
      email: draftCandidate.email,
      phone: draftCandidate.phone || null,
      cvFileName: analysis.cvFileName,
      rawText: analysis.rawText,
      summary: analysis.summary,
      skills: analysis.skills,
      experience: analysis.experience,
      education: analysis.education,
      totalYearsExperience: analysis.totalYearsExperience,
      uploadedAt: new Date().toISOString(),
      matchResults: []
    }

    try {
      addCandidate(candidate)

      const matchResults = activeJobs.map((job) => scoreCandidate(candidate, job))
      matchResults.forEach((result) => addMatchResult(candidate.id, result))

      clearDraftCandidate()
      pushToast({
        message: 'Application submitted successfully.',
        variant: 'success'
      })
      navigate('/applied', {
        state: {
          candidateId: candidate.id
        }
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <OnboardingShell
      step={analysis ? 3 : 2}
      title={analysis ? 'Review your application' : 'Upload your resume'}
      description={
        analysis
          ? 'Review the extracted details below, then submit your application when everything looks right.'
          : 'Upload your resume and let the system extract the key details for your application.'
      }
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="mb-2 h-4 w-4" />
          <AlertTitle>Resume parsing failed</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{error}</p>
            <Button type="button" variant="outline" onClick={analyzeCV} className="border-rose-200 bg-white">
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr,1.15fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div className="space-y-2">
              <CardTitle>{analysis ? 'Uploaded Resume' : 'Resume Upload'}</CardTitle>
              <CardDescription>
                PDF and DOCX files are supported.
              </CardDescription>
            </div>
            <Badge variant="info">{draftCandidate.name}</Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <FileUploader onFileSelect={setFile} maxSizeMB={10} />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/register')}
                disabled={isAnalyzing || isSubmitting}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={analyzeCV}
                disabled={!file || isAnalyzing}
                className="w-full sm:w-auto"
              >
                {isAnalyzing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {isAnalyzing ? 'Parsing Resume...' : analysis ? 'Re-run Resume Analysis' : 'Analyze Resume'}
              </Button>
            </div>

            {isAnalyzing && (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
                <Progress value={progressValue(elapsed)} indicatorClassName="bg-sky-600" />
                <p className="mt-4 font-medium text-sky-950">
                  Extracting structured candidate data from your resume...
                </p>
                <p className="mt-1 text-sm text-sky-700">Elapsed: {elapsed}s</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{analysis ? 'Application Review' : 'Review Pending'}</CardTitle>
            <CardDescription>
              {analysis
                ? 'Check the extracted information before submitting.'
                : 'Your extracted application details will appear here after analysis.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!analysis ? (
              <div className="flex h-full min-h-[300px] items-center justify-center text-center text-slate-500">
                Upload and analyze your resume to continue to the review step.
              </div>
            ) : (
              <div className="space-y-8">
                <Alert variant="success">
                  <CheckCircle2 className="mb-2 h-4 w-4" />
                  <AlertTitle>Resume analyzed successfully</AlertTitle>
                  <AlertDescription>
                    Review the extracted application details below before you submit.
                  </AlertDescription>
                </Alert>

                {analysis.warnings?.length > 0 && (
                  <Alert variant="warning">
                    <AlertCircle className="mb-2 h-4 w-4" />
                    <AlertTitle>Review suggested fields</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc space-y-1 pl-5">
                        {analysis.warnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 rounded-2xl bg-slate-50 p-5 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="font-semibold text-slate-900">{draftCandidate.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-semibold text-slate-900">{draftCandidate.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Experience</p>
                    <p className="font-semibold text-slate-900">{analysis.totalYearsExperience} years</p>
                  </div>
                </div>

                <section>
                  <h2 className="text-lg font-semibold text-slate-900">Professional Summary</h2>
                  <p className="mt-3 rounded-2xl bg-slate-50 p-5 italic text-slate-700">
                    {analysis.summary || 'No summary could be generated from the parsed content.'}
                  </p>
                </section>

                <section>
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
                    <p className="text-sm text-slate-500">{analysis.skills.length} identified</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {analysis.skills.map((skill) => (
                      <SkillBadge key={skill} skill={skill} variant="neutral" />
                    ))}
                  </div>
                </section>

                <Separator />

                <section>
                  <h2 className="text-lg font-semibold text-slate-900">Work Experience</h2>
                  <div className="mt-4 space-y-4">
                    {analysis.experience.length === 0 ? (
                      <p className="text-sm text-slate-500">No work experience entries were parsed.</p>
                    ) : (
                      analysis.experience.map((item, index) => (
                        <div key={`${item.company}-${index}`} className="rounded-xl border border-slate-200 p-4">
                          <p className="font-semibold text-slate-900">{item.title || 'Role not identified'}</p>
                          <p className="text-sm text-slate-600">
                            {item.company || 'Organization not identified'}
                          </p>
                          <p className="text-sm text-sky-700">{item.duration || 'Date range unavailable'}</p>
                          <p className="mt-2 text-sm text-slate-600">
                            {item.description || 'No additional description parsed.'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-semibold text-slate-900">Education</h2>
                  <div className="mt-4 space-y-3">
                    {analysis.education.length === 0 ? (
                      <p className="text-sm text-slate-500">No education entries were parsed.</p>
                    ) : (
                      analysis.education.map((item, index) => (
                        <div key={`${item.institution}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                          <p className="font-semibold text-slate-900">
                            {item.degree || 'Degree not identified'}
                          </p>
                          <p className="text-sm text-slate-600">
                            {item.institution || 'Institution not identified'}
                          </p>
                          <p className="text-sm text-slate-500">
                            Graduation Year: {item.year || 'Unknown'}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <Button
                  type="button"
                  onClick={submitApplication}
                  disabled={isSubmitting}
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </OnboardingShell>
  )
}
