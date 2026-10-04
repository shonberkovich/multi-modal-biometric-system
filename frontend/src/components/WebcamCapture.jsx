import { useCallback, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { Camera, RotateCcw, CheckCircle2 } from 'lucide-react'

function dataUrlToFile(dataUrl, filename) {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)[1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
}

/**
 * Reusable webcam capture card. Calls onCapture(File) once a photo is taken.
 */
export default function WebcamCapture({ label, description, onCapture }) {
  const webcamRef = useRef(null)
  const [preview, setPreview] = useState(null)

  const capture = useCallback(() => {
    const dataUrl = webcamRef.current?.getScreenshot()
    if (!dataUrl) return
    setPreview(dataUrl)
    const file = dataUrlToFile(dataUrl, `${label.toLowerCase()}.jpg`)
    onCapture(file)
  }, [label, onCapture])

  const retake = () => {
    setPreview(null)
    onCapture(null)
  }

  return (
    <div className="panel panel-lift flex h-full flex-col p-2.5">
      <div className="flex items-start justify-between gap-3 px-2.5 pb-3.5 pt-2.5">
        <div className="min-w-0">
          <p className="hud-label">Optical sensor</p>
          <p className="card-title mt-1.5">{label}</p>
          <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>
        </div>
        {preview ? (
          <span className="chip chip-ok">
            <CheckCircle2 size={12} strokeWidth={2.5} /> Locked
          </span>
        ) : (
          <span className="chip">
            <span className="dot-live" /> Live
          </span>
        )}
      </div>

      <div className="cam-viewport w-full">
        {preview ? (
          <img src={preview} alt={`${label} capture`} className="cam-media" />
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="cam-media"
          />
        )}
        <div className="cam-grid" aria-hidden="true" />
        <div className="cam-vignette" aria-hidden="true" />
        {!preview && <div className="scan-laser" aria-hidden="true" />}
        {!preview && <div className="cam-reticle" aria-hidden="true" />}
        <div className={`hud-corners ${preview ? 'is-locked' : ''}`} aria-hidden="true" />
        {preview && <div className="cam-flash" aria-hidden="true" />}
        <div className="cam-readout" aria-hidden="true">
          <span>{preview ? 'Frame locked' : 'Rec · live'}</span>
          <span>{label}</span>
        </div>
      </div>

      <div className="px-1 pb-1 pt-3">
        {preview ? (
          <button type="button" onClick={retake} className="btn btn-ghost w-full">
            <RotateCcw size={16} /> Retake
          </button>
        ) : (
          <button type="button" onClick={capture} className="btn btn-primary w-full">
            <Camera size={16} /> Capture
          </button>
        )}
      </div>
    </div>
  )
}
