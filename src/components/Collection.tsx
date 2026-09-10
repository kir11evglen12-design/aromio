import { Check, Heart, Layers, Plus } from "lucide-react";
import { byId, CATEGORY_LABEL, fromPrice, HOUSES, money, products } from "../data/products";
import { plural } from "../lib/auth";
import type { Category as ProductCategory } from "../data/products";
import { SORT_LABEL, useShop, visibleProducts } from "../lib/shop";
import type { Sort } from "../lib/shop";
import { gsap, parallax, prefersReducedMotion, revealFrom, useGsap } from "../lib/motion";
import Plate from "./Plate";

const FILTERS: (ProductCategory | "all")[] = ["all", "women", "men", "unisex", "niche"];

export default function Collection() {
  const {
    category, setCategory, addToCart, openProduct, isFavorite, toggleFavorite,
    sort, setSort, noteQuery, setNoteQuery, compare, toggleCompare, recent
  } = useShop();
  const list = visibleProducts(category, sort, noteQuery);

  const scope = useGsap(() => {
    revealFrom(".collection .section-head > div > *, .filters", { stagger: 0.07 });
    /* the headline drifts against the grid as the section passes */
    parallax(".collection .section-head > div", { y: -46, trigger: ".collection" });
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
          Три дома, двенадцать ароматов. Фотография стоит там, где её дал магазин; остальные позиции — цветные карточки, где цвет закреплён за ароматом. Сравните до трёх сразу, отфильтруйте по ноте или отсортируйте по цене.
        </p>
      </div>

      <div className="filters houses" role="group" aria-label="Фильтр по домам">
        {HOUSES.map(h => (
          <button key={h}
                  className={"filter filter--house" + (category === h ? " is-active" : "")}
                  onClick={() => setCategory(h)}>
            {h}<i>{products.filter(p => p.brand === h).length}</i>
          </button>
        ))}
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

      <div className="cl-tools">
        <label className="cl-note">
          <span className="sr-only">Фильтр по ноте</span>
          <input value={noteQuery} onChange={e => setNoteQuery(e.target.value)}
                 placeholder="Фильтр по ноте: уд, ирис, кофе…" />
          {noteQuery && (
            <button className="cl-clear" onClick={() => setNoteQuery("")} aria-label="Сбросить фильтр по ноте">×</button>
          )}
        </label>

        <div className="cl-sort" role="group" aria-label="Сортировка">
          {(Object.keys(SORT_LABEL) as Sort[]).map(k => (
            <button key={k} className={"cl-sort-btn" + (sort === k ? " is-on" : "")}
                    onClick={() => setSort(k)}>{SORT_LABEL[k]}</button>
          ))}
        </div>

        <div className="cl-count" aria-live="polite">
          {list.length} {plural(list.length, "аромат", "аромата", "ароматов")}
        </div>
      </div>

      <div className="grid">
        {list.map(p => (
          <article
            className="card"
            key={p.id}
            role="button"
            tabIndex={0}
            aria-label={`${p.brand} ${p.name} — открыть карточку`}
            onClick={() => openProduct(p.id)}
            onKeyDown={e => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openProduct(p.id); }
            }}
          >
            <div className={"card-media" + (p.photo ? " media--photo" : "")}>
              <span className="card-tag" data-cat={p.category}>{CATEGORY_LABEL[p.category]}</span>

              <button
                className={"cmp-btn" + (compare.includes(p.id) ? " is-on" : "")}
                aria-pressed={compare.includes(p.id)}
                aria-label={`${compare.includes(p.id) ? "Убрать" : "Добавить"} ${p.name} в сравнение`}
                onClick={e => { e.stopPropagation(); toggleCompare(p.id); }}
              >
                {compare.includes(p.id)
                  ? <Check size={15} strokeWidth={2} />
                  : <Layers size={15} strokeWidth={1.5} />}
              </button>

              <button
                className={"fav-btn" + (isFavorite(p.id) ? " is-on" : "")}
                aria-pressed={isFavorite(p.id)}
                aria-label={`${isFavorite(p.id) ? "Убрать" : "Добавить"} ${p.name} в избранное`}
                onClick={e => { e.stopPropagation(); toggleFavorite(p.id); }}
              >
                <Heart size={17} strokeWidth={1.4} />
              </button>

              <Plate product={p} />
            </div>

            <div className="card-body">
              <div className="card-line">{p.brand}</div>
              <h3 className="card-name" title={p.name}>{p.name}</h3>

              <div className="card-foot">
                <span className="card-price"><i>от</i> {money(fromPrice(p))}</span>
                <button className="card-add" aria-label={`Добавить ${p.name} в корзину`}
                        onClick={e => { e.stopPropagation(); addToCart(p.id); }}>
                  <Plus size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>

          </article>
        ))}
      </div>

      {list.length === 0 && (
        <p className="empty cl-empty">
          По этой ноте ничего не нашлось. Попробуйте «ваниль», «уд» или сбросьте фильтр.
        </p>
      )}

      {recent.length > 1 && (
        <div className="cl-recent">
          <div className="eyebrow">Вы смотрели</div>
          <div className="cl-recent-row">
            {recent.map(id => {
              const p = byId(id);
              return (
                <button className="cl-recent-chip" key={id} onClick={() => openProduct(id)}>
                  <i style={{ background: p.tint }} aria-hidden />
                  <span>{p.name}</span>
                  <em>от {money(fromPrice(p))}</em>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
