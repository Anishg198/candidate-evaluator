import { useState } from 'react'
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, Lock, Zap, BarChart3 } from 'lucide-react'

function QualityBar({ label, value }) {
  const pct = Math.round((value || 0) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300 font-medium">{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: pct >= 70 ? '#10b981' : pct >= 40 ? '#6366f1' : '#f59e0b',
          }}
        />
      </div>
    </div>
  )
}

export default function TestResults({ result }) {
  const [expanded, setExpanded] = useState(null)
  if (!result) return null

  const { passed_tests, total_tests, score, status, code_quality, test_results = [], time_taken_ms, attempt_number, language } = result
  const statusColor = status === 'Accepted' ? 'text-emerald-400' : status === 'Partial' ? 'text-amber-400' : 'text-red-400'
  const statusBg = status === 'Accepted' ? 'bg-emerald-500/10 border-emerald-500/30' : status === 'Partial' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-red-500/10 border-red-500/30'

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${statusBg}`}>
        <div className="flex items-center gap-3">
          {status === 'Accepted'
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            : <XCircle className="w-5 h-5 text-red-400" />}
          <span className={`font-semibold ${statusColor}`}>{status}</span>
          <span className="text-slate-400 text-sm">{passed_tests}/{total_tests} test cases passed</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          {time_taken_ms != null && (
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{time_taken_ms}ms</span>
          )}
          <span>{language}</span>
          {attempt_number && <span>Attempt #{attempt_number}</span>}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${score || 0}%`,
            background: score === 100 ? '#10b981' : score >= 50 ? '#6366f1' : '#ef4444',
          }}
        />
      </div>

      {/* Test cases */}
      <div className="space-y-2">
        {test_results.map((tc, i) => {
          const isOpen = expanded === i
          const passed = tc.passed
          return (
            <div key={i} className={`rounded-xl border overflow-hidden ${passed ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
              <button
                onClick={() => setExpanded(isOpen ? null : i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition cursor-pointer"
              >
                {passed
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                {tc.hidden
                  ? <span className="flex items-center gap-1.5 text-sm text-slate-400"><Lock className="w-3 h-3" />Hidden Test Case {tc.test_case_id}</span>
                  : <span className="text-sm text-slate-300">Test Case {tc.test_case_id}</span>}
                <span className={`ml-auto text-xs font-semibold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {passed ? 'PASS' : 'FAIL'}
                </span>
                <span className="text-xs text-slate-600">{tc.time_ms}ms</span>
                {!tc.hidden && (isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />)}
              </button>
              {isOpen && !tc.hidden && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 bg-white/[0.02]">
                  {tc.compile_output && (
                    <div>
                      <p className="text-xs text-amber-400 mb-1 font-medium">Compile Output</p>
                      <pre className="text-xs font-mono text-amber-300 bg-amber-500/10 rounded-lg px-3 py-2 overflow-x-auto">{tc.compile_output}</pre>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Input</p>
                      <pre className="text-xs font-mono text-slate-300 bg-white/5 rounded-lg px-3 py-2 overflow-x-auto">{tc.input || '(empty)'}</pre>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Expected</p>
                      <pre className="text-xs font-mono text-slate-300 bg-white/5 rounded-lg px-3 py-2 overflow-x-auto">{tc.expected_output}</pre>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Got</p>
                      <pre className={`text-xs font-mono rounded-lg px-3 py-2 overflow-x-auto ${passed ? 'text-emerald-300 bg-emerald-500/10' : 'text-red-300 bg-red-500/10'}`}>
                        {tc.actual_output || tc.stderr || '(no output)'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Code quality */}
      {code_quality && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <h4 className="text-sm font-semibold text-slate-200">Code Quality</h4>
            <span className="ml-auto text-xs font-bold text-slate-300">
              {Math.round((code_quality.overall_quality || 0) * 100)}% overall
            </span>
          </div>
          <div className="space-y-2.5">
            <QualityBar label="Naming conventions" value={code_quality.naming_score} />
            <QualityBar label="Line length" value={code_quality.line_length_score} />
            <QualityBar label="Comment coverage" value={Math.min(code_quality.comment_ratio * 3, 1)} />
          </div>
          <p className="text-xs text-slate-600 mt-2">Avg line length: {code_quality.avg_line_length} chars</p>
        </div>
      )}
    </div>
  )
}
