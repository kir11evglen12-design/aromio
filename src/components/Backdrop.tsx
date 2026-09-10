import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/motion";

/**
 * A square mesh pushed around by a few layered sine fields — the same
 * "warped graph paper" as a wireframe render, but drawn live so the folds
 * travel instead of sitting still.
 *
 * Canvas rather than SVG: 96 polylines redrawn per frame stay cheap here
 * and cost a layout pass each in the DOM. The field is sampled in
 * normalised space and only mapped to pixels at the end, so the drawing
 * survives a resize without re-deriving anything.
 */

const COLS = 44;
const ROWS = 44;
/** the mesh is drawn wider than the viewport so the folds never show an edge */
const BLEED = 0.16;

/** layered sine displacement — cheap, seamless, and directional */
function warp(u: number, v: number, t: number): [number, number] {
  const a = Math.sin(v * 5.6 + t * 0.42) * 0.125
          + Math.sin(u * 3.1 + v * 2.4 - t * 0.31) * 0.085
          + Math.sin(v * 11.3 - u * 1.7 + t * 0.23) * 0.028;
  const b = Math.sin(u * 4.9 - t * 0.37) * 0.115
          + Math.sin(v * 3.7 + u * 2.2 + t * 0.26) * 0.075
          + Math.sin(u * 9.8 + v * 2.9 - t * 0.19) * 0.024;
  /* two travelling swirls pull the grid into the tight pinches and folds
     that make a warped-mesh render read as a surface rather than a grid */
  const dx = u - 0.5, dy = v - 0.5;
  const r = Math.hypot(dx, dy) + 0.001;
  const swirl = Math.sin(r * 7.2 - t * 0.3) * 0.085 * (1 - r);
  const fx = u - (0.5 + Math.sin(t * 0.21) * 0.28);
  const fy = v - (0.5 + Math.cos(t * 0.17) * 0.24);
  const fr = fx * fx + fy * fy;
  const fold = Math.exp(-fr * 9) * 0.075;
  return [u + a + (-dy / r) * swirl + fx * fold, v + b + (dx / r) * swirl + fy * fold];
}

export default function Backdrop() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    const still = prefersReducedMotion();
    let w = 0, h = 0, raf = 0, t = 0, last = 0, sy = 0;

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      /* the stroke follows the theme, so read it back rather than hard-code */
      const line = getComputedStyle(cv).getPropertyValue("--mesh").trim() || "rgba(14,14,14,.16)";
      ctx.strokeStyle = line;
      ctx.lineWidth = 1;
      ctx.lineJoin = "round";

      const px = (u: number) => (u * (1 + BLEED * 2) - BLEED) * w;
      const py = (v: number) => (v * (1 + BLEED * 2) - BLEED) * h;

      /* the field is sampled a little further down the page as you scroll,
         so the mesh parallaxes behind the content instead of sitting still */
      const off = sy * 0.00016;

      ctx.beginPath();
      for (let r = 0; r <= ROWS; r++) {
        for (let c = 0; c <= COLS; c++) {
          const [u, v] = warp(c / COLS, r / ROWS + off, t);
          const x = px(u), y = py(v);
          c === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      }
      for (let c = 0; c <= COLS; c++) {
        for (let r = 0; r <= ROWS; r++) {
          const [u, v] = warp(c / COLS, r / ROWS + off, t);
          const x = px(u), y = py(v);
          r === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      /* 40fps is plenty for a field this slow and leaves the main thread free */
      if (now - last < 25) return;
      last = now;
      t += 0.012;
      sy = scrollY;
      draw();
    };

    size();
    draw();
    if (!still) raf = requestAnimationFrame(loop);

    const onResize = () => { size(); draw(); };
    addEventListener("resize", onResize);

    /* reading scrollY here keeps the draw loop free of layout queries */
    const onScroll = () => { sy = scrollY; if (still) draw(); };
    addEventListener("scroll", onScroll, { passive: true });

    /* a backgrounded tab should not animate */
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !still) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", onResize);
      removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="backdrop" aria-hidden>
      <canvas ref={canvas} className="bd-mesh" />
      <div className="bd-veil" />
    </div>
  );
}
