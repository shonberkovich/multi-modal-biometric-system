import { useEffect, useRef } from 'react'

const TONE_VARS = { scan: '--rgb-scan-bright', ok: '--rgb-ok', fail: '--rgb-fail' }

const RINGS = 34
const PER_RING = 96

// Procedural head topology: latitude rings of a sphere, sculpted into a face.
function buildHead() {
  const pos = []
  for (let i = 1; i < RINGS; i++) {
    const phi = (i / RINGS) * Math.PI
    const r = Math.sin(phi)
    const y = Math.cos(phi) * 1.05
    for (let j = 0; j < PER_RING; j++) {
      const theta = (j / PER_RING) * Math.PI * 2
      let x = r * Math.sin(theta) * 0.76
      let z = r * Math.cos(theta) * 0.88
      if (y < 0) {
        const t = Math.min(1, -y / 1.05)
        x *= 1 - 0.34 * t * t
        z *= 1 - 0.16 * t * t
      }
      if (z > 0) {
        const bump = (cx, cy, sx, sy) => Math.exp(-((x - cx) ** 2) / sx - ((y - cy) ** 2) / sy)
        z +=
          (z / 0.88) *
          (0.26 * bump(0, -0.06, 0.01, 0.05) + // nose ridge
            0.1 * bump(0, -0.18, 0.008, 0.008) - // nose tip
            0.13 * (bump(0.27, 0.17, 0.014, 0.008) + bump(-0.27, 0.17, 0.014, 0.008)) + // eye sockets
            0.07 * bump(0, 0.3, 0.12, 0.005) + // brow ridge
            0.05 * (bump(0.4, -0.04, 0.02, 0.02) + bump(-0.4, -0.04, 0.02, 0.02)) + // cheekbones
            0.07 * bump(0, -0.4, 0.035, 0.004) + // lips
            0.08 * bump(0, -0.74, 0.04, 0.012)) // chin
      }
      pos.push(x, y, z)
    }
  }
  return new Float32Array(pos)
}

const HEAD = buildHead()
const COUNT = HEAD.length / 3

// Facial landmarks (model-space targets) and the edges joining them.
const LANDMARK_TARGETS = [
  [0.27, 0.17], [-0.27, 0.17], [0, -0.08], [0.17, -0.41], [-0.17, -0.41],
  [0, -0.78], [0, 0.55], [0.47, -0.1], [-0.47, -0.1],
]
const LANDMARK_EDGES = [
  [0, 1], [0, 2], [1, 2], [2, 3], [2, 4], [3, 4], [3, 5], [4, 5],
  [6, 0], [6, 1], [7, 0], [7, 3], [8, 1], [8, 4],
]
const LANDMARKS = LANDMARK_TARGETS.map(([tx, ty]) => {
  let best = 0
  let bestDist = Infinity
  for (let i = 0; i < COUNT; i++) {
    if (HEAD[i * 3 + 2] <= 0) continue
    const d = (HEAD[i * 3] - tx) ** 2 + (HEAD[i * 3 + 1] - ty) ** 2
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  }
  return best
})

const DEPTH_BANDS = [
  [0, 0.3, 0.07],
  [0.3, 0.5, 0.16],
  [0.5, 0.7, 0.34],
  [0.7, 1.01, 0.62],
]
const SCAN_BAND = 0.07
const STATIC_TIME = 2600

/**
 * Native 3D biometric head: a rotating point-cloud face with contour rings,
 * landmark triangulation, an orbit ring and a sweeping scan plane. Colours
 * follow the active theme; `tone` switches the accent (scan / ok / fail) and
 * `busy` speeds the scan up.
 */
