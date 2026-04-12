export default function ShortAnswer({ question, value, onChange }) {
  const max = 500
  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, max))}
        placeholder="Type your answer here…"
        rows={4}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition resize-y text-sm leading-relaxed"
      />
      <p className="text-right text-xs text-slate-500">{value.length}/{max}</p>
    </div>
  )
}
