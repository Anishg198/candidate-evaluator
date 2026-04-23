import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import * as faceapi from '@vladmandic/face-api'

const MODEL_URL = '/models'

// Map faceapi expressions → 4 behavioral states
const classify = (expressions) => {
  if (!expressions) return null
  const { happy = 0, surprised = 0, neutral = 0, fearful = 0, angry = 0, disgusted = 0, sad = 0 } = expressions
  const stressed = fearful + angry + disgusted + sad * 0.7
  if (stressed > 0.45) return 'stressed'
  if (happy > 0.35 || surprised > 0.4) return 'engaged'
  if (neutral > 0.55) return 'focused'
  return 'neutral'
}

const STATE_STYLES = {
  engaged:    { dot: 'bg-emerald-400', label: 'Engaged',    labelClass: 'text-emerald-400' },
  focused:    { dot: 'bg-sky-400',     label: 'Focused',    labelClass: 'text-sky-400' },
  neutral:    { dot: 'bg-amber-400',   label: 'Neutral',    labelClass: 'text-amber-400' },
  stressed:   { dot: 'bg-red-400',     label: 'Stressed',   labelClass: 'text-red-400' },
  distracted: { dot: 'bg-slate-500',   label: 'Distracted', labelClass: 'text-slate-400' },
}

// BehaviorCamera — mounts camera, runs face analysis, exposes getScore() via ref
const BehaviorCamera = forwardRef(function BehaviorCamera({ compact = false }, ref) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const intervalRef = useRef(null)
  const streamRef = useRef(null)
  const readingsRef = useRef([])     // array of {state, ts}
  const [ready, setReady] = useState(false)
  const [camError, setCamError] = useState('')
  const [currentState, setCurrentState] = useState(null)  // 'confident'|'neutral'|'stressed'|null
  const [frameCount, setFrameCount] = useState(0)

  // Expose getScore() to parent
  useImperativeHandle(ref, () => ({
    getScore: () => {
      const readings = readingsRef.current
      if (!readings.length) return null
      const engaged    = readings.filter(r => r.state === 'engaged').length
      const focused    = readings.filter(r => r.state === 'focused').length
      const neutral    = readings.filter(r => r.state === 'neutral').length
      const stressed   = readings.filter(r => r.state === 'stressed').length
      const distracted = readings.filter(r => r.state === 'distracted').length
      const total = readings.length
      const score = (engaged * 100 + focused * 80 + neutral * 60 + stressed * 25 + distracted * 20) / total
      return Math.round(score)
    },
    getBreakdown: () => {
      const r = readingsRef.current
      if (!r.length) return null
      const total = r.length
      return {
        engaged_pct:    Math.round(r.filter(x => x.state === 'engaged').length / total * 100),
        focused_pct:    Math.round(r.filter(x => x.state === 'focused').length / total * 100),
        neutral_pct:    Math.round(r.filter(x => x.state === 'neutral').length / total * 100),
        stressed_pct:   Math.round(r.filter(x => x.state === 'stressed').length / total * 100),
        distracted_pct: Math.round(r.filter(x => x.state === 'distracted').length / total * 100),
        total_readings: total,
      }
    },
  }))

  const analyze = useCallback(async () => {
    if (!videoRef.current || !ready) return
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.4 }))
        .withFaceExpressions()

      const state = detection ? classify(detection.expressions) : 'distracted'
      readingsRef.current.push({ state, ts: Date.now() })
      setCurrentState(state)
      setFrameCount(c => c + 1)
    } catch {
      // silently skip failed frames
    }
  }, [ready])

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL)
        if (cancelled) return

        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
        setReady(true)
      } catch (e) {
        if (!cancelled) setCamError(e.name === 'NotAllowedError' ? 'Camera access denied' : 'Camera unavailable')
      }
    }
    init()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready) return
    intervalRef.current = setInterval(analyze, 2500)
    return () => clearInterval(intervalRef.current)
  }, [ready, analyze])

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      clearInterval(intervalRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const stateInfo = currentState ? STATE_STYLES[currentState] : null

  if (camError) {
    return (
      <div className={`${compact ? 'w-36' : 'w-48'} bg-black/40 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-1 p-3`}
        style={{ aspectRatio: '4/3' }}>
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <p className="text-slate-500 text-[10px] text-center">{camError}</p>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'w-36' : 'w-48'} flex flex-col gap-1.5`}>
      <div className="relative rounded-xl overflow-hidden bg-black/60 border border-white/10" style={{ aspectRatio: '4/3' }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
        />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <p className="text-slate-400 text-[10px]">Loading…</p>
          </div>
        )}
        {/* Overlay badge */}
        <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
          <span className="text-[9px] text-white/60 bg-black/60 px-1.5 py-0.5 rounded-md">AI Monitoring</span>
          {frameCount > 0 && (
            <span className="text-[9px] text-white/40 bg-black/60 px-1.5 py-0.5 rounded-md">{frameCount}</span>
          )}
        </div>
      </div>
      {/* State indicator */}
      <div className="flex items-center gap-1.5 px-1">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${stateInfo ? stateInfo.dot : 'bg-slate-600'} ${ready ? 'animate-pulse' : ''}`} />
        <p className={`text-[10px] font-medium ${stateInfo ? stateInfo.labelClass : 'text-slate-600'}`}>
          {ready ? (stateInfo ? stateInfo.label : 'Analyzing…') : 'Starting camera…'}
        </p>
      </div>
    </div>
  )
})

export default BehaviorCamera
