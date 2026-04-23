import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PipelineBar from '../components/PipelineBar'
import {
  Camera, CameraOff, Wifi, Sun, Shirt, MonitorOff, Clock, FileText,
  CheckCircle2, AlertCircle, ChevronRight, Loader2, Mic, Code2, Brain,
} from 'lucide-react'

const TEST_CONFIG = {
  written: {
    step: 2,
    title: 'Written Assessment',
    subtitle: 'MCQ + Short Answer Questions',
    icon: FileText,
    color: 'indigo',
    details: [
      { label: 'Format', value: 'Multiple choice + short answer' },
      { label: 'Scoring', value: 'MCQ: full marks for correct, 0 for wrong. Short answer: AI-graded out of stated points' },
      { label: 'Navigation', value: 'Jump between questions freely; submit when ready or time runs out' },
    ],
  },
  interview: {
    step: 3,
    title: 'Technical Interview',
    subtitle: 'AI-powered voice + text interview',
    icon: Mic,
    color: 'violet',
    details: [
      { label: 'Format', value: 'Conversational AI interview — speak or type your answers' },
      { label: 'Topics', value: 'Technical concepts based on your CV skills and role requirements' },
      { label: 'Scoring', value: 'AI evaluates depth, accuracy, and clarity of your answers' },
    ],
  },
  coding: {
    step: 4,
    title: 'Coding Assessment',
    subtitle: 'Real code execution via Judge0',
    icon: Code2,
    color: 'emerald',
    details: [
      { label: 'Format', value: 'Solve algorithmic problems in your preferred language' },
      { label: 'Languages', value: 'Python, JavaScript, Java, C++, and more' },
      { label: 'Scoring', value: 'Based on test cases passed — run code freely before final submit' },
    ],
  },
}

