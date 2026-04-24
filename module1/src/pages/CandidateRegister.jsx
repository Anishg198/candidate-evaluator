import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import OnboardingShell from '../components/OnboardingShell'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function CandidateRegister() {
  const navigate = useNavigate()
  const draftCandidate = useAppStore((state) => state.draftCandidate)
  const setDraftCandidate = useAppStore((state) => state.setDraftCandidate)
  const [form, setForm] = useState({
    name: draftCandidate?.name || '',
    email: draftCandidate?.email || '',
    phone: draftCandidate?.phone || ''
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Full Name is required.'
    if (!form.email.trim()) nextErrors.email = 'Email Address is required.'
    else if (!emailRegex.test(form.email)) nextErrors.email = 'Please enter a valid email address.'

    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setDraftCandidate({
      id: draftCandidate?.id || crypto.randomUUID(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null
    })
    navigate('/upload')
  }

  return (
    <OnboardingShell
      step={1}
      title="Tell us a little about yourself"
      description="Start by entering your contact details so we can attach them to your application."
      compact
    >
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Candidate Details</CardTitle>
            <CardDescription>These details are used to create your application profile.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
                {errors.name && <p className="text-sm text-rose-600">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                />
                {errors.email && <p className="text-sm text-rose-600">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                />
              </div>

              <CardFooter className="justify-between px-0 pb-0">
                <Link to="/" className="text-sm font-medium text-slate-600 hover:text-slate-900">
                  Back
                </Link>
                <Button type="submit">Continue to Resume Upload</Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </OnboardingShell>
  )
}
