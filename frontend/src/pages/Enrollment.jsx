import { useState } from 'react'
import { UserPlus, Loader2, Send } from 'lucide-react'
import WebcamCapture from '../components/WebcamCapture'
import AudioRecorder from '../components/AudioRecorder'
import FileUpload from '../components/FileUpload'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import BiometricMesh from '../components/BiometricMesh'
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

  // Display-only readouts derived from the form state above.
  const capturedCount = REQUIRED_METHODS.filter((method) => captures[method]).length
  const identityReady = Boolean(nationalId.trim() && fullName.trim())

  return (
    <div>
      <PageHeader
        index="01"
        eyebrow="Identity enrollment"
        title={
          <>
            Enroll a <span className="text-holo">new identity</span>
          </>
        }
        description="Register a new person's biometric profile across all 5 modalities."
      >
        <dl className="flex shrink-0 gap-8">
          <div>
            <dt className="hud-label">Modalities</dt>
            <dd className="stat-value mt-2">05</dd>
          </div>
          <div>
            <dt className="hud-label">Captured</dt>
            <dd className="stat-value mt-2">
              {String(capturedCount).padStart(2, '0')}
              <span className="text-ink-3">/05</span>
            </dd>
          </div>
        </dl>
      </PageHeader>

      <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 xl:grid-cols-12">
        <Reveal className="xl:col-span-7" delay={60}>
          <section className="panel @container h-full p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="icon-tile">
                  <UserPlus size={18} />
                </span>
                <div>
                  <p className="hud-label">Step A</p>
                  <h2 className="card-title mt-1 text-lg">Identity details</h2>
                </div>
              </div>
              <span className={`chip ${identityReady ? 'chip-ok' : 'chip-idle'}`}>
                {identityReady ? 'Complete' : 'Pending'}
              </span>
            </div>

            <div className="mt-8 grid gap-5 @lg:grid-cols-2">
              <label className="block">
                <span className="field-label">National ID</span>
                <input
                  type="text"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="e.g. 123456789"
                  className="field font-mono tracking-wider"
                />
              </label>

              <label className="block">
                <span className="field-label">Full Name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="field"
                />
              </label>
            </div>

            <div className="record-strip mt-6">
              <span className="text-scan">Record</span>
              <span className="min-w-0 truncate">NID::{nationalId.trim() || '—'}</span>
              <span className="min-w-0 truncate">NAME::{fullName.trim() || '—'}</span>
            </div>
          </section>
        </Reveal>

        <Reveal className="xl:col-span-5" delay={140}>
          <section className="panel relative h-full min-h-[320px] overflow-hidden">
            <div className="scanlines absolute inset-0" aria-hidden="true" />
            <BiometricMesh
              className="absolute inset-0 h-full w-full"
              tone={isComplete ? 'ok' : 'scan'}
              busy={submitting}
            />
            <div className="pointer-events-none absolute inset-x-5 top-5 flex items-start justify-between sm:inset-x-6 sm:top-6">
              <div>
                <p className="hud-label">Subject topology</p>
                <p className="mt-1.5 font-mono text-[11px] text-ink-2">3D mesh · live render</p>
              </div>
              <span className={`chip ${isComplete ? 'chip-ok' : ''}`}>
                <span className="dot-live" /> {isComplete ? 'Ready' : 'Mapping'}
              </span>
            </div>
            <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 sm:inset-x-6 sm:bottom-6">
              <span>{capturedCount}/5 signals</span>
              <span>{identityReady ? 'ID bound' : 'ID unbound'}</span>
            </div>
          </section>
        </Reveal>
      </div>

      <Reveal className="mt-14 flex items-end justify-between gap-4 sm:mt-20">
        <div>
          <p className="hud-label">Step B</p>
          <h2 className="section-title mt-2">Camera captures</h2>
        </div>
        <p className="hidden font-mono text-xs tracking-[0.12em] text-ink-3 sm:block">
          {String(capturedCount).padStart(2, '0')} / 05 locked
        </p>
      </Reveal>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-6">
        <Reveal className="cam-fill sm:col-span-2 xl:col-span-4 xl:row-span-2">
          <WebcamCapture
            label="Face"
            description="Look straight at the camera"
            onCapture={setCapture('face')}
          />
        </Reveal>
        <Reveal className="xl:col-span-2" delay={80}>
          <WebcamCapture
            label="Palm"
            description="Show your open palm"
            onCapture={setCapture('palm')}
          />
        </Reveal>
        <Reveal className="xl:col-span-2" delay={160}>
          <WebcamCapture
            label="Fingerprint"
            description="Hold a fingertip close to the camera"
            onCapture={setCapture('fingerprint')}
          />
        </Reveal>
        <Reveal className="xl:col-span-3" delay={80}>
          <AudioRecorder onRecorded={setCapture('voice')} />
        </Reveal>
        <Reveal className="xl:col-span-3" delay={160}>
          <FileUpload
            label="Gait"
            description="Upload a short walking video"
            accept="video/*"
            onFile={setCapture('gait')}
          />
        </Reveal>
      </div>

      <div className="sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-20 mt-10 sm:bottom-6">
        <div className="panel panel-strong flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            <div className="flex shrink-0 gap-1.5" aria-hidden="true">
              {REQUIRED_METHODS.map((method) => (
                <span key={method} className="seg" data-on={Boolean(captures[method])} />
              ))}
            </div>
            <div className="min-w-0">
              <p className="hud-label">Capture matrix</p>
              <p className="mt-1 truncate font-mono text-xs text-ink-2">
                {capturedCount}/5 modalities · identity {identityReady ? 'set' : 'pending'}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={!isComplete || submitting}
            onClick={handleSubmit}
            className="btn btn-primary btn-lg w-full sm:w-auto"
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
      </div>

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
