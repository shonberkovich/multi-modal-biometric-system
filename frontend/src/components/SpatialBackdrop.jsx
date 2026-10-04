import { useEffect, useRef } from 'react'

/**
 * Fixed spatial background: drifting mesh gradients, a blueprint ceiling grid,
 * a perspective floor grid and film grain. Layers parallax with the pointer
 * and scroll position.
 */
export default function SpatialBackdrop() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    let px = 0
    let py = 0

    const commit = () => {
      frame = 0
      el.style.setProperty('--px', px.toFixed(3))
      el.style.setProperty('--py', py.toFixed(3))
      el.style.setProperty('--sy', String(Math.round(window.scrollY)))
      el.style.setProperty('--sy-grid', ((window.scrollY * 0.25) % 64).toFixed(1))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(commit)
    }

    const onPointer = (event) => {
      if (!reduced) {
        px = event.clientX / window.innerWidth - 0.5
        py = event.clientY / window.innerHeight - 0.5
        schedule()
      }
      // Glass panels track the cursor for their spotlight and edge glow.
      const panel = event.target instanceof Element ? event.target.closest('.panel') : null
      if (panel) {
        const rect = panel.getBoundingClientRect()
        panel.style.setProperty('--mx', `${event.clientX - rect.left}px`)
        panel.style.setProperty('--my', `${event.clientY - rect.top}px`)
      }
    }

    window.addEventListener('pointermove', onPointer, { passive: true })
    if (!reduced) window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', schedule)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div ref={ref} className="backdrop" aria-hidden="true">
      <div className="backdrop-layer" style={{ '--depth': -26 }}>
        <div className="backdrop-mesh" />
      </div>
      <div className="backdrop-layer" style={{ '--depth': 10 }}>
        <div className="backdrop-ceiling" />
      </div>
      <div className="backdrop-layer" style={{ '--depth': 34 }}>
        <div className="backdrop-floor" />
        <div className="backdrop-horizon" />
      </div>
      <div className="backdrop-sweep" />
      <div className="backdrop-noise" />
      <div className="backdrop-vignette" />
    </div>
  )
}
