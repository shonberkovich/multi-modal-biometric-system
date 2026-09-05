import { ShieldCheck, ShieldX } from 'lucide-react'

/**
 * Visual Match / No Match result card with a similarity-score bar.
 */
export default function MatchResultCard({ title, matched, score, identity }) {
  const pct = Math.max(0, Math.min(1, score)) * 100

  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm backdrop-blur-xl transition-all duration-300 ease-in-out ${
        matched
          ? 'border-emerald-200 bg-emerald-50/80 shadow-emerald-900/5'
          : 'border-red-200 bg-red-50/80 shadow-red-900/5'
      }`}
    >
      <div className="flex items-center gap-3">
        {matched ? (
          <ShieldCheck size={28} className="text-emerald-500" />
        ) : (
          <ShieldX size={28} className="text-red-500" />
        )}
        <div>
          {title && <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</p>}
          <p className={`text-lg font-bold ${matched ? 'text-emerald-700' : 'text-red-700'}`}>
            {matched ? 'Match' : 'No Match'}
          </p>
        </div>
      </div>

      {identity && (matched ? identity.full_name : null) && (
        <p className="mt-2 text-sm text-slate-600">
          Identified as <span className="font-semibold text-slate-900">{identity.full_name}</span>
          {identity.national_id ? ` (${identity.national_id})` : ''}
        </p>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
          <span>Similarity score</span>
          <span>{(score * 100).toFixed(1)}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/70">
          <div
            className={`h-full rounded-full transition-all duration-500 ease-in-out ${
              matched ? 'bg-emerald-500' : 'bg-red-400'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
