import { useRef } from "react";
import { byId, CATEGORY_LABEL, fromPrice, HOUSES, money, products } from "../data/products";
import { plural } from "../lib/auth";
import type { Category as ProductCategory } from "../data/products";
import { SORT_LABEL, useShop, visibleProducts } from "../lib/shop";
import type { Sort } from "../lib/shop";
import { parallax, revealFrom, useFlip, useGsap } from "../lib/motion";
import ProductCard from "./ProductCard";
import SearchBar from "./SearchBar";

const FILTERS: (ProductCategory | "all")[] = ["all", "women", "men", "unisex", "niche"];

export default function Collection() {
  const {
    category, setCategory, openProduct, sort, setSort, noteQuery, recent
  } = useShop();
  const list = visibleProducts(category, sort, noteQuery);

  const scope = useGsap(() => {
    revealFrom(".collection .section-head > div > *, .filters", { stagger: 0.07 });
    /* the headline drifts against the grid as the section passes */
    parallax(".collection .section-head > div", { y: -46, trigger: ".collection" });
  }, []);

  /* filtering never repaints the grid: what stays travels from its old box
     to the new one, what is new rises in behind it */
  const grid = useRef<HTMLDivElement>(null);
  useFlip(grid, [category, sort, noteQuery]);

  return (
    <section className="section collection" id="collection" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Коллекция</div>
          <h2 className="display">Ароматы <em>витрины</em></h2>
        </div>
        <p className="lead">
          {HOUSES.length} {plural(HOUSES.length, "дом", "дома", "домов")}, {products.length}{" "}
          {plural(products.length, "аромат", "аромата", "ароматов")}. Фотография стоит там, где её дал
          магазин; остальные позиции — цветные карточки. Ищите по названию, дому или ноте,
          сравнивайте до трёх сразу и сортируйте по цене.
        </p>
      </div>

      <SearchBar />

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

      <div className="grid" ref={grid}>
        {list.map(p => <ProductCard product={p} key={p.id} />)}
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
