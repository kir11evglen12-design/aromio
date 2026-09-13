import { useEffect, useRef, useState } from "react";
import { byId, bottles, fromPrice, HOUSES, money, products, SAMPLE_ML } from "../data/products";
import { plural } from "../lib/auth";
import { SORT_LABEL, useShop, visibleProducts } from "../lib/shop";
import type { Sort } from "../lib/shop";
import { countUp, drawRules, parallax, revealFrom, revealGrid, useFlip, useGsap } from "../lib/motion";
import ProductCard from "./ProductCard";
import SearchBar from "./SearchBar";
import Filters from "./Filters";

/* обе цифры считаются из каталога, поэтому разойтись с витриной не могут */
const VOLUMES = (() => {
  const all = [...new Set(products.flatMap(p => bottles(p).map(v => v.ml)))].sort((a, b) => a - b);
  return `${all[0]}–${all[all.length - 1]}`;
})();

const CHEAPEST = Math.min(...products.map(p => fromPrice(p)));

/* сколько флаконов показываем за раз: полсотни карточек подряд никто не
   просматривает, а бесконечная лента прячет то, что идёт после неё */
const PAGE = 10;

export default function Collection() {
  const {
    category, openProduct, sort, setSort, noteQuery, recent
  } = useShop();
  const list = visibleProducts(category, sort, noteQuery);

  /* «Ещё» вместо длинной ленты. Смена фильтра начинает счёт заново:
     иначе после каталога на 51 аромат фильтр на два открывался бы
     показанным «до 30-го» и кнопки не было бы видно вовсе. */
  const [shown, setShown] = useState(PAGE);
  useEffect(() => { setShown(PAGE); }, [category, sort, noteQuery]);

  const page = list.slice(0, shown);
  const left = list.length - page.length;

  const scope = useGsap(() => {
    revealFrom(".collection .section-head > div > *", { stagger: 0.07 });
    /* заголовок чуть отстаёт от сетки, пока секция проходит мимо */
    parallax(".collection .section-head > div", { y: -46, trigger: ".collection" });
    /* линейки вычерчиваются, цифры досчитываются, ячейки встают рядами —
       три движения одной кривой, в том порядке, в каком глаз читает */
    drawRules(".collection .pitch, .collection .cl-tools", { trigger: ".collection .pitch" });
    countUp(".collection .pitch-fact b");
    revealGrid(".collection .grid > .card");
  }, []);

  /* filtering never repaints the grid: what stays travels from its old box
     to the new one, what is new rises in behind it */
  const grid = useRef<HTMLDivElement>(null);
  useFlip(grid, [category, sort, noteQuery, shown]);

  return (
    <section className="section collection" id="collection" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Интернет-магазин парфюмерии</div>
          <h2 className="display">Духи <em>и пробники</em></h2>
        </div>
        <p className="lead">
          Флаконы парфюмерных домов и розлив от 1 мл — попробовать аромат раньше, чем
          покупать целиком.{" "}
          <span className="lead-more">
            Ищите по названию, дому или ноте, сравнивайте до трёх сразу и сортируйте по цене.
          </span>
        </p>
      </div>

      {/* строка фактов: что продаётся, сколько и почём — видно сразу */}
      <div className="pitch" aria-label="Коротко о витрине">
        <div className="pitch-fact">
          <b>{products.length}</b>
          <span>{plural(products.length, "аромат", "аромата", "ароматов")}</span>
        </div>
        <div className="pitch-fact">
          <b>{HOUSES.length}</b>
          <span>{plural(HOUSES.length, "дом", "дома", "домов")}</span>
        </div>
        <div className="pitch-fact">
          <b>{VOLUMES}</b>
          <span>мл во флаконе</span>
        </div>
        <div className="pitch-fact">
          <b>{SAMPLE_ML.join(" / ")}</b>
          <span>мл в пробнике</span>
        </div>
        <div className="pitch-fact">
          <b>от {money(CHEAPEST)}</b>
          <span>цена на витрине</span>
        </div>
      </div>

      <SearchBar />

      <div className="cl-tools">
        <Filters />

        {/* снаружи остаётся только цена: ею пользуются чаще всего */}
        {/* только цена: нажатие по активной снимает сортировку и
            возвращает порядок по дому — иначе к нему не вернуться */}
        <div className="cl-sort" role="group" aria-label="Сортировка по цене">
          {(["price-asc", "price-desc"] as Sort[]).map(k => (
            <button key={k} className={"cl-sort-btn" + (sort === k ? " is-on" : "")}
                    aria-pressed={sort === k}
                    onClick={() => setSort(sort === k ? "house" : k)}>{SORT_LABEL[k]}</button>
          ))}
        </div>

        <div className="cl-count" aria-live="polite">
          {list.length} {plural(list.length, "аромат", "аромата", "ароматов")}
        </div>
      </div>

      <div className="grid" ref={grid}>
        {page.map(p => <ProductCard product={p} key={p.id} />)}
      </div>

      {left > 0 && (
        <div className="cl-more">
          <button className="more-btn" onClick={() => setShown(n => n + PAGE)}>
            Ещё
            <i>{left} {plural(left, "аромат", "аромата", "ароматов")}</i>
          </button>
        </div>
      )}

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
