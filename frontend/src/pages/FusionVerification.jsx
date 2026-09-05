import { useState } from 'react'
import { Layers, Loader2, ArrowRight, Send } from 'lucide-react'
import WebcamCapture from '../components/WebcamCapture'
import AudioRecorder from '../components/AudioRecorder'
import MatchResultCard from '../components/MatchResultCard'
import Toast from '../components/Toast'
import { verifyFusion } from '../api/client'

const STEPS = [
  { key: 'face', label: 'Face' },
  { key: 'voice', label: 'Voice' },
  { key: 'palm', label: 'Palm' },
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

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Fusion Verification</h1>
      <p className="mt-2 text-sm text-slate-500">Verify identity by fusing Face, Voice and Palmprint.</p>

      {!result && (
        <div className="mt-8 max-w-md rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm shadow-slate-900/5 backdrop-blur-xl sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Step {stepIndex + 1} of {STEPS.length}: {step.label}
              </h2>
            </div>
          </div>

          <div className="mt-4 flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s.key}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ease-in-out ${
                  i <= stepIndex ? 'bg-brand-500' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all duration-200 ease-in-out hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition-all duration-200 ease-in-out hover:from-brand-600 hover:to-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
              >
                Next <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Majority Vote Result
              </h2>
              <MatchResultCard
                matched={result.majority_vote.matched}
                score={
                  Object.values(result.majority_vote.per_method).reduce((s, m) => s + m.score, 0) / 3
                }
                identity={result.majority_vote}
              />
              <ul className="mt-4 space-y-1.5 text-xs text-slate-500">
                {STEPS.map(({ key, label }) => {
                  const m = result.majority_vote.per_method[key]
                  return (
                    <li key={key} className="flex items-center justify-between">
                      <span>{label}</span>
                      <span className={m.matched ? 'text-emerald-600' : 'text-red-500'}>
                        {m.matched ? 'Match' : 'No Match'} ({(m.score * 100).toFixed(1)}%)
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                Vector Fusion Result
              </h2>
              <MatchResultCard
                matched={result.weighted_fusion.matched}
                score={result.weighted_fusion.score}
                identity={result.weighted_fusion}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={startOver}
            className="mt-6 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50 active:scale-[0.98]"
          >
            Verify another person
          </button>
        </div>
      )}

      {toast && <Toast {...toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
