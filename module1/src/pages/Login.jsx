import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { Button } from '../components/ui/button'

export default function Login() {
  const navigate = useNavigate()
  const setRole = useAppStore((state) => state.setRole)

  const startCandidateFlow = () => {
    setRole('CANDIDATE')
    navigate('/register')
  }

  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto flex max-w-6xl items-center justify-between py-4">
        <div>
          <p className="text-sm font-semibold text-sky-700">HCL Internship Program</p>
          <h1 className="text-xl font-bold text-slate-900">Candidate Application Portal</h1>
        </div>
        <Button asChild variant="ghost">
          <Link to="/hr">HR Sign In</Link>
        </Button>
      </div>

      <div className="mx-auto flex max-w-6xl justify-center pt-16 lg:pt-24">
        <section className="max-w-2xl text-center">
          <h2 className="text-5xl font-bold tracking-tight text-slate-950">
            Apply in a few quick steps.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-slate-600">
            Enter your details, upload your resume, review the extracted information, and submit your application.
          </p>

          <div className="mt-8 flex justify-center">
            <Button size="lg" className="justify-between sm:min-w-[220px]" onClick={startCandidateFlow}>
              Start Application
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </div>
    </main>
  )
}
