import { useState } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import { Mic, Square, CheckCircle2, RotateCcw } from 'lucide-react'

// Static bar heights for the decorative waveform.
const BARS = Array.from({ length: 28 }, (_, i) => 0.3 + 0.7 * Math.abs(Math.sin(i * 1.7)))

/**
 * Voice capture card. Calls onRecorded(File) once a recording is stopped.
 */
export default function AudioRecorder({ onRecorded }) {
  const [recordedUrl, setRecordedUrl] = useState(null)

  const { status, startRecording, stopRecording } = useReactMediaRecorder({
    audio: true,
    video: false,
    blobPropertyBag: { type: 'audio/wav' },
    onStop: (blobUrl, blob) => {
      setRecordedUrl(blobUrl)
      onRecorded(new File([blob], 'voice.wav', { type: 'audio/wav' }))
    },
  })

  const retake = () => {
    setRecordedUrl(null)
    onRecorded(null)
  }

  const isRecording = status === 'recording'

  return (
    <div className="panel panel-lift flex h-full flex-col p-2.5">
      <div className="flex items-start justify-between gap-3 px-2.5 pb-3.5 pt-2.5">
        <div className="min-w-0">
          <p className="hud-label">Acoustic sensor</p>
          <p className="card-title mt-1.5">Voice</p>
          <p className="mt-0.5 text-[13px] text-ink-2">Say a short phrase clearly</p>
        </div>
        {recordedUrl ? (
          <span className="chip chip-ok">
            <CheckCircle2 size={12} strokeWidth={2.5} /> Locked
          </span>
        ) : isRecording ? (
          <span className="chip chip-fail">
            <span className="dot-live" /> Rec
          </span>
        ) : (
          <span className="chip chip-idle">Standby</span>
        )}
      </div>

      <div
        className="voice-stage flex min-h-[11.5rem] flex-1 flex-col items-center justify-center gap-6 px-4 py-8"
        data-state={recordedUrl ? 'done' : isRecording ? 'rec' : 'idle'}
      >
        {recordedUrl ? (
          <>
            <div className="wave" aria-hidden="true">
              {BARS.map((h, i) => (
                <span key={i} style={{ '--h': h, '--i': i }} />
              ))}
            </div>
            <audio controls src={recordedUrl} className="w-full" />
          </>
        ) : (
          <>
            <div className="mic-orb">
              <Mic size={26} />
            </div>
            <div className="wave" aria-hidden="true">
              {BARS.map((h, i) => (
                <span key={i} style={{ '--h': h, '--i': i }} />
              ))}
            </div>
          </>
        )}
        <span className="absolute left-4 top-3.5 font-mono text-[9.5px] uppercase tracking-[0.18em] text-ink-3">
          {status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="px-1 pb-1 pt-3">
        {recordedUrl ? (
          <button type="button" onClick={retake} className="btn btn-ghost w-full">
            <RotateCcw size={16} /> Re-record
          </button>
        ) : isRecording ? (
          <button type="button" onClick={stopRecording} className="btn btn-danger w-full">
            <Square size={16} /> Stop
          </button>
        ) : (
          <button type="button" onClick={startRecording} className="btn btn-primary w-full">
            <Mic size={16} /> Record
          </button>
        )}
      </div>
    </div>
  )
}
