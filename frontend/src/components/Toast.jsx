import { useEffect } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

/**
 * Self-contained toast notification, fixed to the bottom-right of the
 * viewport. Auto-dismisses after `duration` ms.
 */
export default function Toast({ type = 'success', message, onDismiss, duration = 5000 }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  const isSuccess = type === 'success'

  return (
    <div
      role="alert"
      className={`animate-toast-in fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-2xl border p-4 shadow-lg backdrop-blur-xl ${
        isSuccess
          ? 'border-emerald-200 bg-emerald-50/95 text-emerald-800'
          : 'border-red-200 bg-red-50/95 text-red-800'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
      ) : (
        <XCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
      )}
      <p className="text-sm font-medium leading-snug">{message}</p>
      <button
        onClick={onDismiss}
        className="ml-auto shrink-0 rounded-lg p-1 opacity-60 transition-opacity duration-200 ease-in-out hover:opacity-100"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}
