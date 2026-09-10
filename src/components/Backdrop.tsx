/**
 * The page's ground: a black-and-white check that drifts slowly under the
 * content, with a band of wavy lines floating across it. Both layers are
 * fixed, unpainted by the browser as soon as an opaque section covers them,
 * and hidden entirely when the visitor asks for reduced motion.
 */
export default function Backdrop() {
  return (
    <div className="backdrop" aria-hidden>
      <div className="bd-check" />
      <svg className="bd-waves" viewBox="0 0 1200 600" preserveAspectRatio="none">
        {Array.from({ length: 9 }, (_, i) => (
          <path
            key={i}
            d={`M-200 ${90 + i * 52} C 40 ${40 + i * 52}, 160 ${140 + i * 52}, 400 ${90 + i * 52}
                S 760 ${40 + i * 52}, 1000 ${90 + i * 52} S 1360 ${140 + i * 52}, 1600 ${90 + i * 52}`}
            style={{ ["--i" as string]: i }}
          />
        ))}
      </svg>
    </div>
  );
}
