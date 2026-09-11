/**
 * The house wordmark, drawn rather than typeset: heavy geometric lowercase
 * with rounded terminals. Vector strokes instead of a webfont, so it looks
 * the same on a phone with a cold cache as it does here.
 */
export default function Wordmark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 600 170" role="img" aria-label="aromio"
         fill="none" stroke="currentColor" strokeWidth="34"
         strokeLinecap="round" strokeLinejoin="round">
      {/* a */}
      <circle cx="52" cy="103" r="35" />
      <path d="M87 68 V138" />
      {/* r */}
      <path d="M140 138 V68" />
      <path d="M140 92 a35 35 0 0 1 35 -24" />
      {/* o */}
      <circle cx="235" cy="103" r="35" />
      {/* m */}
      <path d="M300 138 V68" />
      <path d="M300 92 a30 30 0 0 1 60 0 V138" />
      <path d="M360 92 a30 30 0 0 1 60 0 V138" />
      {/* i */}
      <path d="M455 138 V68" />
      <circle cx="455" cy="26" r="9" fill="currentColor" stroke="none" strokeWidth="0" />
      {/* o */}
      <circle cx="530" cy="103" r="35" />
    </svg>
  );
}
