import { useEffect } from 'react'
import { CheckCircle2, XCircle, X } from 'lucide-react'

/**
 * Self-contained toast notification (top on mobile, bottom-right from sm up).
 * Auto-dismisses after `duration` ms.
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
      data-tone={isSuccess ? 'ok' : 'fail'}
      className="toast fixed inset-x-4 top-20 z-[60] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:top-auto sm:w-[25rem]"
    >
      <div className="flex items-start gap-3 p-4">
        <span className="toast-icon">
          {isSuccess ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="hud-label" style={{ color: 'rgb(var(--tone))' }}>
            {isSuccess ? 'System · Success' : 'System · Error'}
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-ink">{message}</p>
        </div>
        <button onClick={onDismiss} className="icon-btn h-8 w-8" aria-label="Dismiss">
          <X size={15} />
        </button>
      </div>
      <span className="toast-timer" style={{ animationDuration: `${duration}ms` }} />
    </div>
  )
}
