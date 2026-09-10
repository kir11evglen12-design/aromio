import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { FAQ } from "../data/faq";
import { revealFrom, useGsap } from "../lib/motion";

/**
 * Questions people actually ask, answered in one place. Anything that
 * describes this storefront rather than perfumery is marked as demo —
 * the shop is a prototype and says so.
 */
export default function Service() {
  const [open, setOpen] = useState<number | null>(0);
  const scope = useGsap(() => {
    revealFrom(".service .section-head > div > *", { stagger: 0.07 });
    revealFrom(".faq-item", { stagger: 0.04, y: 18 });
  }, []);

  return (
    <section className="section service" id="service" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Вопросы</div>
          <h2 className="display">Что обычно<br /><em>спрашивают</em></h2>
        </div>
        <p className="lead">
          Восемь ответов: половина про парфюмерию, половина про то, как устроена
          эта витрина. Второе помечено — чтобы не принять прототип за магазин.
        </p>
      </div>

      <div className="faq">
        {FAQ.map((f, i) => (
          <div className={"faq-item" + (open === i ? " is-open" : "")} key={f.q}>
            <button className="faq-q" onClick={() => setOpen(open === i ? null : i)}
                    aria-expanded={open === i}>
              <span className="faq-num">{String(i + 1).padStart(2, "0")}</span>
              <span className="faq-text">{f.q}</span>
              {f.demo && <span className="faq-tag"><Info size={11} strokeWidth={2} />о витрине</span>}
              <ChevronDown className="faq-chev" size={17} strokeWidth={1.5} />
            </button>
            <div className="faq-a"><p>{f.a}</p></div>
          </div>
        ))}
      </div>
    </section>
  );
}
