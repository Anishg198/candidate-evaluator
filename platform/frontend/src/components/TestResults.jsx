import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Lock, Zap } from 'lucide-react'

export default function TestResults({ result }) {
  const [expanded, setExpanded] = useState(null)
  if (!result) return null

  const { passed_tests, total_tests, score, status, test_results = [], time_taken_ms, language } = result
  const statusColor = status === 'Accepted' ? 'text-emerald-400' : status === 'Partial' ? 'text-amber-400' : 'text-red-400'
  const statusBg = status === 'Accepted' ? 'bg-emerald-500/10 border-emerald-500/30' : status === 'Partial' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'

  return (
    <div className="space-y-3">
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${statusBg}`}>
        <div className="flex items-center gap-3">
          {status === 'Accepted' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-red-400" />}
          <span className={`font-semibold ${statusColor}`}>{status}</span>
          <span className="text-slate-400 text-sm">{passed_tests}/{total_tests} passed</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {time_taken_ms != null && <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{time_taken_ms}ms</span>}
          <span>{language}</span>
        </div>
      </div>

      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${score || 0}%`, background: score === 100 ? '#10b981' : score >= 50 ? '#6366f1' : '#ef4444' }} />
      </div>

      <div className="space-y-2">
        {test_results.map((tc, i) => {
          const isOpen = expanded === i
          return (
            <div key={i} className={`rounded-xl border overflow-hidden ${tc.passed ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
              <button onClick={() => setExpanded(isOpen ? null : i)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition cursor-pointer">
                {tc.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                {tc.hidden ? <span className="flex items-center gap-1.5 text-sm text-slate-400"><Lock className="w-3 h-3" />Hidden Test {tc.test_case_id}</span> : <span className="text-sm text-slate-300">Test Case {tc.test_case_id}</span>}
                <span className={`ml-auto text-xs font-semibold ${tc.passed ? 'text-emerald-400' : 'text-red-400'}`}>{tc.passed ? 'PASS' : 'FAIL'}</span>
                {!tc.hidden && (isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />)}
              </button>
              {isOpen && !tc.hidden && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 bg-white/[0.02]">
                  <div className="grid grid-cols-3 gap-3">
                    {[['Input', tc.input, 'text-slate-300'], ['Expected', tc.expected_output, 'text-slate-300'], ['Got', tc.actual_output || tc.stderr || '(no output)', tc.passed ? 'text-emerald-300' : 'text-red-300']].map(([label, val, cls]) => (
                      <div key={label}>
                        <p className="text-xs text-slate-500 mb-1">{label}</p>
                        <pre className={`text-xs font-mono ${cls} bg-white/5 rounded-lg px-3 py-2 overflow-x-auto`}>{val}</pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
