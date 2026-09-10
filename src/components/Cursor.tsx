import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/motion";

/**
 * Trailing ring and dot. The ring lags the pointer; both are drawn in
 * difference blend mode, so they invert themselves over a light button
 * instead of needing to be told which surface they are on.
 */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    const root = document.documentElement;
    root.classList.add("has-cursor");

    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    let raf = 0, moved = false, hitAt = 0;

    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (!moved) { moved = true; rx = mx; ry = my; root.classList.add("cursor-on"); }
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);

      rx += (mx - rx) * 0.17;
      ry += (my - ry) * 0.17;
      if (ring.current) ring.current.style.transform = `translate3d(${rx.toFixed(2)}px,${ry.toFixed(2)}px,0) translate(-50%,-50%)`;
      if (dot.current) dot.current.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;

      /* hit-testing forces layout, so it runs at ~12fps rather than per move */
      if (now - hitAt > 80) {
        hitAt = now;
        const el = document.elementFromPoint(mx, my);
        ring.current?.classList.toggle("is-active",
          !!el?.closest("button, a, .card, .split-panel, .line-item, .p-tile"));
        /* a caret belongs to the field, not to us */
        root.classList.toggle("cursor-text", !!el?.closest("input, textarea"));
      }
    };

    /* leaving the window or losing focus should take the ring with it */
    const hide = () => root.classList.remove("cursor-on");
    const show = () => { if (moved) root.classList.add("cursor-on"); };

    addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseleave", hide);
    document.addEventListener("mouseenter", show);
    addEventListener("blur", hide);
    raf = requestAnimationFrame(loop);

    return () => {
      removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", hide);
      document.removeEventListener("mouseenter", show);
      removeEventListener("blur", hide);
      cancelAnimationFrame(raf);
      root.classList.remove("has-cursor", "cursor-on", "cursor-text");
    };
  }, []);

  return (
    <>
      <div className="cursor" ref={ring} aria-hidden />
      <div className="cursor-dot" ref={dot} aria-hidden />
    </>
  );
}
