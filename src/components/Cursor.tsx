import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "../lib/motion";

/** Trailing ring + dot, inverted over dark sections. */
export default function Cursor() {
  const ring = useRef<HTMLDivElement>(null);
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion() || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    document.documentElement.classList.add("has-cursor");
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my, raf = 0;

    const move = (e: MouseEvent) => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) dot.current.style.transform = `translate3d(${mx}px,${my}px,0) translate(-50%,-50%)`;

      const el = document.elementFromPoint(mx, my);
      const dark = !!el?.closest(".section--dark, .footer, .split-panel--dark, .ticker--dark, .picker, .preloader");
      const hot = !!el?.closest("button, a, .card, .split-panel, input");
      ring.current?.classList.toggle("on-dark", dark);
      dot.current?.classList.toggle("on-dark", dark);
      ring.current?.classList.toggle("is-active", hot);
    };

    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      if (ring.current) ring.current.style.transform = `translate3d(${rx.toFixed(2)}px,${ry.toFixed(2)}px,0) translate(-50%,-50%)`;
      raf = requestAnimationFrame(loop);
    };

    addEventListener("mousemove", move, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <>
      <div className="cursor" ref={ring} aria-hidden />
      <div className="cursor-dot" ref={dot} aria-hidden />
    </>
  );
}