export default function BiometricMesh({ tone = 'scan', busy = false, className = '' }) {
  const canvasRef = useRef(null)
  const stateRef = useRef({ tone, busy, dirty: true, redraw: null })

  useEffect(() => {
    const state = stateRef.current
    state.tone = tone
    state.busy = busy
    state.dirty = true
    state.redraw?.()
  }, [tone, busy])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const state = stateRef.current
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const proj = new Float32Array(COUNT * 4) // screen x, screen y, depth 0..1, rotated y
    const p0 = new Float32Array(4)
    const p1 = new Float32Array(4)
    let w = 0
    let h = 0
    let raf = 0
    let base = '150 162 180'
    let accent = '0 229 255'

    const readColors = () => {
      const styles = getComputedStyle(canvas)
      base = styles.getPropertyValue('--rgb-mesh').trim() || base
      accent = styles.getPropertyValue(TONE_VARS[state.tone] || TONE_VARS.scan).trim() || accent
      state.dirty = false
    }

    const draw = (t) => {
      if (state.dirty) readColors()
      ctx.clearRect(0, 0, w, h)
      if (!w || !h) return

      const yaw = Math.sin(t * 0.00031) * 0.6
      const pitch = -0.12 + Math.sin(t * 0.00019) * 0.07
      const cosY = Math.cos(yaw)
      const sinY = Math.sin(yaw)
      const cosP = Math.cos(pitch)
      const sinP = Math.sin(pitch)
      const scale = Math.min(w * 0.36, h * 0.31)
      const cx = w / 2
      const cy = h * 0.54
      const scan = Math.sin(t * (state.busy ? 0.0026 : 0.0012)) * 0.98

      // Rotate + perspective-project a model point into out[o..o+3].
      const project = (out, o, x, y, z) => {
        const x1 = x * cosY + z * sinY
        const z1 = -x * sinY + z * cosY
        const y1 = y * cosP - z1 * sinP
        const z2 = y * sinP + z1 * cosP
        const k = 3.6 / (3.6 - z2)
        out[o] = cx + x1 * scale * k
        out[o + 1] = cy - y1 * scale * k
        out[o + 2] = Math.min(1, Math.max(0, (z2 + 0.9) / 1.9))
        out[o + 3] = y1
      }

      for (let i = 0; i < COUNT; i++) {
        project(proj, i * 4, HEAD[i * 3], HEAD[i * 3 + 1], HEAD[i * 3 + 2])
      }

      // Orbit ring beneath the chin, split into back and front halves.
      const spin = t * 0.00045
      for (const front of [false, true]) {
        ctx.beginPath()
        for (let s = 0; s < 120; s++) {
          if (s % 3 === 2) continue
          const a0 = (s / 120) * Math.PI * 2 + spin
          const a1 = ((s + 1) / 120) * Math.PI * 2 + spin
          project(p0, 0, Math.cos(a0) * 1.18, -1.12, Math.sin(a0) * 1.18)
          project(p1, 0, Math.cos(a1) * 1.18, -1.12, Math.sin(a1) * 1.18)
          if (p0[2] > 0.5 !== front) continue
          ctx.moveTo(p0[0], p0[1])
          ctx.lineTo(p1[0], p1[1])
        }
        ctx.lineWidth = 1
        ctx.strokeStyle = front ? `rgb(${accent} / 0.45)` : `rgb(${base} / 0.14)`
        ctx.stroke()
      }

      // Contour rings across the visible hemisphere.
      ctx.beginPath()
      for (let r = 0; r < RINGS - 1; r++) {
        for (let j = 0; j < PER_RING; j++) {
          const a = r * PER_RING + j
          const b = r * PER_RING + ((j + 1) % PER_RING)
          if (proj[a * 4 + 2] < 0.55 || proj[b * 4 + 2] < 0.55) continue
          ctx.moveTo(proj[a * 4], proj[a * 4 + 1])
          ctx.lineTo(proj[b * 4], proj[b * 4 + 1])
        }
      }
      ctx.lineWidth = 0.6
      ctx.strokeStyle = `rgb(${base} / 0.13)`
      ctx.stroke()

      // Point cloud, batched by depth band.
      for (const [lo, hi, alpha] of DEPTH_BANDS) {
        ctx.beginPath()
        for (let i = 0; i < COUNT; i++) {
          const d = proj[i * 4 + 2]
          if (d < lo || d >= hi || Math.abs(proj[i * 4 + 3] - scan) < SCAN_BAND) continue
          const s = 0.6 + d * 1.2
          ctx.rect(proj[i * 4] - s / 2, proj[i * 4 + 1] - s / 2, s, s)
        }
        ctx.fillStyle = `rgb(${base} / ${alpha})`
        ctx.fill()
      }

      // Points caught in the scan plane light up.
      for (const front of [false, true]) {
        ctx.beginPath()
        for (let i = 0; i < COUNT; i++) {
          const d = proj[i * 4 + 2]
          if (Math.abs(proj[i * 4 + 3] - scan) >= SCAN_BAND || d >= 0.5 !== front) continue
          const s = 1.2 + d * 1.6
          ctx.rect(proj[i * 4] - s / 2, proj[i * 4 + 1] - s / 2, s, s)
        }
        ctx.fillStyle = `rgb(${accent} / ${front ? 0.95 : 0.3})`
        ctx.fill()
      }

      // Scan plane: a hairline plus an elliptical halo.
      const lineY = cy - scan * scale
      const span = scale * 1.3
      const line = ctx.createLinearGradient(cx - span, 0, cx + span, 0)
      line.addColorStop(0, `rgb(${accent} / 0)`)
      line.addColorStop(0.5, `rgb(${accent} / 0.6)`)
      line.addColorStop(1, `rgb(${accent} / 0)`)
      ctx.fillStyle = line
      ctx.fillRect(cx - span, lineY - 0.5, span * 2, 1)
      ctx.save()
      ctx.translate(cx, lineY)
      ctx.scale(1, 0.08)
      const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, span)
      halo.addColorStop(0, `rgb(${accent} / 0.2)`)
      halo.addColorStop(1, `rgb(${accent} / 0)`)
      ctx.fillStyle = halo
      ctx.beginPath()
      ctx.arc(0, 0, span, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Landmark triangulation and crosshairs.
      const pulse = state.busy ? 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.008)) : 0.3
      ctx.beginPath()
      for (const [a, b] of LANDMARK_EDGES) {
        const ia = LANDMARKS[a]
        const ib = LANDMARKS[b]
        if (proj[ia * 4 + 2] < 0.55 || proj[ib * 4 + 2] < 0.55) continue
        ctx.moveTo(proj[ia * 4], proj[ia * 4 + 1])
        ctx.lineTo(proj[ib * 4], proj[ib * 4 + 1])
      }
      ctx.lineWidth = 0.8
      ctx.strokeStyle = `rgb(${accent} / ${pulse})`
      ctx.stroke()

      ctx.beginPath()
      for (const i of LANDMARKS) {
        if (proj[i * 4 + 2] < 0.55) continue
        const x = proj[i * 4]
        const y = proj[i * 4 + 1]
        ctx.moveTo(x - 6, y)
        ctx.lineTo(x - 2.5, y)
        ctx.moveTo(x + 2.5, y)
        ctx.lineTo(x + 6, y)
        ctx.moveTo(x, y - 6)
        ctx.lineTo(x, y - 2.5)
        ctx.moveTo(x, y + 2.5)
        ctx.lineTo(x, y + 6)
      }
      ctx.lineWidth = 1
      ctx.strokeStyle = `rgb(${accent} / 0.9)`
      ctx.stroke()
    }

    const loop = (t) => {
      draw(t)
      raf = requestAnimationFrame(loop)
    }
    const start = () => {
      if (!raf && !reduced) raf = requestAnimationFrame(loop)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    state.redraw = () => {
      if (reduced) draw(STATIC_TIME)
    }

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (reduced) draw(STATIC_TIME)
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)
    // Only animate while on screen.
    const visibility = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()))
    visibility.observe(canvas)
    // Re-read colours when the theme flips.
    const themeObserver = new MutationObserver(() => {
      state.dirty = true
      state.redraw?.()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

    return () => {
      stop()
      resizeObserver.disconnect()
      visibility.disconnect()
      themeObserver.disconnect()
      state.redraw = null
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
