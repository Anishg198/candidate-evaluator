import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import OnboardingShell from '../components/OnboardingShell'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export default function AppliedConfirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const candidates = useAppStore((state) => state.candidates)
  const candidateId = location.state?.candidateId

  const candidate = useMemo(
    () => candidates.find((item) => item.id === candidateId) || candidates[candidates.length - 1],
    [candidateId, candidates]
  )

  return (
    <OnboardingShell
      step={3}
      title="Application submitted"
      description="Your application has been received successfully."
      compact
    >
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <CardTitle>Application Received</CardTitle>
            <CardDescription>
              Thank you for applying. You may be contacted by HR in the future.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              Your resume has been submitted successfully{candidate?.name ? `, ${candidate.name}` : ''}.
            </p>
            <Button onClick={() => navigate('/')}>Return to Home</Button>
          </CardContent>
        </Card>
      </div>
    </OnboardingShell>
  )
}
