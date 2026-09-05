import { NavLink } from 'react-router-dom'
import { Fingerprint, UserPlus, ScanFace, Layers, LayoutDashboard } from 'lucide-react'

const links = [
  { to: '/enrollment', label: 'Enrollment', icon: UserPlus },
  { to: '/verify/single', label: 'Single Verification', icon: ScanFace },
  { to: '/verify/fusion', label: 'Fusion Verification', icon: Layers },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
          flex flex-col bg-white/70 backdrop-blur-xl border-r border-slate-200/70 shadow-xl shadow-slate-900/5`}
      >
        <div className="flex items-center gap-3 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-500/30">
            <Fingerprint size={22} />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-slate-900">BioFusion</p>
            <p className="text-xs text-slate-500">Multi-modal biometrics</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out
                ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-6 py-5 text-xs text-slate-400">
          © {new Date().getFullYear()} Biometric System
        </div>
      </aside>
    </>
  )
}
