import { useState } from 'react'
import { UserPlus, Loader2, Send } from 'lucide-react'
import WebcamCapture from '../components/WebcamCapture'
import AudioRecorder from '../components/AudioRecorder'
import FileUpload from '../components/FileUpload'
import Toast from '../components/Toast'
import { enroll } from '../api/client'

const REQUIRED_METHODS = ['face', 'voice', 'palm', 'gait', 'fingerprint']

export default function Enrollment() {
  const [nationalId, setNationalId] = useState('')
  const [fullName, setFullName] = useState('')
  const [captures, setCaptures] = useState({
    face: null,
    voice: null,
    palm: null,
    gait: null,
    fingerprint: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState(null)

  const setCapture = (method) => (file) =>
    setCaptures((prev) => ({ ...prev, [method]: file }))

  const isComplete =
    nationalId.trim() &&
    fullName.trim() &&
    REQUIRED_METHODS.every((method) => captures[method])

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data } = await enroll({ nationalId, fullName, ...captures })
      setToast({
        type: 'success',
        message: `Enrolled ${data.full_name} successfully across all 5 methods.`,
      })
      setNationalId('')
      setFullName('')
      setCaptures({ face: null, voice: null, palm: null, gait: null, fingerprint: null })
    } catch (err) {
      const detail = err.response?.data?.detail || 'Enrollment failed. Please try again.'
      setToast({ type: 'error', message: detail })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Enrollment</h1>
      <p className="mt-2 text-sm text-slate-500">
        Register a new person's biometric profile across all 5 modalities.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm shadow-slate-900/5 backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
            <UserPlus size={18} />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">Identity details</h2>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">National ID</span>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="e.g. 123456789"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 ease-in-out placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full Name</span>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Jane Doe"
              className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 ease-in-out placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
            />
          </label>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900">Camera captures</h2>
        <div className="mt-3 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <WebcamCapture
            label="Face"
            description="Look straight at the camera"
            onCapture={setCapture('face')}
          />
          <WebcamCapture
            label="Palm"
            description="Show your open palm"
            onCapture={setCapture('palm')}
          />
          <WebcamCapture
            label="Fingerprint"
            description="Hold a fingertip close to the camera"
            onCapture={setCapture('fingerprint')}
          />
          <AudioRecorder onRecorded={setCapture('voice')} />
          <FileUpload
            label="Gait"
            description="Upload a short walking video"
            accept="video/*"
            onFile={setCapture('gait')}
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          disabled={!isComplete || submitting}
          onClick={handleSubmit}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all duration-200 ease-in-out hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Enrolling...
            </>
          ) : (
            <>
              <Send size={16} /> Submit enrollment
            </>
          )}
        </button>
      </div>

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
