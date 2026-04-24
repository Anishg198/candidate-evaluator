import { useState } from 'react'
import { X } from 'lucide-react'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Label } from './ui/label'

export default function TagInput({ tags, onChange, placeholder, label }) {
  const [value, setValue] = useState('')

  const addTag = () => {
    const trimmed = value.trim()
    if (!trimmed) return
    if (tags.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())) {
      setValue('')
      return
    }
    onChange([...tags, trimmed])
    setValue('')
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm focus-within:ring-2 focus-within:ring-slate-300">
        <div className="mb-2 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-2 px-3 py-1 text-sm font-medium">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                className="rounded-full p-0.5 text-slate-500 hover:bg-white hover:text-rose-600"
                onClick={() => onChange(tags.filter((item) => item !== tag))}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </Badge>
          ))}
        </div>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addTag()
            }
          }}
          placeholder={placeholder}
          className="border-0 p-0 shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  )
}
