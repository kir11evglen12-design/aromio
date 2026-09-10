import { byId } from "../data/products";
import { gsap, prefersReducedMotion, revealFrom, useGsap } from "../lib/motion";
import Bottle from "./Bottle";

const ACTS = [
  ["01 — 0:00", "Верхние ноты", "Первые пятнадцать минут. Самые летучие молекулы уходят первыми — цитрус, зелень, специи. Это приветствие, а не сам аромат."],
  ["02 — 0:30", "Сердце", "Через полчаса раскрывается характер: цветы, смолы, древесная тёплая середина. Именно эту фазу окружающие запоминают как «ваш запах»."],
  ["03 — 4:00", "База", "Шлейф держится до суток. Мускус, амбра и древесные остаются на коже и ткани, меняясь вместе с вашей температурой."]
];

/** The bottle pins and turns while the three acts scroll past it. */
export default function Chapters() {
  const scope = useGsap(() => {
    revealFrom(".chapters .section-head > div > *", { stagger: 0.08 });
    if (prefersReducedMotion()) return;

    gsap.to(".chapters .b-stage", {
      ["--rot" as string]: 320, ease: "none",
      scrollTrigger: { trigger: ".chapters-grid", start: "top 70%", end: "bottom bottom", scrub: 0.8 }
    });

    gsap.utils.toArray<HTMLElement>(".chapter").forEach(ch => {
      gsap.to(ch, {
        opacity: 1, duration: 0.5,
        scrollTrigger: { trigger: ch, start: "top 62%", end: "bottom 38%", toggleActions: "play reverse play reverse" }
      });
    });
  }, []);

  return (
    <section className="section chapters" id="chapters" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Как раскрывается аромат</div>
          <h2 className="display">Три акта<br /><em>на коже</em></h2>
        </div>
      </div>

      <div className="chapters-grid">
        <div className="chapters-visual">
          <Bottle product={byId(6)} controls="none"
                  style={{ ["--bw" as string]: "132px", ["--bh" as string]: "234px", ["--bd" as string]: "54px" }} />
        </div>
        <div>
          {ACTS.map(([num, title, body]) => (
            <article className="chapter" key={num}>
              <span className="chapter-num">{num}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
