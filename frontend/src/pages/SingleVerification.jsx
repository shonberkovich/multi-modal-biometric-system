import { useState } from 'react'
import { ScanFace, Loader2, Send, AudioLines, Hand, Footprints, Fingerprint } from 'lucide-react'
import WebcamCapture from '../components/WebcamCapture'
import AudioRecorder from '../components/AudioRecorder'
import FileUpload from '../components/FileUpload'
import MatchResultCard from '../components/MatchResultCard'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import BiometricMesh from '../components/BiometricMesh'
import { verifySingle } from '../api/client'

const METHODS = [
  { value: 'face', label: 'Face' },
  { value: 'voice', label: 'Voice' },
  { value: 'palm', label: 'Palm' },
  { value: 'gait', label: 'Gait' },
  { value: 'fingerprint', label: 'Fingerprint' },
]

const METHOD_ICONS = {
  face: ScanFace,
  voice: AudioLines,
  palm: Hand,
  gait: Footprints,
  fingerprint: Fingerprint,
}

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
      <PageHeader
        index="02"
        eyebrow="1:N identification"
        title={
          <>
            Single <span className="text-holo">verification</span>
          </>
        }
        description="Verify identity using a single biometric method."
      >
        <dl className="flex shrink-0 gap-8">
          <div>
            <dt className="hud-label">Probe</dt>
            <dd className="stat-value mt-2 capitalize">{method}</dd>
          </div>
          <div>
            <dt className="hud-label">Match</dt>
            <dd className="stat-value mt-2">1:N</dd>
          </div>
        </dl>
      </PageHeader>

      <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 xl:grid-cols-12 xl:items-start">
        <Reveal className="xl:col-span-7" delay={60}>
          <section className="panel p-5 sm:p-7">
            <div className="flex items-center gap-3.5">
              <span className="icon-tile">
                <ScanFace size={18} />
              </span>
              <div>
                <p className="hud-label">Probe console</p>
                <h2 className="card-title mt-1 text-lg">Choose a method</h2>
              </div>
            </div>

            <fieldset className="mt-7">
              <legend className="field-label">Biometric method</legend>
              <div className="grid grid-cols-5 gap-1 sm:gap-2.5">
                {METHODS.map((m) => {
                  const Icon = METHOD_ICONS[m.value]
                  return (
                    <label key={m.value} className="modality-option">
                      <input
                        type="radio"
                        name="method"
                        value={m.value}
                        checked={method === m.value}
                        onChange={(e) => changeMethod(e.target.value)}
                        className="sr-only"
                      />
                      <span className="modality-option-body">
                        <Icon size={20} strokeWidth={1.75} />
                        <span className="w-full truncate text-center text-[9.5px] font-medium tracking-[-0.01em] sm:text-xs sm:tracking-normal">
                          {m.label}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
            </fieldset>

            <div className="mt-6">{renderCapture()}</div>

            <div className="mt-6">
              <button
                type="button"
                disabled={!file || submitting}
                onClick={handleSubmit}
                className="btn btn-primary btn-lg w-full sm:w-auto"
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
          </section>
        </Reveal>

        <Reveal className="xl:sticky xl:top-24 xl:col-span-5" delay={140}>
          {result ? (
            <MatchResultCard matched={result.matched} score={result.score} identity={result} />
          ) : (
            <section className="panel relative min-h-[380px] overflow-hidden xl:min-h-[520px]">
              <div className="scanlines absolute inset-0" aria-hidden="true" />
              <BiometricMesh className="absolute inset-0 h-full w-full" busy={submitting} />
              <div className="pointer-events-none absolute inset-x-5 top-5 flex items-start justify-between gap-3 sm:inset-x-6 sm:top-6">
                <div>
                  <p className="hud-label">Match analysis</p>
                  <p className="mt-1.5 font-mono text-[11px] text-ink-2">
                    {submitting ? 'Comparing against enrolled vectors' : 'Awaiting probe'}
                  </p>
                </div>
                <span className={`chip ${submitting ? '' : 'chip-idle'}`}>
                  {submitting && <span className="dot-live" />} {submitting ? 'Scanning' : 'Idle'}
                </span>
              </div>
              <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 sm:inset-x-6 sm:bottom-6">
                <span>Modality::{method}</span>
                <span>{file ? 'Probe ready' : 'No probe'}</span>
              </div>
            </section>
          )}
        </Reveal>
      </div>

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
