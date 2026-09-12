import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../lib/motion";
import Wordmark from "./Wordmark";

/** First frames: the wordmark draws itself on black, then the curtain lifts. */
export default function Preloader({ onDone }: { onDone: () => void }) {
  /* read once: this used to be recomputed on every render, and since the
     effect writes the flag immediately, the very next render decided the
     intro had already been seen and cut it short */
  const [quick] = useState(() => {
    try {
      return sessionStorage.getItem("aromio_intro") === "1" || prefersReducedMotion();
    } catch {
      return prefersReducedMotion();
    }
  });
  const [progress, setProgress] = useState(quick ? 100 : 0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    try { sessionStorage.setItem("aromio_intro", "1"); } catch { /* ignore */ }

    if (quick) {
      const t = setTimeout(() => { setDone(true); onDone(); }, 380);
      return () => clearTimeout(t);
    }

    /* ровно две секунды: полоса идёт по реальному времени, а не шагами */
    const INTRO = 2000;
    const started = performance.now();

    const tick = () => {
      const k = Math.min(1, (performance.now() - started) / INTRO);
      setProgress(k * 100);
      if (k < 1) raf = requestAnimationFrame(tick);
      else { setDone(true); onDone(); }
    };

    let raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [quick, onDone]);

  return (
    <div className={"preloader" + (done ? " is-done" : "") + (quick ? " quick" : "")}>
      <div className="pre-inner">
        <Wordmark className="pre-mark" />
        <div className="pre-claim">ДУХИ И ПРОБНИКИ ПАРФЮМЕРНЫХ ДОМОВ</div>
        <div className="pre-bar"><div className="pre-fill" style={{ width: progress + "%" }} /></div>
      </div>
    </div>
  );
}
