import { useEffect, useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger, SplitText);

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

/* ============================================================
   ПЕРЕХОДЫ ИНТЕРФЕЙСА
   Один набор токенов на весь магазин: вход длиннее выхода, выход —
   примерно 62% от входа, микро-состояния (ховер, нажатие) ещё короче.
   При prefers-reduced-motion длительности схлопываются в ноль: движение
   пропадает, поведение остаётся прежним.
   ============================================================ */

export const EASE_OUT = "cubic-bezier(.16,1,.3,1)";
export const EASE_IN = "cubic-bezier(.5,0,.75,0)";

/** 0 when the visitor asked for less motion, 1 otherwise */
export const motionScale = (): number => (prefersReducedMotion() ? 0 : 1);

export const ENTER = 420;
export const EXIT = 260;
export const MICRO = 180;
export const STEP = 35;

/** durations, already scaled — call at the moment of the animation */
export const dur = (ms: number): number => Math.max(1, ms * motionScale());

/**
 * Web Animations with the house easing. Returns null when the element is
 * missing so callers can chain without null checks.
 */
export function animate(
  el: Element | null | undefined,
  frames: Keyframe[],
  ms: number,
  opts: KeyframeAnimationOptions = {}
): Animation | null {
  if (!el || prefersReducedMotion()) return null;
  return el.animate(frames, { duration: dur(ms), easing: EASE_OUT, ...opts });
}

/* ---------- FLIP ---------- */

export type FlipRects = Map<string, DOMRect>;

/** Measure every child carrying data-flip-id. */
export function measureFlip(root: HTMLElement | null): FlipRects {
  const map: FlipRects = new Map();
  if (!root) return map;
  root.querySelectorAll<HTMLElement>("[data-flip-id]").forEach(el => {
    map.set(el.dataset.flipId!, el.getBoundingClientRect());
  });
  return map;
}

/**
 * Play the inverted transform. Children that were on screen before travel
 * from their old box to the new one; children that are new rise into place
 * one after another, so a filter change reads as the list rearranging
 * itself rather than as a repaint.
 */
export function playFlip(root: HTMLElement | null, before: FlipRects): void {
  if (!root || prefersReducedMotion() || !before.size) return;

  let fresh = 0;
  root.querySelectorAll<HTMLElement>("[data-flip-id]").forEach(el => {
    const now = el.getBoundingClientRect();
    const was = before.get(el.dataset.flipId!);

    if (was) {
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (!dx && !dy) return;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
        { duration: dur(ENTER), easing: EASE_OUT }
      );
    } else {
      el.animate(
        [{ opacity: 0, transform: "translateY(14px) scale(.96)" }, { opacity: 1, transform: "none" }],
        { duration: dur(ENTER), easing: EASE_OUT, delay: dur(STEP) * fresh++, fill: "backwards" }
      );
    }
  });
}

/**
 * Measure on every commit, replay on the ones the caller marks. The rects
 * kept in the ref are from the previous commit — the "before" of FLIP.
 */
export function useFlip(
  ref: React.RefObject<HTMLElement | null>,
  deps: React.DependencyList
): void {
  const prev = useRef<FlipRects>(new Map());
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) { first.current = false; prev.current = measureFlip(ref.current); return; }
    playFlip(ref.current, prev.current);
    prev.current = measureFlip(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useLayoutEffect(() => { prev.current = measureFlip(ref.current); });
}

/* ---------- общий элемент: плашка карточки → плашка страницы ---------- */

let sharedOrigin: HTMLElement | null = null;

/** Remember which plate the visitor clicked, so the page can grow out of it. */
export const setSharedOrigin = (el: HTMLElement | null): void => { sharedOrigin = el; };
export const getSharedOrigin = (): HTMLElement | null =>
  sharedOrigin && sharedOrigin.isConnected ? sharedOrigin : null;

/** Grow `to` out of the remembered card plate. */
export function sharedIn(to: HTMLElement | null): void {
  const from = getSharedOrigin();
  if (!to || !from || prefersReducedMotion()) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (!b.width || !b.height) return;
  to.animate([
    {
      transform:
        `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`,
      transformOrigin: "top left",
      borderRadius: "18px"
    },
    { transform: "none", transformOrigin: "top left", borderRadius: getComputedStyle(to).borderRadius }
  ], { duration: dur(ENTER), easing: EASE_OUT });
}

/** Shrink `from` back into the card plate; resolves when it lands. */
export function sharedOut(from: HTMLElement | null): Promise<void> {
  const to = getSharedOrigin();
  if (!from || !to || prefersReducedMotion()) return Promise.resolve();
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  if (!a.width || !b.width) return Promise.resolve();
  const anim = from.animate([
    { transform: "none", transformOrigin: "top left" },
    {
      transform:
        `translate(${b.left - a.left}px, ${b.top - a.top}px) scale(${b.width / a.width}, ${b.height / a.height})`,
      transformOrigin: "top left",
      opacity: 0.85
    }
  ], { duration: dur(EXIT), easing: EASE_OUT });
  return anim.finished.then(() => undefined, () => undefined);
}

