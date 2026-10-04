import { useState } from 'react'
import { Layers, Loader2, ArrowRight, Send, RotateCcw, Check } from 'lucide-react'
import WebcamCapture from '../components/WebcamCapture'
import AudioRecorder from '../components/AudioRecorder'
import MatchResultCard from '../components/MatchResultCard'
import Toast from '../components/Toast'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import BiometricMesh from '../components/BiometricMesh'
import { verifyFusion } from '../api/client'

const STEPS = [
  { key: 'face', label: 'Face' },
  { key: 'voice', label: 'Voice' },
  { key: 'palm', label: 'Palm' },
]

// Fusion diagram geometry: three input nodes converging on a core.
const NODE_Y = [44, 115, 186]
const FLOW_PATHS = [
  'M70 44 C 160 44, 170 115, 236 115',
  'M70 115 L 236 115',
  'M70 186 C 160 186, 170 115, 236 115',
]

export default function FusionVerification() {
  const [stepIndex, setStepIndex] = useState(0)
  const [captures, setCaptures] = useState({ face: null, voice: null, palm: null })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState(null)

  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1
  const canAdvance = Boolean(captures[step.key])

  const setCapture = (file) => setCaptures((prev) => ({ ...prev, [step.key]: file }))

  const handleNext = () => {
    if (isLastStep) return
    setStepIndex((i) => i + 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setResult(null)
    try {
      const { data } = await verifyFusion(captures)
      setResult(data)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Fusion verification failed. Please try again.'
      setToast({ type: 'error', message: typeof detail === 'string' ? detail : JSON.stringify(detail) })
    } finally {
      setSubmitting(false)
    }
  }

  const startOver = () => {
    setStepIndex(0)
    setCaptures({ face: null, voice: null, palm: null })
    setResult(null)
  }

  // Display-only status for the stepper and fusion diagram.
  const nodeState = (key, i) => (captures[key] ? 'done' : i === stepIndex ? 'active' : 'pending')
  const allCaptured = STEPS.every(({ key }) => captures[key])

  return (
    <div>
      <PageHeader
        index="03"
        eyebrow="Multi-modal fusion"
        title={
          <>
            Fusion <span className="text-holo">verification</span>
          </>
        }
        description="Verify identity by fusing Face, Voice and Palmprint."
      >
        <dl className="flex shrink-0 gap-8">
          <div>
            <dt className="hud-label">Signals</dt>
            <dd className="stat-value mt-2">03</dd>
          </div>
          <div>
            <dt className="hud-label">Engines</dt>
            <dd className="stat-value mt-2">02</dd>
          </div>
        </dl>
      </PageHeader>

      {!result && (
        <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 xl:grid-cols-12 xl:items-start">
          <Reveal className="xl:col-span-7" delay={60}>
            <section className="panel p-5 sm:p-7">
              <div className="flex items-center gap-3.5">
                <span className="icon-tile">
                  <Layers size={18} />
                </span>
                <div className="min-w-0">
                  <p className="hud-label">Capture sequence</p>
                  <h2 className="card-title mt-1 text-lg">
                    Step {stepIndex + 1} of {STEPS.length}: {step.label}
                  </h2>
                </div>
              </div>

              <ol className="mt-6 grid grid-cols-3 gap-2">
                {STEPS.map((s, i) => (
                  <li key={s.key} className="step" data-state={i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'}>
                    <span className="step-index">
                      {captures[s.key] ? <Check size={12} strokeWidth={3} /> : `0${i + 1}`}
                    </span>
                    <span className="truncate text-[13px] font-medium">{s.label}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-6">
                {step.key === 'voice' ? (
                  <AudioRecorder onRecorded={setCapture} />
                ) : (
                  <WebcamCapture
                    label={step.label}
                    description={step.key === 'face' ? 'Look straight at the camera' : 'Show your open palm'}
                    onCapture={setCapture}
                  />
                )}
              </div>

              <div className="mt-6">
                {isLastStep ? (
                  <button
                    type="button"
                    disabled={!canAdvance || submitting}
                    onClick={handleSubmit}
                    className="btn btn-primary btn-lg w-full"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Verifying...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Submit fusion verification
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!canAdvance}
                    onClick={handleNext}
                    className="btn btn-primary btn-lg w-full"
                  >
                    Next <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </section>
          </Reveal>

          <Reveal className="xl:sticky xl:top-24 xl:col-span-5" delay={140}>
            <section className="panel overflow-hidden p-5 sm:p-7">
              <p className="hud-label">Fusion matrix</p>
              <h3 className="section-title mt-2">Three signals, one verdict</h3>

              <svg viewBox="0 0 320 230" className="mt-6 w-full" role="img" aria-label="Fusion pipeline status">
                {STEPS.map(({ key }, i) => (
                  <path key={key} d={FLOW_PATHS[i]} className="fx-flow" data-state={nodeState(key, i)} />
                ))}
                {STEPS.map(({ key, label }, i) => (
                  <g key={key} className="fx-node" data-state={nodeState(key, i)}>
                    <circle cx="46" cy={NODE_Y[i]} r="22" className="fx-pulse" />
                    <circle cx="46" cy={NODE_Y[i]} r="22" className="fx-ring" />
                    <text x="46" y={NODE_Y[i] + 3} textAnchor="middle">
                      {`0${i + 1}`}
                    </text>
                    <text x="80" y={NODE_Y[i] - 10}>
                      {label.toUpperCase()}
                    </text>
                  </g>
                ))}
                <g className="fx-core" data-state={submitting ? 'busy' : allCaptured ? 'ready' : 'idle'}>
                  <circle cx="268" cy="115" r="38" className="fx-core-ring" />
                  <circle cx="268" cy="115" r="26" className="fx-core-body" />
                  <text x="268" y="118" textAnchor="middle">
                    FUSE
                  </text>
                </g>
              </svg>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-line bg-[var(--surface-sunken)] p-4">
                  <dt className="hud-label">Majority vote</dt>
                  <dd className="mt-1.5 text-sm text-ink-2">2 of 3 modalities must agree</dd>
                </div>
                <div className="rounded-2xl border border-line bg-[var(--surface-sunken)] p-4">
                  <dt className="hud-label">Vector fusion</dt>
                  <dd className="mt-1.5 text-sm text-ink-2">Weighted Face · Voice · Palm vector</dd>
                </div>
              </dl>
            </section>
          </Reveal>
        </div>
      )}

      {result && (
        <div className="mt-10 sm:mt-14">
          <div className="grid gap-4 sm:gap-5 xl:grid-cols-12">
            <Reveal className="xl:col-span-7">
              <h2 className="hud-label mb-3">Majority Vote Result</h2>
              <MatchResultCard
                matched={result.majority_vote.matched}
                score={
                  Object.values(result.majority_vote.per_method).reduce((s, m) => s + m.score, 0) / 3
                }
                identity={result.majority_vote}
              />
              <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                {STEPS.map(({ key, label }) => {
                  const m = result.majority_vote.per_method[key]
                  return (
                    <li key={key} className="panel p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">{label}</span>
                        <span className={`chip ${m.matched ? 'chip-ok' : 'chip-fail'}`}>
                          {m.matched ? 'Match' : 'No Match'}
                        </span>
                      </div>
                      <p className="mt-3 font-mono text-lg font-bold text-ink">
                        {(m.score * 100).toFixed(1)}%
                      </p>
                      <div className={`meter mt-2 ${m.matched ? 'meter-ok' : 'meter-fail'}`}>
                        <span style={{ width: `${Math.max(0, Math.min(1, m.score)) * 100}%` }} />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </Reveal>

            <Reveal className="flex flex-col xl:col-span-5" delay={120}>
              <h2 className="hud-label mb-3">Vector Fusion Result</h2>
              <MatchResultCard
                matched={result.weighted_fusion.matched}
                score={result.weighted_fusion.score}
                identity={result.weighted_fusion}
              />
              <section className="panel relative mt-4 min-h-[220px] flex-1 overflow-hidden">
                <BiometricMesh
                  className="absolute inset-0 h-full w-full"
                  tone={result.weighted_fusion.matched ? 'ok' : 'fail'}
                />
                <div className="pointer-events-none absolute inset-x-5 top-5 flex items-start justify-between gap-3">
                  <p className="hud-label">Engine consensus</p>
                  <span
                    className={`chip ${
                      result.majority_vote.matched === result.weighted_fusion.matched ? 'chip-ok' : 'chip-fail'
                    }`}
                  >
                    {result.majority_vote.matched === result.weighted_fusion.matched ? 'Agree' : 'Disagree'}
                  </span>
                </div>
              </section>
            </Reveal>
          </div>

          <button type="button" onClick={startOver} className="btn btn-ghost mt-8">
            <RotateCcw size={16} /> Verify another person
          </button>
        </div>
      )}

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
