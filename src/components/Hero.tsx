import { useEffect, useRef } from "react";
import { ArrowRight, Search } from "lucide-react";
import { byId, HOUSES, products } from "../data/products";
import { LEXICON } from "../data/lexicon";
import { plural } from "../lib/auth";
import { gsap, prefersReducedMotion, revealLines, useGsap } from "../lib/motion";
import Plate from "./Plate";
import { useShop } from "../lib/shop";
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

const QUICK: [string, string][] = [
  ["Каталог", "collection"],
  ["Журнал", "journal"],
  ["Лексикон", "lexicon"],
  ["Дома", "houses"]
];

/** counted from the catalogue itself, so the numbers cannot drift */
const NOTE_COUNT = new Set(
  products.flatMap(p => `${p.notes.top},${p.notes.heart},${p.notes.base}`
    .split(",").map(n => n.trim().toLowerCase()).filter(Boolean))
).size;

const FACTS: [string, string][] = [
  [String(products.length), "ароматов"],
  [String(HOUSES.length), "домов"],
  [String(NOTE_COUNT), "нот"],
  [String(LEXICON.length), "терминов"]
];

export default function Hero({ ready }: { ready: boolean }) {
  const { setPaletteOpen, openCatalog } = useShop();
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
        <div className="eyebrow hero-line"><span>Новые запахи на каждый день</span></div>

        <h1 className="display hero-title">
          <span className="line hero-line"><span>Аромат,</span></span>
          <span className="line hero-line"><span>который</span></span>
          <span className="line hero-line"><span><em>остаётся</em></span></span>
        </h1>

        <p className="lead hero-fade">
          {/* число домов считается из каталога: «ещё шесть» было верно,
              когда домов было десять, и стало враньём, когда их стало
              двадцать три */}
          Dior, Chanel, Tom Ford, Creed и ещё{" "}
          {HOUSES.length - 4} {plural(HOUSES.length - 4, "дом", "дома", "домов")} на
          одной витрине. Пробник от 1 мл — чтобы узнать аромат на себе, а не у тестера.
        </p>

        <div className="hero-quick hero-fade">
          {QUICK.map(([label, target]) => (
            <button key={label} className="hero-chip" onClick={() => scrollToId(target)}>{label}</button>
          ))}
          <span className="hero-kbd">
            <kbd>Ctrl</kbd><kbd>K</kbd> — поиск по всему сайту
          </span>
          <button className="hero-chip hero-chip--find" onClick={() => setPaletteOpen(true)}>
            <Search size={14} strokeWidth={1.6} />Найти аромат
          </button>
        </div>

        <div className="hero-cta hero-fade">
          <button className="btn btn--solid" onClick={openCatalog}>
            Открыть каталог
            <ArrowRight className="btn__arrow" size={14} strokeWidth={1.4} />
          </button>
          <button className="link-u hero-about" onClick={() => scrollToId("manifest")}>О бренде</button>
        </div>
      </div>

      <div className="hero-stage" ref={stage}>
        <Plate product={byId(1)} style={{ ["--bw" as string]: "150px", ["--bh" as string]: "268px" }} />
      </div>

      <div className="hero-facts hero-fade">
        {FACTS.map(([n, label]) => (
          <div className="hero-fact" key={label}>
            <b>{n}</b><span>{label}</span>
          </div>
        ))}
      </div>

      <div className="hero-side">Eau de Parfum — Made in France</div>
      <div className="scroll-cue"><i />Листайте</div>
    </section>
  );
}
