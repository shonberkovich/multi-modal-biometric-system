/**
 * BioFusion mark: an optical iris with a rotating capture orbit and a
 * horizontal scan line through the pupil.
 */
export default function BrandMark({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className={className}>
      <circle cx="16" cy="16" r="14" stroke="currentColor" strokeOpacity="0.3" />
      <circle
        className="brand-orbit"
        cx="16"
        cy="16"
        r="10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 2.3"
      />
      <circle cx="16" cy="16" r="4.5" fill="currentColor" />
      <path d="M3 16h7M22 16h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
