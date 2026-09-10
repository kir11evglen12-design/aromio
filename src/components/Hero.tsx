import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { byId } from "../data/products";
import { gsap, prefersReducedMotion, revealLines, useGsap } from "../lib/motion";
import Bottle from "./Bottle";
import { scrollToId } from "./Header";

/** Drifting motes, drawn only while the hero is on screen. */
function useParticles(host: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const stage = host.current;
    if (!stage || prefersReducedMotion()) return;

    const cv = document.createElement("canvas");
    cv.className = "hero-particles";
    stage.appendChild(cv);
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(devicePixelRatio || 1, 2);

    let w = 0, h = 0, raf = 0, live = false;
    let motes: { x: number; y: number; r: number; v: number; drift: number; a: number; phase: number }[] = [];

    const size = () => {
      const r = stage.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      cv.style.width = w + "px"; cv.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      motes = Array.from({ length: 26 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.7 + Math.random() * 1.9, v: 0.12 + Math.random() * 0.34,
        drift: (Math.random() - 0.5) * 0.22, a: 0.12 + Math.random() * 0.4,
        phase: Math.random() * Math.PI * 2
      }));
    };

    const frame = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.y -= m.v;
        m.x += m.drift + Math.sin(t / 1400 + m.phase) * 0.16;
        if (m.y < -6) { m.y = h + 6; m.x = Math.random() * w; }
        const twinkle = 0.65 + Math.sin(t / 900 + m.phase) * 0.35;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(164,140,108,${(m.a * twinkle).toFixed(3)})`;
        ctx.fill();
      }
      raf = live ? requestAnimationFrame(frame) : 0;
    };

    size(); seed();

    const io = new IntersectionObserver(([en]) => {
      live = en.isIntersecting;
      if (live && !raf) raf = requestAnimationFrame(frame);
    });
    io.observe(stage);

    let rt = 0;
    const onResize = () => { clearTimeout(rt); rt = window.setTimeout(() => { size(); seed(); }, 180); };
    addEventListener("resize", onResize, { passive: true });

    return () => {
      io.disconnect();
      removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      cv.remove();
    };
  }, [host]);
}

export default function Hero({ ready }: { ready: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  useParticles(stage);

  const scope = useGsap(() => {
    if (!ready || prefersReducedMotion()) return;

    revealLines(".hero-line > span", { delay: 0.1 });
    gsap.from(".hero-fade", { opacity: 0, y: 22, duration: 1, ease: "expo.out", stagger: 0.09, delay: 0.45 });
    gsap.from(".hero-stage", { opacity: 0, scale: 0.94, duration: 1.4, ease: "expo.out", delay: 0.3 });

    /* the bottle drifts and grows slightly as the hero scrolls away */
    gsap.to(".hero-stage", {
      yPercent: 12, scale: 1.05, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 }
    });
    gsap.to(".hero-copy", {
      yPercent: -14, opacity: 0.35, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 }
    });
  }, [ready]);

  return (
    <section className="hero" id="hero" ref={scope}>
      <div className="hero-glow" aria-hidden />

      <div className="hero-copy">
        <div className="eyebrow hero-line"><span>Нишевая парфюмерия — с 2026</span></div>

        <h1 className="display hero-title">
          <span className="line hero-line"><span>Аромат,</span></span>
          <span className="line hero-line"><span>который</span></span>
          <span className="line hero-line"><span><em>остаётся</em></span></span>
        </h1>

        <p className="lead hero-fade">
          Dior, Louis Vuitton и Valentino — отобранные ароматы трёх домов.
          Найдите тот, что станет вашей подписью.
        </p>

        <div className="hero-cta hero-fade">
          <button className="btn btn--solid" onClick={() => scrollToId("collection")}>
            Смотреть коллекцию
            <ArrowRight className="btn__arrow" size={14} strokeWidth={1.4} />
          </button>
          <button className="link-u hero-about" onClick={() => scrollToId("manifest")}>О бренде</button>
        </div>
      </div>

      <div className="hero-stage" ref={stage}>
        <Bottle product={byId(1)} controls="static" hint style={{ ["--bw" as string]: "150px", ["--bh" as string]: "268px", ["--bd" as string]: "62px" }} />
      </div>

      <div className="hero-side">Eau de Parfum — Made in France</div>
      <div className="scroll-cue"><i />Листайте</div>
    </section>
  );
}
