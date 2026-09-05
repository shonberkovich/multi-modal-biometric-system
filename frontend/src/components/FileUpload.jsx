import { useRef, useState } from 'react'
import { UploadCloud, CheckCircle2, RotateCcw, Film } from 'lucide-react'

/**
 * Drag-and-drop / click-to-browse file upload card. Calls onFile(File).
 */
export default function FileUpload({ label, description, accept, onFile }) {
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (selected) => {
    if (!selected) return
    setFile(selected)
    onFile(selected)
  }

  const reset = () => {
    setFile(null)
    onFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur-xl transition-all duration-300 ease-in-out hover:shadow-md">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
        {file && <CheckCircle2 size={18} className="text-emerald-500" />}
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          handleFile(e.dataTransfer.files?.[0])
        }}
        onClick={() => !file && inputRef.current?.click()}
        className={`m-4 flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-center transition-all duration-200 ease-in-out ${
          dragOver
            ? 'border-brand-500 bg-brand-50'
            : file
              ? 'border-emerald-300 bg-emerald-50'
              : 'border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/40'
        }`}
      >
        {file ? (
          <>
            <Film size={28} className="text-emerald-500" />
            <p className="max-w-[80%] truncate text-xs font-medium text-slate-700">{file.name}</p>
          </>
        ) : (
          <>
            <UploadCloud size={28} className="text-slate-400" />
            <p className="text-xs text-slate-500">Drag & drop, or click to browse</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {file && (
        <div className="p-4 pt-0">
          <button
            type="button"
            onClick={reset}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-all duration-200 ease-in-out hover:bg-slate-50 active:scale-[0.98]"
          >
            <RotateCcw size={16} /> Replace
          </button>
        </div>
      )}
    </div>
  )
}
