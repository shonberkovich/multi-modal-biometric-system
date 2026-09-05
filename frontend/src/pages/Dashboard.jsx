import { useEffect, useState } from 'react'
import { Users, Loader2 } from 'lucide-react'
import { listPersons } from '../api/client'

const METHODS = ['face', 'voice', 'palm', 'gait', 'fingerprint']
const VOLUNTEER_TARGET = 20

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

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
      <p className="mt-2 text-sm text-slate-500">Enrolled users overview.</p>

      <div className="mt-8 rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm shadow-slate-900/5 backdrop-blur-xl sm:p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-500/30">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Volunteer progress</h2>
            <p className="text-sm text-slate-500">
              {count} / {VOLUNTEER_TARGET} enrolled
            </p>
          </div>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-500 ease-in-out"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/80 shadow-sm shadow-slate-900/5 backdrop-blur-xl">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin" /> Loading enrolled users...
          </div>
        ) : error ? (
          <p className="p-10 text-center text-sm text-red-500">{error}</p>
        ) : persons.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">No one has enrolled yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/70 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Full Name</th>
                  <th className="px-5 py-3 font-medium">National ID</th>
                  <th className="px-5 py-3 font-medium">Enrolled At</th>
                  <th className="px-5 py-3 font-medium">Methods</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {persons.map((p) => (
                  <tr key={p.random_id} className="transition-colors duration-150 ease-in-out hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-medium text-slate-900">{p.full_name}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.national_id}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {new Date(p.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        {METHODS.map((method) => {
                          const done = p.methods_enrolled.includes(method)
                          return (
                            <span
                              key={method}
                              className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize transition-colors duration-150 ease-in-out ${
                                done ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {method}
                            </span>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
