import { Heart, Plus } from "lucide-react";
import { CATEGORY_LABEL, money } from "../data/products";
import type { Category as ProductCategory } from "../data/products";
import { useShop, visibleProducts } from "../lib/shop";
import { gsap, prefersReducedMotion, revealFrom, useGsap } from "../lib/motion";
import Bottle from "./Bottle";

const FILTERS: (ProductCategory | "all")[] = ["all", "women", "men", "unisex", "niche"];

export default function Collection() {
  const { category, setCategory, addToCart, openProduct, isFavorite, toggleFavorite } = useShop();
  const list = visibleProducts(category);

  const scope = useGsap(() => {
    revealFrom(".collection .section-head > div > *, .filters", { stagger: 0.07 });
  }, []);

  /* re-animate the grid whenever the filter changes */
  useGsap(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(".card",
      { opacity: 0, y: 26 },
      { opacity: 1, y: 0, duration: 0.75, ease: "expo.out", stagger: 0.06, overwrite: true }
    );
  }, [category]);

  return (
    <section className="section collection" id="collection" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Коллекция</div>
          <h2 className="display">Ароматы<br /><em>витрины</em></h2>
        </div>
        <p className="lead">
          Каждый флакон можно рассмотреть со всех сторон — используйте стрелки под флаконом.
        </p>
      </div>

      <div className="filters" role="group" aria-label="Фильтр по категориям">
        {FILTERS.map(c => (
          <button key={c}
                  className={"filter" + (category === c ? " is-active" : "")}
                  onClick={() => setCategory(c)}>
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>

      <div className="grid">
        {list.map(p => (
          <article className="card" key={p.id} onClick={() => openProduct(p.id)}>
            <div className={"card-media" + (p.photo ? " media--photo" : "")}>
              <span className="card-tag">{CATEGORY_LABEL[p.category]}</span>

              <button
                className={"fav-btn" + (isFavorite(p.id) ? " is-on" : "")}
                aria-pressed={isFavorite(p.id)}
                aria-label={`${isFavorite(p.id) ? "Убрать" : "Добавить"} ${p.name} в избранное`}
                onClick={e => { e.stopPropagation(); toggleFavorite(p.id); }}
              >
                <Heart size={17} strokeWidth={1.4} />
              </button>

              <Bottle product={p} />
            </div>

            <div className="card-body">
              <div>
                <div className="card-line">{p.brand} — {p.volume}</div>
                <h3 className="card-name">{p.name}</h3>
                <div className="card-notes">{p.notes.heart}</div>
              </div>
              <div className="card-price">{money(p.price)}</div>
            </div>

            <button className="card-add" aria-label={`Добавить ${p.name} в корзину`}
                    onClick={e => { e.stopPropagation(); addToCart(p.id); }}>
              <Plus size={16} strokeWidth={1.4} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