/* ---------- карточка товара въезжает сбоку ---------- */

/**
 * Страница товара приходит с правого края: ширина от нуля до полной, а
 * содержимое внутри едет следом, но короче — из-за этого движение читается
 * как «панель выехала», а не «страница мигнула».
 */
export function slideIn(panel: HTMLElement | null, inner: HTMLElement | null): void {
  if (!panel || prefersReducedMotion()) return;
  panel.animate(
    [{ transform: "translateX(100%)" }, { transform: "none" }],
    { duration: dur(ENTER), easing: EASE_OUT }
  );
  if (inner) {
    inner.animate(
      [{ opacity: 0, transform: "translateX(64px)" }, { opacity: 1, transform: "none" }],
      { duration: dur(ENTER), easing: EASE_OUT, delay: dur(70), fill: "backwards" }
    );
  }
}

/** Тот же путь назад, короче — выход всегда быстрее входа. */
export function slideOut(panel: HTMLElement | null): Promise<void> {
  if (!panel || prefersReducedMotion()) return Promise.resolve();
  const anim = panel.animate(
    [{ transform: "none" }, { transform: "translateX(100%)" }],
    { duration: dur(EXIT), easing: EASE_IN }
  );
  return anim.finished.then(() => undefined, () => undefined);
}

/* ---------- полёт в корзину ---------- */

/**
 * An arc, not a straight line: the dot lifts before it lands, which is what
 * makes the eye follow it to the counter. The counter itself pops once the
 * dot arrives, so the number never changes without being pointed at.
 */
