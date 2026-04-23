import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export const LANGUAGES = [
  { id: 71, name: 'Python 3', ext: 'py' },
  { id: 63, name: 'JavaScript', ext: 'js' },
  { id: 62, name: 'Java', ext: 'java' },
  { id: 54, name: 'C++', ext: 'cpp' },
]

export default function LanguageSelector({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = LANGUAGES.find((l) => l.id === value) || LANGUAGES[0]

  useEffect(() => {
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-slate-200 text-sm font-mono font-medium transition cursor-pointer"
      >
        {selected.name}
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 w-44 bg-[#12121a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => { onChange(lang); setOpen(false) }}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-mono text-slate-300 hover:bg-white/5 hover:text-slate-100 transition cursor-pointer"
            >
              {lang.name}
              {lang.id === value && <Check className="w-4 h-4 text-indigo-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
