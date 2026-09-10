import { byHouse, HOUSES, money } from "../data/products";
import { useShop } from "../lib/shop";
import { revealFrom, useGsap } from "../lib/motion";
import { scrollToId } from "./Header";

/** The three houses currently on the shelf, with what each brings. */
export default function Lines() {
  const { setCategory, openProduct } = useShop();
  const scope = useGsap(() => { revealFrom(".house-row", { y: 26, stagger: 0.08 }); }, []);

  return (
    <section className="section" id="lines" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Дома</div>
          <h2 className="display">Три дома<br /><em>в витрине</em></h2>
        </div>
        <p className="lead">
          Пока мы держим только то, что знаем досконально: Dior, Louis Vuitton и Valentino.
          Каждый аромат — с полной пирамидой нот.
        </p>
      </div>

      <div className="houses-list">
        {HOUSES.map(house => {
          const items = byHouse(house);
          return (
            <div className="house-row" key={house}>
              <button className="house-title" onClick={() => { setCategory(house); scrollToId("collection"); }}>
                <b>{house}</b>
                <span>{items.length} ароматов</span>
              </button>

              <div className="house-items">
                {items.map(p => (
                  <button className="house-item" key={p.id} onClick={() => openProduct(p.id)}>
                    <span>{p.name}</span>
                    <i>{money(p.price)}</i>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
