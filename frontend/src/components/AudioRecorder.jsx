import { useState } from 'react'
import { useReactMediaRecorder } from 'react-media-recorder'
import { Mic, Square, CheckCircle2, RotateCcw } from 'lucide-react'

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
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur-xl transition-all duration-300 ease-in-out hover:shadow-md">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Voice</p>
          <p className="text-xs text-slate-500">Say a short phrase clearly</p>
        </div>
        {recordedUrl && <CheckCircle2 size={18} className="text-emerald-500" />}
      </div>

      <div className="mt-3 flex items-center justify-center px-4 py-6">
        {recordedUrl ? (
          <audio controls src={recordedUrl} className="w-full" />
        ) : (
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ease-in-out ${
              isRecording ? 'animate-pulse bg-red-100 text-red-500' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Mic size={26} />
          </div>
        )}
      </div>

      <div className="p-4">
        {recordedUrl ? (
          <button
            type="button"
            onClick={retake}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50 active:scale-[0.98]"
          >
            <RotateCcw size={16} /> Re-record
          </button>
        ) : isRecording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-3.5 py-2.5 text-sm font-medium text-white shadow-md shadow-red-500/30 transition-all duration-200 ease-in-out hover:bg-red-600 active:scale-[0.98]"
          >
            <Square size={16} /> Stop
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-500/30 transition-all duration-200 ease-in-out hover:from-brand-600 hover:to-brand-700 active:scale-[0.98]"
          >
            <Mic size={16} /> Record
          </button>
        )}
      </div>
    </div>
  )
}
