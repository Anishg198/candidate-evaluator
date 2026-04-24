import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TagInput from '../components/TagInput'
import { scoreCandidate } from '../services/matcher'
import { useAppStore } from '../store/appStore'
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
import { Textarea } from '../components/ui/textarea'

export default function JobCreate() {
  const navigate = useNavigate()
  const addJob = useAppStore((state) => state.addJob)
  const candidates = useAppStore((state) => state.candidates)
  const addMatchResult = useAppStore((state) => state.addMatchResult)
  const pushToast = useAppStore((state) => state.pushToast)
  const [form, setForm] = useState({
    title: '',
    description: '',
    requirements: [],
    niceToHave: [],
    minExperience: 0
  })
  const [errors, setErrors] = useState({})

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!form.title.trim()) nextErrors.title = 'Job Title is required.'
    if (!form.description.trim()) nextErrors.description = 'Job Description is required.'
    if (form.requirements.length === 0) nextErrors.requirements = 'At least one required skill is needed.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    const job = {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      description: form.description.trim(),
      requirements: form.requirements,
      niceToHave: form.niceToHave,
      minExperience: Number(form.minExperience) || 0,
      createdAt: new Date().toISOString(),
      isActive: true
    }

    addJob(job)
    candidates.forEach((candidate) => addMatchResult(candidate.id, scoreCandidate(candidate, job)))
    pushToast({
      message: `Job posted successfully. ${candidates.length} candidate profiles were evaluated against it.`,
      variant: 'success'
    })
    navigate('/dashboard')
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Post a New Job Role</CardTitle>
          <CardDescription>
            Define a role, its skill requirements, and minimum experience to rank stored candidates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              />
              {errors.title && <p className="mt-2 text-sm text-rose-600">{errors.title}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                rows="4"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
              {errors.description && <p className="mt-2 text-sm text-rose-600">{errors.description}</p>}
            </div>

            <div>
              <TagInput
                tags={form.requirements}
                onChange={(tags) => setForm((current) => ({ ...current, requirements: tags }))}
                placeholder="Type a required skill and press Enter"
                label="Required Skills"
              />
              {errors.requirements && <p className="mt-2 text-sm text-rose-600">{errors.requirements}</p>}
            </div>

            <TagInput
              tags={form.niceToHave}
              onChange={(tags) => setForm((current) => ({ ...current, niceToHave: tags }))}
              placeholder="Type a preferred skill and press Enter"
              label="Preferred Skills / Nice-to-Have"
            />

            <div className="space-y-2">
              <Label htmlFor="experience">Minimum Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                min="0"
                value={form.minExperience}
                onChange={(event) =>
                  setForm((current) => ({ ...current, minExperience: event.target.value }))
                }
              />
            </div>

            <CardFooter className="justify-end gap-3 px-0 pb-0">
              <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit">Post Job</Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
