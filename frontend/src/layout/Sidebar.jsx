import { NavLink } from 'react-router-dom'
import { UserPlus, ScanFace, Layers, LayoutDashboard, ArrowUpRight, X } from 'lucide-react'
import BrandMark from '../components/BrandMark'

const links = [
  { to: '/enrollment', label: 'Enrollment', hint: 'Register identity', code: '01', icon: UserPlus },
  { to: '/verify/single', label: 'Single Verification', hint: '1 modality · 1:N', code: '02', icon: ScanFace },
  { to: '/verify/fusion', label: 'Fusion Verification', hint: 'Face · Voice · Palm', code: '03', icon: Layers },
  { to: '/dashboard', label: 'Dashboard', hint: 'Enrolled registry', code: '04', icon: LayoutDashboard },
]

const MODALITIES = ['Face', 'Voice', 'Palm', 'Gait', 'Print']

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fade-in fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(19rem,88vw)] p-3 transition-transform duration-500 ease-out-expo
          lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-[18.5rem] lg:shrink-0 lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="panel panel-strong flex h-full flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-5 pb-6 pt-6">
            <span className="brand-tile h-11 w-11">
              <BrandMark className="h-7 w-7" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-semibold tracking-tight text-ink">BioFusion</p>
              <p className="hud-label mt-1 text-[9.5px]">Multi-modal biometrics</p>
            </div>
            <button onClick={onClose} className="icon-btn h-9 w-9 lg:hidden" aria-label="Close navigation">
              <X size={16} />
            </button>
          </div>

          <div className="mx-5 mb-4 flex items-center gap-2">
            <span className="hud-label text-[9.5px]">Modules</span>
            <span className="hud-rule" />
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto px-3">
            {links.map(({ to, label, hint, code, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) => `nav-item group ${isActive ? 'is-active' : ''}`}
              >
                <span className="nav-code">{code}</span>
                <span className="nav-icon">
                  <Icon size={17} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-medium tracking-tight">{label}</span>
                  <span className="mt-0.5 block truncate font-mono text-[9.5px] uppercase tracking-[0.08em] text-ink-3">
                    {hint}
                  </span>
                </span>
                <ArrowUpRight size={14} className="nav-arrow" />
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-line px-5 pb-5 pt-5">
            <p className="hud-label text-[9.5px]">Modality array</p>
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {MODALITIES.map((name, i) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-2 rounded-xl border border-line bg-[var(--surface-sunken)] px-1 py-2.5"
                >
                  <span className="eq" aria-hidden="true">
                    {[0, 1, 2].map((bar) => (
                      <i key={bar} style={{ '--i': i * 3 + bar }} />
                    ))}
                  </span>
                  <span className="font-mono text-[8.5px] uppercase tracking-[0.08em] text-ink-3">{name}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-[10px] tracking-[0.12em] text-ink-3">
              © {new Date().getFullYear()} Biometric System
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
