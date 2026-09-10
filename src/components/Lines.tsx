import { CATEGORY_LABEL, products } from "../data/products";
import { useShop } from "../lib/shop";
import { revealFrom, useGsap } from "../lib/motion";

export default function Lines() {
  const { openProduct } = useShop();
  const scope = useGsap(() => { revealFrom(".line-item", { y: 24, stagger: 0.04 }); }, []);

  return (
    <section className="section" id="lines" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Линии</div>
          <h2 className="display">Коллекции<br /><em>витрины</em></h2>
        </div>
        <p className="lead">
          Собственные композиции AROMIO и избранные линии парфюмерных домов — от прозрачных
          цитрусов до плотного древесного шлейфа.
        </p>
      </div>

      <div className="lines-grid">
        {products.map(p => (
          <button className="line-item" key={p.id} onClick={() => openProduct(p.id)}>
            <b>{p.line}</b>
            <span>{CATEGORY_LABEL[p.category]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
