import { useEffect, useRef } from "react";

/**
 * A still wireframe surface: a square mesh displaced by a height field,
 * drawn once and redrawn only when the window changes size.
 *
 * Canvas rather than SVG: a hundred polylines cost a layout pass each in
 * the DOM. The field is sampled in normalised space and mapped to pixels
 * only at the end, so the drawing survives a resize without re-deriving
 * anything.
 */

/* a phone neither needs nor wants 64 columns of mesh */
const COLS = typeof innerWidth !== "undefined" && innerWidth < 720 ? 38 : 64;
/** rows follow the viewport's aspect so the cells stay square */
const MAX_ROWS = 96;
/** the mesh is drawn wider than the viewport so the folds never show an edge */
const BLEED = 0.16;

/**
 * A height field, not a scribble. The surface is a plane at h(u, v); the
 * mesh lines bunch wherever the height turns the plane away from the
 * viewer, and that bunching — not the lines themselves — is what makes
 * the picture read as cloth catching light.
 */
function height(u: number, v: number, t: number): number {
  /* the frequency in v is the important number: rows crowd where the
     height changes as fast as the rows themselves advance, and that is
     what draws the bright creases */
  return Math.sin(v * 7.8 + u * 4.4 + t * 0.30) * 0.098
       + Math.sin(v * 5.0 - u * 3.4 - t * 0.22) * 0.058
       + Math.sin(v * 12.6 + u * 1.9 + t * 0.16) * 0.018;
}

/**
 * The same idea across the frame: where this field's slope approaches -1
 * the columns crowd, which is what turns the creases from flat bands into
 * something that looks folded.
 */
const drift = (u: number, v: number, t: number): number =>
  Math.sin(u * 6.2 + v * 2.1 - t * 0.23) * 0.072
  + Math.sin(u * 3.0 - v * 2.7 + t * 0.17) * 0.030
  + Math.sin(v * 2.6 + t * 0.21) * 0.018;

/**
 * The frozen phase of the field. The mesh is drawn once and left alone —
 * a still backdrop, so nothing behind the type moves.
 */
const PHASE = 0;

/**
 * Perspective: rows crowd towards the top of the frame the way a plane
 * recedes. A plain power curve is enough for a backdrop, and it is what
 * gives the picture its depth.
 */
const depth = (v: number): number => Math.pow(v, 1.12);

export default function Backdrop() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = canvas.current;
    if (!cv) return;
    const ctx = cv.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0, h = 0, rows = 40;

    const size = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight;
      rows = Math.max(20, Math.min(MAX_ROWS, Math.round(COLS * (h / w))));
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    /* the warped points, computed once a frame and walked twice */
    const xs = new Float32Array((COLS + 1) * (MAX_ROWS + 1));
    const ys = new Float32Array((COLS + 1) * (MAX_ROWS + 1));

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      /* one neutral grey, as thin as the display allows: the mesh is light
         on black and nothing else */
      ctx.strokeStyle = "rgba(216,216,220,.30)";
      ctx.lineWidth = Math.min(devicePixelRatio || 1, 2) > 1 ? 0.75 : 1;
      ctx.lineJoin = "round";

      const sx = (1 + BLEED * 2) * w, ox = -BLEED * w;
      const syy = (1 + BLEED * 2) * h, oy = -BLEED * h;

      for (let r = 0; r <= rows; r++) {
        const rowBase = r * (COLS + 1);
        /* the row's depth is taken before the warp, so the folds ride on
           top of the perspective instead of fighting it */
        const vRaw = r / rows;
        const v0 = depth(vRaw);
        for (let c = 0; c <= COLS; c++) {
          const u = c / COLS;
          xs[rowBase + c] = (u + drift(u, v0, PHASE)) * sx + ox;
          ys[rowBase + c] = (v0 + height(u, v0, PHASE)) * syy + oy;
        }
      }

      ctx.beginPath();
      for (let r = 0; r <= rows; r++) {
        const rowBase = r * (COLS + 1);
        ctx.moveTo(xs[rowBase], ys[rowBase]);
        for (let c = 1; c <= COLS; c++) ctx.lineTo(xs[rowBase + c], ys[rowBase + c]);
      }
      for (let c = 0; c <= COLS; c++) {
        ctx.moveTo(xs[c], ys[c]);
        for (let r = 1; r <= rows; r++) ctx.lineTo(xs[r * (COLS + 1) + c], ys[r * (COLS + 1) + c]);
      }
      ctx.stroke();
    };

    size();
    draw();

    /* the only reason to redraw is a new canvas size */
    const onResize = () => { size(); draw(); };
    addEventListener("resize", onResize);


    return () => removeEventListener("resize", onResize);
  }, []);

  return (
    <div className="backdrop" aria-hidden>
      <div className="bd-aurora" />
      <canvas ref={canvas} className="bd-mesh" />
      <div className="bd-veil" />
      <div className="bd-grain" />
    </div>
  );
}
