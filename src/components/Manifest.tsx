import { gsap, prefersReducedMotion, revealFrom, useGsap } from "../lib/motion";
import { HOUSES, products } from "../data/products";
import { LEXICON } from "../data/lexicon";
import { GUIDES } from "../data/guides";
import { NOTE_FACTS } from "../data/facts";

/** every distinct note named across the catalogue */
const NOTE_COUNT = new Set(
  products.flatMap(p => `${p.notes.top},${p.notes.heart},${p.notes.base}`
    .split(",").map(n => n.trim().toLowerCase()).filter(Boolean))
).size;

const TEXT = "Мы не создаём запахи. Мы создаём память, которая остаётся с вами дольше, чем вечер.";

/** Words brighten one by one as the section crosses the viewport. */
export default function Manifest() {
  const words = TEXT.split(" ");

  const scope = useGsap(() => {
    if (prefersReducedMotion()) return;
    revealFrom(".stat", { stagger: 0.1 });
    gsap.fromTo(".manifest-text .w",
      { opacity: 0.16 },
      {
        opacity: 1, ease: "none", stagger: 1,
        scrollTrigger: { trigger: ".manifest", start: "top 75%", end: "bottom 75%", scrub: 0.5 }
      }
    );
  }, []);

  return (
    <section className="section section--dark manifest" id="manifest" ref={scope}>
      <div className="eyebrow">Философия дома</div>
      <p className="manifest-text">
        {words.map((w, i) => (
          <span className="w" key={i}>{w === "память," ? <em>память,</em> : w}{" "}</span>
        ))}
      </p>

      {/* всё, что здесь посчитано, посчитано по самому каталогу */}
      <div className="stats">
        <div className="stat"><b>{products.length}</b><span>Ароматов в витрине</span></div>
        <div className="stat"><b>{HOUSES.length}</b><span>Дома на полке</span></div>
        <div className="stat"><b>{NOTE_COUNT}</b><span>Нот в описаниях</span></div>
        <div className="stat"><b>{NOTE_FACTS.length}</b><span>Историй о сырье</span></div>
        <div className="stat"><b>{LEXICON.length}</b><span>Терминов в лексиконе</span></div>
        <div className="stat"><b>{GUIDES.length}</b><span>Разборов в журнале</span></div>
      </div>
    </section>
  );
}
