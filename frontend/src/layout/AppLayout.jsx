import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'
import SpatialBackdrop from '../components/SpatialBackdrop'
import ThemeToggle from '../components/ThemeToggle'
import BrandMark from '../components/BrandMark'

function HudClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="hidden items-center gap-2.5 font-mono text-[11px] tracking-[0.16em] text-ink-2 sm:inline-flex">
      <span className="dot-live text-scan" />
      {now.toLocaleTimeString([], { hour12: false })}
    </span>
  )
}

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="relative flex min-h-screen overflow-x-clip">
      <SpatialBackdrop />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="topbar sticky top-0 z-30">
          <div className="mx-auto flex w-full max-w-[1240px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="icon-btn lg:hidden"
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2.5 lg:hidden">
              <span className="brand-tile h-8 w-8 rounded-[10px]">
                <BrandMark className="h-5 w-5" />
              </span>
              <span className="font-display text-sm font-semibold tracking-tight text-ink">BioFusion</span>
            </div>
            <p className="hud-label hidden lg:block">
              BioFusion <span className="text-scan">//</span> Identity console
            </p>

            <div className="ml-auto flex items-center gap-4">
              <HudClock />
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-24 pt-8 sm:px-6 sm:pt-10 lg:px-10 lg:pt-14">
          <div className="mx-auto w-full max-w-[1240px]">{children}</div>
        </main>
      </div>
    </div>
  )
}
