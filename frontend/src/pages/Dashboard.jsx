import { useEffect, useState } from 'react'
import { Users, Loader2, Activity } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Reveal from '../components/Reveal'
import { listPersons } from '../api/client'

const METHODS = ['face', 'voice', 'palm', 'gait', 'fingerprint']
const VOLUNTEER_TARGET = 20

/** Deterministic 5×5 mirrored glyph derived from a person's random ID. */
function IdGlyph({ seed }) {
  const hex = String(seed).replace(/[^0-9a-f]/gi, '')
  const cells = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      if (parseInt(hex[row * 3 + col] || '1', 16) % 2) continue
      cells.push([col, row])
      if (col < 2) cells.push([4 - col, row])
    }
  }
  return (
    <span className="id-glyph-tile">
      <svg viewBox="-0.5 -0.5 6 6" className="h-6 w-6" shapeRendering="crispEdges" aria-hidden="true">
        {cells.map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />
        ))}
      </svg>
    </span>
  )
}

export default function Dashboard() {
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    listPersons()
      .then(({ data }) => setPersons(data))
      .catch(() => setError('Could not load enrolled users.'))
      .finally(() => setLoading(false))
  }, [])

  const count = persons.length
  const progressPct = Math.min(100, (count / VOLUNTEER_TARGET) * 100)

  // Display-only: how many enrolled people have each modality on file.
  const coverage = METHODS.map((method) => ({
    method,
    total: persons.filter((p) => p.methods_enrolled.includes(method)).length,
  }))

  return (
    <div>
      <PageHeader
        index="04"
        eyebrow="Enrollment registry"
        title={
          <>
            Identity <span className="text-holo">dashboard</span>
          </>
        }
        description="Enrolled users overview."
      >
        <dl className="flex shrink-0 gap-8">
          <div>
            <dt className="hud-label">Records</dt>
            <dd className="stat-value mt-2">{String(count).padStart(2, '0')}</dd>
          </div>
          <div>
            <dt className="hud-label">Target</dt>
            <dd className="stat-value mt-2">{VOLUNTEER_TARGET}</dd>
          </div>
        </dl>
      </PageHeader>

      <div className="mt-10 grid gap-4 sm:mt-14 sm:gap-5 md:grid-cols-2 xl:grid-cols-12">
        <Reveal className="xl:col-span-5" delay={60}>
          <section className="panel h-full p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <span className="icon-tile">
                  <Users size={18} />
                </span>
                <div>
                  <p className="hud-label">Cohort</p>
                  <h2 className="card-title mt-1 text-lg">Volunteer progress</h2>
                </div>
              </div>
              <span className="chip">{Math.round(progressPct)}%</span>
            </div>

            <p className="mt-8 flex items-baseline gap-3 font-display">
              <span className="text-[clamp(4.5rem,3rem+6vw,7rem)] font-semibold leading-[0.85] tracking-[-0.07em] text-ink">
                {String(count).padStart(2, '0')}
              </span>
              <span className="text-2xl font-medium tracking-tight text-ink-3">/ {VOLUNTEER_TARGET}</span>
            </p>
            <p className="mt-3 font-mono text-xs tracking-[0.08em] text-ink-2">
              {count} / {VOLUNTEER_TARGET} enrolled
            </p>

            <div className="mt-7 grid grid-cols-10 gap-1.5" aria-hidden="true">
              {Array.from({ length: VOLUNTEER_TARGET }, (_, i) => (
                <span
                  key={i}
                  className="cohort-cell"
                  data-on={i < count}
                  style={{ transitionDelay: `${i * 35}ms` }}
                />
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal className="xl:col-span-7" delay={140}>
          <section className="panel h-full p-5 sm:p-7">
            <div className="flex items-center gap-3.5">
              <span className="icon-tile">
                <Activity size={18} />
              </span>
              <div>
                <p className="hud-label">Modality coverage</p>
                <h2 className="card-title mt-1 text-lg">Signals on file</h2>
              </div>
            </div>

            <ul className="mt-8 space-y-5">
              {coverage.map(({ method, total }) => (
                <li key={method}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-ink">{method}</span>
                    <span className="font-mono text-xs text-ink-2">
                      {total}/{count}
                    </span>
                  </div>
                  <div className="meter mt-2">
                    <span style={{ width: count ? `${(total / count) * 100}%` : '0%' }} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal className="md:col-span-2 xl:col-span-12" delay={200}>
          <section className="panel overflow-hidden">
            <div className="flex items-end justify-between gap-4 border-b border-line px-5 py-5 sm:px-7">
              <div>
                <p className="hud-label">Registry</p>
                <h2 className="section-title mt-2">Enrolled identities</h2>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">
                {count} records
              </span>
            </div>

            {loading ? (
              <div className="p-5 sm:p-7">
                <div className="flex items-center gap-2.5 text-sm text-ink-2">
                  <Loader2 size={18} className="animate-spin text-scan" /> Loading enrolled users...
                </div>
                <div className="mt-6 space-y-3" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="skeleton h-14" />
                  ))}
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 p-12 text-center">
                <span className="chip chip-fail">Link error</span>
                <p className="text-sm text-fail">{error}</p>
              </div>
            ) : persons.length === 0 ? (
              <div className="flex flex-col items-center gap-3 p-12 text-center">
                <span className="chip chip-idle">Empty</span>
                <p className="text-sm text-ink-2">No one has enrolled yet.</p>
              </div>
            ) : (
              <>
                <ul className="divide-y divide-line md:hidden">
                  {persons.map((p) => (
                    <li key={p.random_id} className="p-5">
                      <div className="flex items-center gap-3">
                        <IdGlyph seed={p.random_id} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{p.full_name}</p>
                          <p className="truncate font-mono text-[10.5px] text-ink-3">UID {p.random_id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 font-mono text-[11px]">
                        <div>
                          <dt className="hud-label text-[9.5px]">National ID</dt>
                          <dd className="mt-1 text-ink-2">{p.national_id}</dd>
                        </div>
                        <div>
                          <dt className="hud-label text-[9.5px]">Enrolled At</dt>
                          <dd className="mt-1 text-ink-2">{new Date(p.created_at).toLocaleString()}</dd>
                        </div>
                      </dl>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {METHODS.map((method) => (
                          <span key={method} className="pill" data-on={p.methods_enrolled.includes(method)}>
                            {method}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>

                <table className="registry hidden w-full text-left text-sm md:table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>National ID</th>
                      <th>Enrolled At</th>
                      <th>Methods</th>
                    </tr>
                  </thead>
                  <tbody>
                    {persons.map((p) => (
                      <tr key={p.random_id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <IdGlyph seed={p.random_id} />
                            <div className="min-w-0">
                              <p className="font-medium text-ink">{p.full_name}</p>
                              <p className="font-mono text-[10.5px] text-ink-3">UID {p.random_id.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-[13px] text-ink-2">{p.national_id}</td>
                        <td className="font-mono text-xs text-ink-2">{new Date(p.created_at).toLocaleString()}</td>
                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            {METHODS.map((method) => (
                              <span key={method} className="pill" data-on={p.methods_enrolled.includes(method)}>
                                {method}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        </Reveal>
      </div>
    </div>
  )
}
