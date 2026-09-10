import { ArrowRight } from "lucide-react";
import { byId, money } from "../data/products";
import { useShop } from "../lib/shop";
import { gsap, prefersReducedMotion, revealFrom, useGsap } from "../lib/motion";
import Bottle from "./Bottle";

const PICKS = [9, 4];

/** Full-width product acts; visual and copy drift against each other. */
export default function Showcase() {
  const { openProduct } = useShop();

  const scope = useGsap(() => {
    revealFrom(".showcase-copy > *", { stagger: 0.07 });
    if (prefersReducedMotion()) return;

    gsap.utils.toArray<HTMLElement>(".showcase").forEach((sec, i) => {
      const dir = i % 2 ? -1 : 1;
      gsap.to(sec.querySelector(".showcase-holder"), {
        yPercent: -9 * dir, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.7 }
      });
      gsap.to(sec.querySelector(".showcase-ghost"), {
        yPercent: 12 * dir, ease: "none",
        scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.7 }
      });
    });
  }, []);

  return (
    <div ref={scope} id="showcase">
      {PICKS.map((id, i) => {
        const p = byId(id);
        const dark = i % 2 === 1;
        return (
          <section className={"showcase" + (dark ? " showcase--alt section--dark" : "")} key={id}>
            <div className={"showcase-visual" + (p.photo ? " showcase-visual--photo" : "")}>
              <div className="showcase-ghost" aria-hidden>{p.line}</div>
              <div className="showcase-holder"><Bottle product={p} controls="static" hint
                     style={{ ["--bw" as string]: "138px", ["--bh" as string]: "246px", ["--bd" as string]: "56px" }} /></div>
            </div>

            <div className="showcase-copy">
              <div className="eyebrow">{p.brand} — {p.line}</div>
              <h2 className="display showcase-name">{p.name}</h2>
              <p className="lead">{p.desc}</p>

              <div className="spec">
                <div><span>Верхние ноты</span><b>{p.notes.top}</b></div>
                <div><span>Сердце</span><b>{p.notes.heart}</b></div>
                <div><span>База</span><b>{p.notes.base}</b></div>
                <div><span>Объём</span><b>{p.volume}</b></div>
              </div>

              <div className="showcase-foot">
                <span className="showcase-price">{money(p.price)}</span>
                <button className={"btn" + (dark ? " btn--light" : "")} onClick={() => openProduct(p.id)}>
                  Смотреть аромат
                  <ArrowRight className="btn__arrow" size={14} strokeWidth={1.4} />
                </button>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
