import { useState } from 'react'

const STORAGE_KEY = 'biofusion-theme'

function applyTheme(theme, origin) {
  const root = document.documentElement
  const commit = () => {
    root.dataset.theme = theme
  }
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    commit()
    return
  }
  // Circular "holographic" reveal of the new theme, expanding from the switch.
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  )
  const transition = document.startViewTransition(commit)
  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${origin.x}px ${origin.y}px)`,
            `circle(${radius}px at ${origin.x}px ${origin.y}px)`,
          ],
        },
        { duration: 900, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {})
}

/**
 * Optic-shutter theme switch: an iris that slides, rotates and dilates
 * (Nox) or contracts (Lux), then shifts the whole interface.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  )
  const isDark = theme === 'dark'

  const toggle = (event) => {
    const next = isDark ? 'light' : 'dark'
    const rect = event.currentTarget.getBoundingClientRect()
    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    setTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage unavailable (private mode); the choice still applies this session.
    }
    // Let the shutter finish its mechanical slide before the world shifts.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(() => applyTheme(next, origin), reduce ? 0 : 300)
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Dark mode"
      title={isDark ? 'Switch to Lux (light) mode' : 'Switch to Nox (dark) mode'}
      onClick={toggle}
      data-state={theme}
      className="optic"
    >
      <span className="optic-ticks" aria-hidden="true" />
      <span className="optic-label optic-label-nox" aria-hidden="true">
        Nox
      </span>
      <span className="optic-label optic-label-lux" aria-hidden="true">
        Lux
      </span>
      <span className="optic-sweep" aria-hidden="true" />
      <span className="optic-knob" aria-hidden="true">
        <span className="optic-pupil" />
      </span>
    </button>
  )
}
