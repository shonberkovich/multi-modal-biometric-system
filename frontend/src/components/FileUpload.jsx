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
    <div className="panel panel-lift flex h-full flex-col p-2.5">
      <div className="flex items-start justify-between gap-3 px-2.5 pb-3.5 pt-2.5">
        <div className="min-w-0">
          <p className="hud-label">Media input</p>
          <p className="card-title mt-1.5">{label}</p>
          <p className="mt-0.5 text-[13px] text-ink-2">{description}</p>
        </div>
        {file ? (
          <span className="chip chip-ok">
            <CheckCircle2 size={12} strokeWidth={2.5} /> Locked
          </span>
        ) : (
          <span className="chip chip-idle">Upload</span>
        )}
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
        data-state={dragOver ? 'drag' : file ? 'done' : 'idle'}
        className="dropzone"
      >
        <svg className="dropzone-border" aria-hidden="true">
          <rect />
        </svg>
        {file ? (
          <>
            <span className="drop-orb">
              <Film size={26} />
            </span>
            <div className="max-w-[85%]">
              <p className="truncate font-mono text-xs font-bold text-ink">{file.name}</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ok">File loaded</p>
            </div>
          </>
        ) : (
          <>
            <span className="drop-orb">
              <UploadCloud size={26} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Drag & drop, or click to browse</p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
                {accept ? accept.replace('/*', '') : 'any'} file
              </p>
            </div>
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
        <div className="px-1 pb-1 pt-3">
          <button type="button" onClick={reset} className="btn btn-ghost w-full">
            <RotateCcw size={16} /> Replace
          </button>
        </div>
      )}
    </div>
  )
}