const COLOR = {
  indigo:  { ring: 'ring-indigo-500/30', icon: 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400', btn: 'bg-indigo-500 hover:bg-indigo-400 shadow-indigo-500/25' },
  violet:  { ring: 'ring-violet-500/30',  icon: 'bg-violet-100 dark:bg-violet-500/20 border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400',  btn: 'bg-violet-500 hover:bg-violet-400 shadow-violet-500/25' },
  emerald: { ring: 'ring-emerald-500/30', icon: 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400', btn: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25' },
}

const GUIDELINES = [
  { icon: Sun,       text: 'Sit in a well-lit room with your face clearly visible', key: 'light' },
  { icon: Shirt,     text: 'Wear formal or business-casual attire', key: 'attire' },
  { icon: Wifi,      text: 'Ensure a stable internet connection throughout the test', key: 'internet' },
  { icon: MonitorOff, text: 'Do not switch tabs, minimize the window, or open other applications', key: 'tabs' },
  { icon: Camera,    text: 'Keep your camera on for the entire duration — proctoring is active', key: 'camera' },
]

export default function TestInstructionsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const state = location.state || {}
  const { testType = 'written', nextPath = '/', nextState = null, meta = {} } = state

  const config = TEST_CONFIG[testType] || TEST_CONFIG.written
  const colors = COLOR[config.color]
  const Icon = config.icon

  const [camStatus, setCamStatus] = useState('idle') // idle | checking | ok | denied | error
  const [camError, setCamError] = useState('')
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [])

  const requestCamera = async () => {
    setCamStatus('checking')
    setCamError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setCamStatus('ok')
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCamStatus('denied')
        setCamError('Camera access denied. Allow camera in browser settings and try again.')
      } else if (err.name === 'NotFoundError') {
        setCamStatus('error')
        setCamError('No camera found. Connect a camera and try again.')
      } else {
        setCamStatus('error')
        setCamError('Could not access camera. Check permissions and try again.')
      }
    }
  }

  const handleBegin = () => {
    // Stop preview stream — BehaviorCamera in the test page will open its own
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    navigate(nextPath, { state: nextState })
  }

  const canBegin = camStatus === 'ok' && agreed

  const pipelineStep = config.step

  return (
    <div className="min-h-screen flex flex-col">
      <PipelineBar currentStep={pipelineStep} />

      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center flex-shrink-0 ${colors.icon}`}>
            <Icon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{config.title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{config.subtitle}</p>
          </div>
        </div>

        {/* Test details */}
        {(meta.questions || meta.duration) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {meta.questions && (
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{meta.questions}</p>
                <p className="text-slate-500 text-xs mt-0.5">Questions</p>
              </div>
            )}
            {meta.duration && (
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{meta.duration}</p>
                </div>
                <p className="text-slate-500 text-xs mt-0.5">Minutes</p>
              </div>
            )}
            {meta.totalPoints && (
              <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{meta.totalPoints}</p>
                <p className="text-slate-500 text-xs mt-0.5">Total Marks</p>
              </div>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-5">
          {/* Left: info + guidelines */}
          <div className="space-y-5">
            {/* Format details */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Assessment Details</p>
              {config.details.map((d) => (
                <div key={d.label}>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{d.label}</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">{d.value}</p>
                </div>
              ))}
            </div>

            {/* Guidelines */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Before You Begin</p>
              {GUIDELINES.map(({ icon: GIcon, text, key }) => (
                <div key={key} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <GIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-snug">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: camera check */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Camera Verification</p>
              <p className="text-xs text-slate-500">Camera access is required before you can begin. We check that your camera works correctly.</p>

              {/* Preview */}
              <div className={`relative rounded-xl overflow-hidden bg-slate-100 dark:bg-black/40 border-2 transition-all ${
                camStatus === 'ok' ? 'border-emerald-400 dark:border-emerald-500' : 'border-slate-200 dark:border-white/10'
              }`} style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  muted
                  playsInline
                  className={`w-full h-full object-cover transition-opacity duration-300 ${camStatus === 'ok' ? 'opacity-100' : 'opacity-0'}`}
                />
                {camStatus !== 'ok' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    {camStatus === 'checking' ? (
                      <Loader2 className="w-7 h-7 text-slate-400 animate-spin" />
                    ) : camStatus === 'denied' || camStatus === 'error' ? (
                      <CameraOff className="w-8 h-8 text-red-400" />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-500 text-center px-4">
                      {camStatus === 'idle' ? 'Click below to enable camera' : camStatus === 'checking' ? 'Requesting access…' : ''}
                    </p>
                  </div>
                )}
                {camStatus === 'ok' && (
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> Live
                  </div>
                )}
              </div>

              {camError && (
                <p className="text-red-500 dark:text-red-400 text-xs bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {camError}
                </p>
              )}

              {camStatus !== 'ok' ? (
                <button
                  onClick={requestCamera}
                  disabled={camStatus === 'checking'}
                  className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-100 text-white disabled:opacity-50 text-sm font-semibold py-2.5 rounded-xl transition cursor-pointer">
                  {camStatus === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                  {camStatus === 'checking' ? 'Requesting…' : (camStatus === 'denied' || camStatus === 'error') ? 'Try Again' : 'Enable Camera & Mic'}
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Camera verified successfully
                </div>
              )}
            </div>

            {/* Acknowledgement */}
            <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer ${
                  agreed ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-white/20 bg-white dark:bg-white/5'
                }`} onClick={() => setAgreed((v) => !v)}>
                  {agreed && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed" onClick={() => setAgreed((v) => !v)}>
                  I have read and understood all the instructions. I am in a well-lit, quiet space in formal attire with a stable internet connection. I will not switch tabs or minimise the window during the test.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Begin button */}
        <div className="pt-2">
          {!canBegin && (
            <p className="text-xs text-slate-500 text-center mb-3">
              {camStatus !== 'ok' && !agreed ? 'Enable camera and acknowledge instructions to begin.' : camStatus !== 'ok' ? 'Enable camera to begin.' : 'Acknowledge the instructions to begin.'}
            </p>
          )}
          <button
            onClick={handleBegin}
            disabled={!canBegin}
            className={`w-full flex items-center justify-center gap-2 text-white font-semibold py-4 rounded-xl transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-base ${colors.btn}`}>
            Begin {config.title} <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
