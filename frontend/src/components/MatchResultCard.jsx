const RADIUS = 50
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/**
 * Visual Match / No Match verdict card with a radial similarity-score gauge.
 */
export default function MatchResultCard({ title, matched, score, identity }) {
  const pct = Math.max(0, Math.min(1, score)) * 100

  return (
    <div className="panel verdict overflow-hidden p-5 sm:p-7" data-tone={matched ? 'ok' : 'fail'}>
      <div className="verdict-glow" aria-hidden="true" />
      <div className="scanlines absolute inset-0 -z-10 rounded-[inherit]" aria-hidden="true" />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 pt-1">
          <p className="hud-label">{title || 'Verdict'}</p>
          <p className="verdict-word mt-4">{matched ? 'Match' : 'No Match'}</p>
          <p className="verdict-code mt-3 font-mono text-[10px] uppercase tracking-[0.18em]">
            {matched ? 'Identity confirmed' : 'No identity above threshold'}
          </p>
        </div>

        <div className="relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r="58" className="gauge-ticks" />
            <circle cx="60" cy="60" r={RADIUS} className="gauge-track" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              className="gauge-value"
              strokeDasharray={CIRCUMFERENCE}
              style={{ '--circ': CIRCUMFERENCE, '--offset': CIRCUMFERENCE * (1 - pct / 100) }}
            />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <p className="font-mono text-base font-bold tracking-tight text-ink sm:text-lg">
                {(score * 100).toFixed(1)}%
              </p>
              <p className="hud-label mt-0.5 text-[8.5px]">Similarity</p>
            </div>
          </div>
        </div>
      </div>

      {identity && (matched ? identity.full_name : null) && (
        <div className="identity-plate mt-6">
          <p className="hud-label">Identified as</p>
          <p className="mt-1.5 text-xl font-semibold tracking-tight text-ink sm:text-2xl">{identity.full_name}</p>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px] text-ink-2">
            {identity.national_id ? <span>NID {identity.national_id}</span> : null}
            {identity.random_id ? <span>UID {identity.random_id.slice(0, 13)}</span> : null}
          </div>
        </div>
      )}
    </div>
  )
}
