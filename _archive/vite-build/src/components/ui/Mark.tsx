type MarkProps = {
  /** Rendered height in px. Stroke stays optically even across sizes. */
  size?: number
  className?: string
}

/**
 * The NORTHBOUND mark. Monoline, mitred, no fill — a main summit with a
 * subsidiary peak behind it, drawn as a single ridgeline.
 *
 * Hand-set geometry rather than a generated logo: an AI-drawn mark has a look,
 * and that look is the fastest way for a visitor to decide a brand is not real.
 * Decorative only — every lockup pairs it with the wordmark, so it carries no
 * accessible name of its own.
 */
export default function Mark({ size = 22, className }: MarkProps) {
  return (
    <svg
      width={(size * 32) / 22}
      height={size}
      viewBox="0 0 32 22"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M1 21 10.6 3.2 16.4 14 20.4 6.6 31 21Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="miter"
      />
      <path d="M10.6 3.2 13.6 21" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
