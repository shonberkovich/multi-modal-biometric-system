import Reveal from './Reveal'

/**
 * Oversized editorial page header with a module code and a ghost numeral that
 * bleeds behind the title.
 */
export default function PageHeader({ index, eyebrow, title, description, children }) {
  return (
    <Reveal as="header" className="relative isolate">
      <span aria-hidden="true" className="ghost-numeral">
        {index}
      </span>

      <div className="flex items-center gap-3">
        <span className="code-tag">Mod·{index}</span>
        <span className="hud-label">{eyebrow}</span>
        <span className="hud-rule" />
      </div>

      <h1 className="display-title mt-6 sm:mt-8">{title}</h1>

      <div className="mt-5 flex flex-col gap-6 sm:mt-6 md:flex-row md:items-end md:justify-between">
        <p className="max-w-xl text-[15px] leading-relaxed text-ink-2 sm:text-base">{description}</p>
        {children}
      </div>
    </Reveal>
  )
}
