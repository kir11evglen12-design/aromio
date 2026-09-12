import { useRef } from "react";
import { ArrowRight } from "lucide-react";
import { HOUSES, money, fromPrice, products } from "../data/products";
import { plural } from "../lib/auth";
import { useShop } from "../lib/shop";
import { gsap, pinnedScene, prefersReducedMotion, splitReveal, useGsap } from "../lib/motion";

/* барабан крутит настоящие позиции витрины, а не выдуманные строки */
const REEL = products.slice(0, 12).map(p => ({
  name: p.name,
  house: p.brand,
  price: fromPrice(p)
}));

/**
 * Три сцены между витриной и остальной страницей. Каждая прикалывается и
 * проигрывается прокруткой: окно раскрывается, заголовок расходится на
 * половины, барабан перебирает ароматы. На телефоне и при
 * prefers-reduced-motion сцены остаются, но стоят на месте.
 */
export default function Cinema() {
  const { openCatalog } = useShop();
  const reel = useRef<HTMLDivElement>(null);

  const scope = useGsap(() => {
    if (prefersReducedMotion()) return;

    const mm = gsap.matchMedia();

    /* — сцена 1: окно раскрывается — */
    mm.add("(min-width: 860px)", () => {
      const win = document.querySelector(".cn-window");
      if (!win) return;
      const tl = pinnedScene(win, () => innerHeight * 1.4);
      tl?.fromTo(".cn-port",
        { clipPath: "inset(22% 26% 22% 26% round 120px)" },
        { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "none" }, 0)
        .fromTo(".cn-port-inner", { scale: 1.28 }, { scale: 1, ease: "none" }, 0)
        .fromTo(".cn-window-copy", { yPercent: 26, opacity: 0 },
                { yPercent: 0, opacity: 1, ease: "none", duration: 0.32 }, 0.04)
        .to(".cn-window-hint", { opacity: 0, ease: "none", duration: 0.2 }, 0);
    });

    /* — сцена 2: заголовок расходится на половины — */
    mm.add("(min-width: 860px)", () => {
      const split = document.querySelector(".cn-split");
      if (!split) return;
      const tl = pinnedScene(split, () => innerHeight * 1.1);
      /* половины расходятся к краям, но никогда не встречаются в центре:
         большие слова при 26% просто налезали друг на друга */
      tl?.fromTo(".cn-half--l", { xPercent: 9, opacity: 0.35 },
                 { xPercent: 0, opacity: 1, ease: "none" }, 0)
        .fromTo(".cn-half--r", { xPercent: -9, opacity: 0.35 },
                 { xPercent: 0, opacity: 1, ease: "none" }, 0)
        .fromTo(".cn-split-mid", { opacity: 0, y: 26 }, { opacity: 1, y: 0, ease: "none" }, 0.45)
        .fromTo(".cn-ghost", { xPercent: 14 }, { xPercent: -14, ease: "none" }, 0);
    });

    /* — сцена 3: барабан — */
    mm.add("(min-width: 860px)", () => {
      const stage = document.querySelector(".cn-reel");
      if (!stage || !reel.current) return;
      const rows = gsap.utils.toArray<HTMLElement>(".cn-reel-col .cn-reel-item");
      const step = rows[0]?.offsetHeight ?? 64;
      const tl = pinnedScene(stage, () => innerHeight * 1.6, { scrub: 0.5 });
      tl?.to(".cn-reel-col", {
        y: () => -step * (REEL.length - 1),
        ease: "none"
      }, 0);
    });

    /* заголовки сцен выезжают построчно из-под маски */
    splitReveal(".cn-window-copy h2");
    splitReveal(".cn-reel-head h2");

    return () => mm.revert();
  }, []);

  return (
    <div className="cinema" ref={scope}>
      {/* сцена 1 — окно */}
      <section className="cn-window" aria-label="Витрина крупным планом">
        <div className="cn-port">
          <div className="cn-port-inner" aria-hidden />
          <div className="cn-port-frame" aria-hidden />
        </div>

        <div className="cn-window-copy">
          <div className="eyebrow">
            {products.length} {plural(products.length, "аромат", "аромата", "ароматов")} ·{" "}
            {HOUSES.length} {plural(HOUSES.length, "дом", "дома", "домов")}
          </div>
          <h2 className="display">Новые запахи<br />на каждый день</h2>
          <button className="btn btn--solid cn-cta" onClick={openCatalog}>
            Открыть каталог
            <ArrowRight className="btn__arrow" size={14} strokeWidth={1.4} />
          </button>
        </div>

        <div className="cn-window-hint" aria-hidden>Листайте — окно откроется</div>
      </section>

      {/* сцена 2 — заголовок расходится */}
      <section className="cn-split" aria-label="О витрине">
        <div className="cn-ghost" aria-hidden>AROMIO</div>
        <div className="cn-split-row">
          <span className="display cn-half cn-half--l">Запах</span>
          <span className="display cn-half cn-half--r">решает</span>
        </div>
        <p className="lead cn-split-mid">
          Один флакон живёт на полке годами: {money(Math.min(...products.map(p => fromPrice(p))))} за
          самый доступный аромат витрины — и это не расход на день, а привычка на месяцы.
          Поэтому мы показываем, сколько пшиков нужно на раз и на сколько хватит флакона.
        </p>
      </section>

      {/* сцена 3 — барабан */}
      <section className="cn-reel" aria-label="Ароматы витрины">
        <div className="cn-reel-head">
          <div className="eyebrow">Сегодня на витрине</div>
          <h2 className="display">Аромат дня</h2>
        </div>

        <div className="cn-reel-window" ref={reel}>
          <div className="cn-reel-col">
            {REEL.map(r => (
              <div className="cn-reel-item" key={r.name}>
                <b>{r.name}</b>
                <span>{r.house}</span>
                <em>от {money(r.price)}</em>
              </div>
            ))}
          </div>
          <div className="cn-reel-line" aria-hidden />
        </div>
      </section>
    </div>
  );
}
