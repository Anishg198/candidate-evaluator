export default function MCQQuestion({ question, selectedAnswer, onChange }) {
  const options = question.options || {}
  return (
    <div className="space-y-3">
      {Object.entries(options).map(([letter, text]) => {
        const selected = selectedAnswer === text
        return (
          <button
            key={letter}
            type="button"
            onClick={() => onChange(text)}
            className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
              selected
                ? 'bg-indigo-500/15 border-indigo-500/50 text-slate-900 dark:text-slate-100'
                : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-slate-300 dark:hover:border-white/20'
            }`}
          >
            <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border transition-colors ${
              selected ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/15 text-slate-500 dark:text-slate-400'
            }`}>{letter}</span>
            <span className="text-sm leading-relaxed pt-0.5">{text}</span>
          </button>
        )
      })}
    </div>
  )
}
