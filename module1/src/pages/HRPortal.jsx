import { useNavigate } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'

export default function HRPortal() {
  const navigate = useNavigate()
  const setRole = useAppStore((state) => state.setRole)

  const continueToPortal = () => {
    setRole('HR')
    navigate('/dashboard')
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white">
            <BriefcaseBusiness className="h-5 w-5" />
          </div>
          <CardTitle>HR Portal</CardTitle>
          <CardDescription>
            Continue to the HR workspace to review applicants, manage open roles, and inspect candidate matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Candidate Page
          </Button>
          <Button onClick={continueToPortal}>
            Continue to HR Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
