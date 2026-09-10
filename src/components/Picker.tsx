import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { pickerProducts } from "../data/products";
import { useShop } from "../lib/shop";
import { revealFrom, useGsap } from "../lib/motion";
import Bottle from "./Bottle";

/**
 * Choose-a-scent scene: picking a composition repaints the whole stage —
 * liquid, glow, ghost wordmark and copy cross-fade together.
 */
export default function Picker() {
  const { openProduct } = useShop();
  const [active, setActive] = useState(pickerProducts[0]);
  const [shown, setShown] = useState(pickerProducts[0]);
  const [swapping, setSwapping] = useState(false);
  const [radius, setRadius] = useState(168);

  useEffect(() => {
    const measure = () => setRadius(innerWidth < 620 ? 132 : 168);
    measure();
    addEventListener("resize", measure, { passive: true });
    return () => removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (active.id === shown.id) return;
    setSwapping(true);
    const t = setTimeout(() => { setShown(active); setSwapping(false); }, 380);
    return () => clearTimeout(t);
  }, [active, shown]);

  const scope = useGsap(() => { revealFrom(".picker-info > *", { stagger: 0.08 }); }, []);

  const chips = [shown.notes.top, shown.notes.heart, shown.notes.base]
    .join(", ").split(",").slice(0, 5).map(n => n.trim());

  return (
    <section className="picker" id="picker" ref={scope} style={{ ["--tint" as string]: active.tint }}>
      <div className="picker-ghost" aria-hidden>{shown.line}</div>

      <div className="picker-grid">
        <div className="picker-stage">
          <Bottle
            key={active.id}
            product={active}
            controls="none"
            style={{ ["--bw" as string]: "128px", ["--bh" as string]: "226px", ["--bd" as string]: "52px" }}
          />

          <div className="orbit" role="radiogroup" aria-label="Выбор аромата">
            {pickerProducts.map((p, i) => {
              const a = (i / pickerProducts.length) * 360 - 90;
              return (
                <button
                  key={p.id}
                  className={"orbit-dot" + (p.id === active.id ? " is-on" : "")}
                  role="radio"
                  aria-checked={p.id === active.id}
                  aria-label={`${p.name} — ${p.line}`}
                  onClick={() => setActive(p)}
                  style={{
                    ["--dot" as string]: p.tint,
                    ["--pos" as string]: `rotate(${a}deg) translate(${radius}px) rotate(${-a}deg)`
                  }}
                >
                  {p.brand.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="picker-info">
          <div className="eyebrow">Выберите свой аромат</div>
          <div className={"picker-swap" + (swapping ? " is-swapping" : "")}>
            <div className="picker-line">{shown.brand} — {shown.line}</div>
            <h2 className="picker-name">{shown.name}</h2>
            <p className="picker-desc">{shown.desc}</p>
            <div className="picker-notes">
              {chips.map(n => <span className="picker-chip" key={n}>{n}</span>)}
            </div>
          </div>
          <button className="btn btn--light" onClick={() => openProduct(active.id)}>
            Смотреть аромат
            <ArrowRight className="btn__arrow" size={14} strokeWidth={1.4} />
          </button>
        </div>
      </div>
    </section>
  );
}