export function flyToCart(source: Element | null): void {
  if (!source || prefersReducedMotion()) return;
  /* the header button on desktop, the home row on phones — whichever is
     actually on screen, since the other one is hidden by CSS, not markup */
  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-anchor]")]
    .find(el => el.getBoundingClientRect().width > 0 && el.offsetParent !== null);
  if (!target) return;

  const a = source.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const dot = document.createElement("span");
  dot.className = "fly-dot";
  dot.style.left = `${a.left + a.width / 2 - 7}px`;
  dot.style.top = `${a.top + a.height / 2 - 7}px`;
  document.body.appendChild(dot);

  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);

  dot.animate([
    { transform: "translate(0,0) scale(1)", opacity: 1 },
    { transform: `translate(${dx * 0.55}px, ${dy - 90}px) scale(1.25)`, opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(.35)`, opacity: 0.7 }
  ], { duration: dur(620), easing: "cubic-bezier(.4,0,.2,1)" })
    .finished.then(() => {
      dot.remove();
      document.querySelectorAll<HTMLElement>("[data-cart-count]").forEach(el => {
        el.animate(
          [{ transform: "scale(1)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }],
          { duration: dur(340), easing: EASE_OUT }
        );
      });
    }, () => dot.remove());
}

/* ============================================================
   СЦЕНЫ НА СКРОЛЛЕ
   Страница перестаёт быть лентой и становится последовательностью
   сцен: секция прикалывается, а внутри неё идёт таймлайн, привязанный
   к прокрутке. На телефоне прикалывание выключено — там это дорого и
   мешает, вместо него обычное появление.
   ============================================================ */

/** SplitText по строкам с маской — заголовок выезжает снизу построчно */
export function splitReveal(
  target: string | Element,
  opts: { trigger?: gsap.DOMTarget; start?: string; stagger?: number; delay?: number } = {}
): void {
  if (prefersReducedMotion()) return;
  const el = typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  const split = new SplitText(el, { type: "lines", linesClass: "sp-line" });
  /* каждая строка в своей маске: иначе текст выезжает поверх соседних */
  split.lines.forEach(line => {
    const mask = document.createElement("span");
    mask.className = "sp-mask";
    line.parentNode?.insertBefore(mask, line);
    mask.appendChild(line);
  });

  gsap.from(split.lines, {
    yPercent: 118,
    duration: 1.05,
    ease: "expo.out",
    stagger: opts.stagger ?? 0.09,
    delay: opts.delay ?? 0,
    immediateRender: false,
    scrollTrigger: {
      trigger: (opts.trigger ?? el) as gsap.DOMTarget,
      start: opts.start ?? "top 82%",
      once: true
    }
  });
}

/**
 * Прикалывает секцию и возвращает таймлайн, привязанный к прокрутке.
 * `length` — сколько пикселей прокрутки занимает сцена.
 */
export function pinnedScene(
  section: Element,
  length: number | (() => number),
  opts: { scrub?: number } = {}
): gsap.core.Timeline | null {
  if (prefersReducedMotion()) return null;
  return gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + (typeof length === "function" ? length() : length),
      pin: true,
      pinSpacing: true,
      scrub: opts.scrub ?? 0.8,
      anticipatePin: 1
    }
  });
}

export { SplitText };

/* ══════════════════════════════════════════════════════════════════════
   ШВЕЙЦАРСКИЙ MOTION

   У движения на этой витрине одна подпись: cubic-bezier(.16,1,.3,1) —
   резкий старт, долгое затухание. Всё, что появляется, появляется этой
   кривой; всё, что уходит, уходит вдвое быстрее. Больше кривых не
   заводим: разнобой в easing читается как разнобой в почерке.
   ══════════════════════════════════════════════════════════════════ */

/**
 * Линейка вычерчивается слева направо, когда до неё доскроллили.
 *
 * В швейцарской школе структуру держит линия, поэтому именно линия и
 * должна появляться первой — как будто её проводят по листу. Рисуем
 * через scaleX, а не через width: ширина считается раскладкой на каждом
 * кадре, transform — нет.
 */
export function drawRules(
  scope: string,
  opts: { trigger?: string; stagger?: number } = {}
): void {
  if (prefersReducedMotion()) return;

  const rules = gsap.utils.toArray<HTMLElement>(scope);
  if (!rules.length) return;

  gsap.set(rules, { transformOrigin: "left center", scaleX: 0 });
  gsap.to(rules, {
    scaleX: 1,
    duration: 0.8,
    ease: "power3.out",
    stagger: opts.stagger ?? 0.06,
    scrollTrigger: {
      trigger: opts.trigger ?? rules[0],
      start: "top 88%",
      once: true
    }
  });
}

/**
 * Число досчитывается до своего значения.
 *
 * Работает только там, где значение — действительно число: «51 аромат»
 * досчитается, «30–200 мл» останется как есть. Считать диапазон было бы
 * враньём в виде анимации.
 */
export function countUp(scope: string): void {
  if (prefersReducedMotion()) return;

  for (const el of gsap.utils.toArray<HTMLElement>(scope)) {
    const raw = (el.textContent ?? "").trim();
    /* берём только чистое число, возможно с неразрывными пробелами */
    const clean = raw.replace(/[\s ]/g, "");
    if (!/^\d+$/.test(clean)) continue;

    const to = Number(clean);
    if (!Number.isFinite(to) || to <= 0) continue;

    const box = { v: 0 };
    gsap.to(box, {
      v: to,
      duration: 1.1,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onUpdate: () => { el.textContent = String(Math.round(box.v)); },
      onComplete: () => { el.textContent = raw; }
    });
  }
}

/**
 * Ячейки сетки поднимаются снизу лесенкой — не все разом и не по одной,
 * а рядами: глаз читает витрину строками, и появляться она должна так же.
 */
export function revealGrid(scope: string, perRow = 4): void {
  if (prefersReducedMotion()) return;

  const cells = gsap.utils.toArray<HTMLElement>(scope);
  if (!cells.length) return;

  gsap.set(cells, { opacity: 0, y: 18 });
  gsap.to(cells, {
    opacity: 1,
    y: 0,
    duration: 0.7,
    ease: "power3.out",
    stagger: { each: 0.045, from: "start", grid: [Math.ceil(cells.length / perRow), perRow] },
    scrollTrigger: { trigger: cells[0], start: "top 92%", once: true }
  });
}

/**
 * Фолио переезжает с плитки на страницу аромата.
 *
 * Это подпись всей витрины: номер не исчезает и не появляется заново, а
 * physически переходит из сетки в поле страницы. Считаем обе рамки и
 * проигрываем разницу — FLIP, то есть один transform вместо анимации
 * раскладки. Кегль меняем через scale, а не через font-size: размер
 * шрифта пересчитывает раскладку на каждом кадре, transform — нет.
 */
export function flyFolio(fromEl: HTMLElement | null, toEl: HTMLElement | null): void {
  if (!fromEl || !toEl || prefersReducedMotion()) return;

  const a = fromEl.getBoundingClientRect();
  const b = toEl.getBoundingClientRect();
  if (!a.width || !b.width) return;

  const scale = a.height / b.height;
  const dx = a.left - b.left;
  const dy = a.top - b.top;

  toEl.animate(
    [
      { transform: `translate(${dx}px, ${dy}px) scale(${scale})`, opacity: 0.55 },
      { transform: "none", opacity: 1 }
    ],
    { duration: dur(560), easing: EASE_OUT, fill: "backwards" }
  );
}

/** запоминаем, с какой плитки открыли — чтобы было откуда лететь */
let folioOrigin: HTMLElement | null = null;

export const setFolioOrigin = (el: HTMLElement | null): void => { folioOrigin = el; };
export const takeFolioOrigin = (): HTMLElement | null => {
  const el = folioOrigin;
  folioOrigin = null;
  return el;
};
