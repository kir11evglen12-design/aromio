import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";

const WORD = [..."AROMIO"];

/** First frames: letters rise, a counter fills, then the curtain lifts. */
export default function Preloader({ onDone }: { onDone: () => void }) {
  const seen = (() => {
    try { return sessionStorage.getItem("aromio_intro") === "1"; } catch { return false; }
  })();

  const quick = seen || prefersReducedMotion();
  const [progress, setProgress] = useState(quick ? 100 : 0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try { sessionStorage.setItem("aromio_intro", "1"); } catch { /* ignore */ }

    if (quick) {
      const t = setTimeout(() => { setDone(true); onDone(); }, 380);
      return () => clearTimeout(t);
    }

    const iv = setInterval(() => {
      setProgress(p => {
        const next = Math.min(100, p + 6 + Math.random() * 10);
        if (next >= 100) {
          clearInterval(iv);
          setTimeout(() => { setDone(true); onDone(); }, 520);
        }
        return next;
      });
    }, 150);

    return () => clearInterval(iv);
  }, [quick, onDone]);

  return (
    <div className={"preloader" + (done ? " is-done" : "") + (quick ? " quick" : "")}>
      <div className="pre-inner">
        <div className="pre-eyebrow">Нишевая парфюмерия — Eau de Parfum</div>
        <div className="pre-word" aria-label="AROMIO">
          {WORD.map((ch, i) => (
            <span key={i} style={{ animationDelay: `${0.18 + i * 0.075}s` }}>{ch}</span>
          ))}
        </div>
        <div className="pre-meta">
          <span>Открываем коллекцию</span>
          <span className="pre-count">{Math.round(progress)}</span>
        </div>
        <div className="pre-bar"><div className="pre-fill" style={{ width: progress + "%" }} /></div>
      </div>
    </div>
  );
}
