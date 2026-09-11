import { X } from "lucide-react";
import { byId, CATEGORY_LABEL, fromPrice, money } from "../data/products";
import { PRODUCT_STORIES } from "../data/facts";
import { useShop } from "../lib/shop";
import Plate from "./Plate";

/**
 * Side-by-side comparison of up to three fragrances. A docked bar shows
 * what is selected from anywhere on the page; opening it lays the rows out
 * as a table so the pyramids can be read against each other.
 */
export default function Compare() {
  const { compare, toggleCompare, clearCompare, compareOpen, setCompareOpen, addToCart, openProduct } = useShop();

  if (compare.length === 0) return null;
  const items = compare.map(byId);

  return (
    <>
      <div className={"cmp-bar" + (compareOpen ? " is-hidden" : "")}>
        <span className="cmp-count">{compare.length} / 3</span>
        <div className="cmp-chips">
          {items.map(p => (
            <button key={p.id} className="cmp-chip" onClick={() => toggleCompare(p.id)}
                    aria-label={`Убрать ${p.name} из сравнения`}>
              {p.name}<X size={12} strokeWidth={2} />
            </button>
          ))}
        </div>
        <button className="btn btn--solid btn--sm" onClick={() => setCompareOpen(true)}>Сравнить</button>
        <button className="link-quiet" onClick={clearCompare}>Очистить</button>
      </div>

      <div className={"cmp-panel" + (compareOpen ? " is-open" : "")} role="dialog"
           aria-modal="true" aria-label="Сравнение ароматов" aria-hidden={!compareOpen}>
        <div className="cmp-inner">
          <div className="cmp-top">
            <div>
              <div className="eyebrow">Сравнение</div>
              <h2 className="display cmp-title">Рядом<em>.</em></h2>
            </div>
            <button className="pp-close" onClick={() => setCompareOpen(false)} aria-label="Закрыть сравнение">
              <X size={17} strokeWidth={1.4} />
            </button>
          </div>

          <div className="cmp-grid" style={{ ["--cols" as string]: items.length }}>
            <div className="cmp-corner" aria-hidden />
            {items.map(p => (
              <div className="cmp-col" key={p.id}>
                <div className="cmp-media"><Plate product={p} style={{ ["--bw" as string]: "70px" }} /></div>
                <div className="cmp-brand">{p.brand}</div>
                <button className="cmp-name" onClick={() => { setCompareOpen(false); openProduct(p.id); }}>
                  {p.name}
                </button>
              </div>
            ))}

            {(["Тип", "Линия", "Категория", "Год", "Верхние ноты", "Ноты сердца", "База", "Объёмы", "Цена"] as const).map(row => (
              <div className="cmp-row" key={row}>
                <div className="cmp-key">{row}</div>
                {items.map(p => {
                  const story = PRODUCT_STORIES[p.id];
                  const value =
                    row === "Тип" ? p.type :
                    row === "Линия" ? p.line :
                    row === "Категория" ? CATEGORY_LABEL[p.category] :
                    row === "Год" ? (story?.year ?? "—") :
                    row === "Верхние ноты" ? p.notes.top :
                    row === "Ноты сердца" ? p.notes.heart :
                    row === "База" ? p.notes.base :
                    row === "Объёмы" ? p.variants.map(v => `${v.ml} мл`).join(" · ") :
                    "от " + money(fromPrice(p));
                  return <div className="cmp-val" key={p.id + row}>{value}</div>;
                })}
              </div>
            ))}

            <div className="cmp-row cmp-row--buy">
              <div className="cmp-key">Купить</div>
              {items.map(p => (
                <div className="cmp-val" key={"buy" + p.id}>
                  <button className="btn btn--solid btn--buy btn--sm" onClick={() => addToCart(p.id, 100)}>
                    100 мл — {money(p.variants.find(v => v.ml === 100)?.price ?? fromPrice(p))}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
