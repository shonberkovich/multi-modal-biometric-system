import { useState } from 'react'
import { ScanFace, Loader2, Send } from 'lucide-react'
import WebcamCapture from '../components/WebcamCapture'
import AudioRecorder from '../components/AudioRecorder'
import FileUpload from '../components/FileUpload'
import MatchResultCard from '../components/MatchResultCard'
import Toast from '../components/Toast'
import { verifySingle } from '../api/client'

const METHODS = [
  { value: 'face', label: 'Face' },
  { value: 'voice', label: 'Voice' },
  { value: 'palm', label: 'Palm' },
  { value: 'gait', label: 'Gait' },
  { value: 'fingerprint', label: 'Fingerprint' },
]

export default function SingleVerification() {
  const [method, setMethod] = useState('face')
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState(null)

  const changeMethod = (value) => {
    setMethod(value)
    setFile(null)
    setResult(null)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await verifySingle({ method, file })
      setResult(data)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Verification failed. Please try again.'
      setToast({ type: 'error', message: detail })
    } finally {
      setSubmitting(false)
    }
  }

  const renderCapture = () => {
    switch (method) {
      case 'face':
        return <WebcamCapture label="Face" description="Look straight at the camera" onCapture={setFile} />
      case 'palm':
        return <WebcamCapture label="Palm" description="Show your open palm" onCapture={setFile} />
      case 'fingerprint':
        return (
          <WebcamCapture
            label="Fingerprint"
            description="Hold a fingertip close to the camera"
            onCapture={setFile}
          />
        )
      case 'voice':
        return <AudioRecorder onRecorded={setFile} />
      case 'gait':
        return (
          <FileUpload label="Gait" description="Upload a short walking video" accept="video/*" onFile={setFile} />
        )
      default:
        return null
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Single Verification</h1>
      <p className="mt-2 text-sm text-slate-500">Verify identity using a single biometric method.</p>

      <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm shadow-slate-900/5 backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
            <ScanFace size={18} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Choose a method</h2>
        </div>

        <label className="mt-6 block max-w-xs">
          <span className="text-sm font-medium text-slate-700">Biometric method</span>
          <select
            value={method}
            onChange={(e) => changeMethod(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 ease-in-out focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          >
            {METHODS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-6 max-w-sm">{renderCapture()}</div>

        <div className="mt-6">
          <button
            type="button"
            disabled={!file || submitting}
            onClick={handleSubmit}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all duration-200 ease-in-out hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <Send size={16} /> Verify
              </>
            )}
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 max-w-sm">
          <MatchResultCard matched={result.matched} score={result.score} identity={result} />
        </div>
      )}

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
