// Icon mark from the provided logo.svg (the "Retail POS" price-tag badge).
// Rendered inline (not <img>) so `fill="var(--accent)"` tracks the current
// theme automatically - orange in light mode, the monochrome grey in dark
// mode - instead of the logo's original hardcoded green.
export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 72 72" role="img" aria-label="Retail POS logo">
      <rect x="4" y="4" width="64" height="64" rx="16" fill="var(--accent)" />
      <g fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M36 24a5 5 0 1 1 5 5c-3 0-5 1.6-5 4.4" />
        <path d="M36 33.4 18 46.6a2 2 0 0 0 1.2 3.6h33.6a2 2 0 0 0 1.2-3.6L36 33.4Z" />
      </g>
    </svg>
  );
}
