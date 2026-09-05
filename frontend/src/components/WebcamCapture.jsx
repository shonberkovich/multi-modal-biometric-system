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
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur-xl transition-all duration-300 ease-in-out hover:shadow-md">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        {preview && <CheckCircle2 size={18} className="text-emerald-500" />}
      </div>

      <div className="relative mt-3 aspect-video w-full overflow-hidden bg-slate-900">
        {preview ? (
          <img src={preview} alt={`${label} capture`} className="h-full w-full object-cover" />
        ) : (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="p-4">
        {preview ? (
          <button
            type="button"
            onClick={retake}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50 active:scale-[0.98]"
          >
            <RotateCcw size={16} /> Retake
          </button>
        ) : (
          <button
            type="button"
            onClick={capture}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-3.5 py-2.5 text-sm font-medium text-white shadow-md shadow-brand-500/30 transition-all duration-200 ease-in-out hover:from-brand-600 hover:to-brand-700 active:scale-[0.98]"
          >
            <Camera size={16} /> Capture
          </button>
        )}
      </div>
    </div>
  )
}
