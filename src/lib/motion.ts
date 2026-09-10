import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Inertial scrolling, driven from GSAP's ticker so Lenis and ScrollTrigger
 * share one rAF loop instead of fighting over two.
 */
export function useSmoothScroll(): void {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 0.9,
      touchMultiplier: 1.6
    });

    lenis.on("scroll", ScrollTrigger.update);
    /* programmatic jumps (anchors, restored scroll) bypass Lenis */
    addEventListener("scroll", ScrollTrigger.update, { passive: true });

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    /* fonts and images settle after mount — re-measure once they do */
    const refresh = () => ScrollTrigger.refresh();
    const settle = setTimeout(refresh, 600);
    addEventListener("load", refresh);

    return () => {
      clearTimeout(settle);
      removeEventListener("load", refresh);
      removeEventListener("scroll", ScrollTrigger.update);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
}

/** Scoped GSAP context: everything created inside is reverted on unmount. */
export function useGsap(
  setup: (ctx: gsap.Context) => void,
  deps: React.DependencyList = []
): React.RefObject<HTMLDivElement | null> {
  const scope = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(setup, scope);
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}

/** Fade + rise, the house reveal. Runs once per element. */
export function revealFrom(
  targets: gsap.TweenTarget,
  opts: { y?: number; stagger?: number; start?: string; delay?: number } = {}
): gsap.core.Tween | undefined {
  if (prefersReducedMotion()) return;
  const { y = 34, stagger = 0.08, start = "top 88%", delay = 0 } = opts;

  return gsap.fromTo(targets,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration: 1,
      delay,
      ease: "expo.out",
      stagger,
      /* never render the hidden state until the trigger actually fires,
         so a missed trigger leaves the content readable rather than blank */
      immediateRender: false,
      scrollTrigger: { trigger: targets as gsap.DOMTarget, start, once: true }
    }
  );
}

/** Masked-line intro used for headlines. */
export function revealLines(
  lines: gsap.TweenTarget,
  opts: { delay?: number; scrollTrigger?: ScrollTrigger.Vars } = {}
): gsap.core.Tween | undefined {
  if (prefersReducedMotion()) return;

  return gsap.fromTo(lines,
    { yPercent: 110 },
    {
    yPercent: 0,
    duration: 1.15,
    ease: "expo.out",
    stagger: 0.08,
    delay: opts.delay ?? 0,
    ...(opts.scrollTrigger ? { scrollTrigger: opts.scrollTrigger, immediateRender: false } : {})
    }
  );
}

/**
 * Scroll-linked drift. Unlike a reveal this is scrubbed: the element's
 * position is a function of where the section sits in the viewport, which
 * is what gives an Apple product page its "the page moves with you" feel.
 */
export function parallax(
  targets: gsap.TweenTarget,
  opts: { y?: number; scale?: number; trigger?: gsap.DOMTarget; scrub?: number } = {}
): gsap.core.Tween | undefined {
  if (prefersReducedMotion()) return;
  const { y = -70, scale, trigger, scrub = 0.6 } = opts;

  return gsap.fromTo(targets,
    { y: -y * 0.35, ...(scale ? { scale: 1 } : {}) },
    {
      y,
      ...(scale ? { scale } : {}),
      ease: "none",
      immediateRender: false,
      scrollTrigger: {
        trigger: (trigger ?? targets) as gsap.DOMTarget,
        start: "top bottom",
        end: "bottom top",
        scrub
      }
    }
  );
}

export { gsap, ScrollTrigger };
