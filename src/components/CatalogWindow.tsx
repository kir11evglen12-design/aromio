import { useMemo, useRef, useState } from "react";
import { Check, SlidersHorizontal, X } from "lucide-react";
import {
  bottles, CATEGORY_LABEL, fromPrice, HOUSES, money, products, sprays
} from "../data/products";
import type { Category, House, Product } from "../data/products";
import { flyToCart, setSharedOrigin, useFlip } from "../lib/motion";
import { saleUntil } from "../data/products";
import { plural } from "../lib/auth";
import { useShop } from "../lib/shop";
import Plate from "./Plate";

type Sort = "house" | "asc" | "desc" | "name";

const SORTS: [Sort, string][] = [
  ["house", "По дому"],
  ["asc", "Сначала дешевле"],
  ["desc", "Сначала дороже"],
  ["name", "По названию"]
];

const CATS: Category[] = ["women", "men", "unisex", "niche"];

/** the concentrations actually present in the catalogue */
const TYPES = [...new Set(products.map(p => p.type))];

const PRICE_MAX = Math.max(...products.map(p => fromPrice(p)));

/**
 * The catalogue as its own window: filters on the left, the shelf on the
 * right. Every filter is multi-select and they combine, so "Dior + Chanel,
 * unisex, up to 15 000" is one state, not four clicks in a row.
 */
export default function CatalogWindow() {
  const {
    catalogOpen, closeCatalog, openProduct, addToCart, isFavorite, toggleFavorite
  } = useShop();

  const [houses, setHouses] = useState<House[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const [samplesOnly, setSamplesOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("house");
  const [rail, setRail] = useState(false);

  /* the rows rearrange rather than repaint when a filter flips */
  const grid = useRef<HTMLDivElement>(null);
  useFlip(grid, [houses, cats, types, maxPrice, samplesOnly, sort]);

  const toggle = <T,>(list: T[], set: (v: T[]) => void, v: T) =>
    set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);

  const list = useMemo(() => {
    let out = products.filter(p =>
      (houses.length === 0 || houses.includes(p.brand as House)) &&
      (cats.length === 0 || cats.includes(p.category)) &&
      (types.length === 0 || types.includes(p.type)) &&
      fromPrice(p) <= maxPrice
    );
    if (samplesOnly) out = out.filter(p => bottles(p).length > 0);

    switch (sort) {
      case "asc":  return [...out].sort((a, b) => fromPrice(a) - fromPrice(b));
      case "desc": return [...out].sort((a, b) => fromPrice(b) - fromPrice(a));
      case "name": return [...out].sort((a, b) => a.name.localeCompare(b.name, "ru"));
      default:     return out;
    }
  }, [houses, cats, types, maxPrice, samplesOnly, sort]);

  const reset = () => {
    setHouses([]); setCats([]); setTypes([]); setMaxPrice(PRICE_MAX); setSamplesOnly(false);
  };

  const active = houses.length + cats.length + types.length +
    (maxPrice < PRICE_MAX ? 1 : 0) + (samplesOnly ? 1 : 0);

  return (
    <div className={"cw" + (catalogOpen ? " is-open" : "")} role="dialog" aria-modal="true"
         aria-label="Каталог" aria-hidden={!catalogOpen}>
      <header className="cw-top">
        <div>
          <div className="eyebrow">Каталог</div>
          <h2 className="display">{list.length} {plural(list.length, "аромат", "аромата", "ароматов")}</h2>
        </div>

        <div className="cw-top-tools">
          <button className={"cw-rail-btn" + (rail ? " is-on" : "")} onClick={() => setRail(r => !r)}>
            <SlidersHorizontal size={17} strokeWidth={1.8} />
            Фильтры{active > 0 ? ` · ${active}` : ""}
          </button>
          <button className="pp-close" onClick={closeCatalog} aria-label="Закрыть каталог">
            <X size={18} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      <div className="cw-body">
        <aside className={"cw-rail" + (rail ? " is-open" : "")} aria-label="Фильтры">
          <div className="cw-group">
            <h4>Дом</h4>
            {HOUSES.map(h => (
              <button key={h} className={"cw-check" + (houses.includes(h) ? " is-on" : "")}
                      onClick={() => toggle(houses, setHouses, h)}>
                <i>{houses.includes(h) && <Check size={12} strokeWidth={3} />}</i>
                {h}
                <em>{products.filter(p => p.brand === h).length}</em>
              </button>
            ))}
          </div>

          <div className="cw-group">
            <h4>Кому</h4>
            {CATS.map(c => (
              <button key={c} className={"cw-check" + (cats.includes(c) ? " is-on" : "")}
                      onClick={() => toggle(cats, setCats, c)}>
                <i>{cats.includes(c) && <Check size={12} strokeWidth={3} />}</i>
                {CATEGORY_LABEL[c]}
                <em>{products.filter(p => p.category === c).length}</em>
              </button>
            ))}
          </div>

          <div className="cw-group">
            <h4>Концентрация</h4>
            {TYPES.map(t => (
              <button key={t} className={"cw-check" + (types.includes(t) ? " is-on" : "")}
                      onClick={() => toggle(types, setTypes, t)}>
                <i>{types.includes(t) && <Check size={12} strokeWidth={3} />}</i>
                {t}
                <em>{products.filter(p => p.type === t).length}</em>
              </button>
            ))}
          </div>

          <div className="cw-group">
            <h4>Цена от</h4>
            <label className="cw-price">
              <input type="range" min={3000} max={PRICE_MAX} step={500}
                     value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} />
              <span>до {money(maxPrice)}</span>
            </label>
          </div>

          <button className="cw-reset" onClick={reset} disabled={active === 0}>
            Сбросить фильтры
          </button>
        </aside>

        <div className="cw-main">
          <div className="cw-sorts">
            {SORTS.map(([k, label]) => (
              <button key={k} className={"cl-sort-btn" + (sort === k ? " is-on" : "")}
                      onClick={() => setSort(k)}>{label}</button>
            ))}
          </div>

          <div className="cw-grid" ref={grid}>
            {list.map(p => <Row key={p.id} product={p}
                                onOpen={el => { setSharedOrigin(el); closeCatalog(); openProduct(p.id); }}
                                onBuy={e => { flyToCart(e.currentTarget); addToCart(p.id, 100); }}
                                fav={isFavorite(p.id)}
                                onFav={() => toggleFavorite(p.id)} />)}
          </div>

          {list.length === 0 && (
            <p className="empty">Под такие фильтры ничего не подходит. Сбросьте часть условий.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ product: p, onOpen, onBuy, fav, onFav }: {
  product: Product;
  onOpen: (plate: HTMLElement | null) => void;
  onBuy: (e: React.MouseEvent) => void;
  fav: boolean;
  onFav: () => void;
}) {
  const media = useRef<HTMLButtonElement>(null);
  const [lo, hi] = sprays(p);
  const until = saleUntil();
  return (
    <article className="cw-item" data-flip-id={p.id}>
      <button className="cw-media" ref={media} onClick={() => onOpen(media.current)}
                aria-label={`Открыть ${p.name}`}>
        <Plate product={p} style={{ ["--bw" as string]: "76px" }} />
      </button>

      <div className="cw-info">
        <div className="cw-line">{p.brand} · {p.type}</div>
        <button className="cw-name" onClick={() => onOpen(media.current)}>{p.name}</button>
        <p className="cw-desc">{p.desc}</p>

        <div className="cw-facts">
          <span className="card-chip">{CATEGORY_LABEL[p.category]}</span>
          <span className="card-chip">{lo}–{hi} {plural(hi, "пшик", "пшика", "пшиков")} на раз</span>
          <span className="card-chip">{bottles(p).map(v => v.ml).join(" / ")} мл</span>
          <span className="card-chip">пробники от 1 мл</span>
          {p.sale ? <span className="card-chip cw-off">−{p.sale}% до {until}</span> : null}
        </div>
      </div>

      <div className="cw-buy">
        <span className="cw-price">
          от {money(fromPrice(p))}
          {p.sale ? <s>{money(Math.min(...bottles(p).map(v => v.price)))}</s> : null}
        </span>
        <button className="btn btn--solid cw-cta" onClick={onBuy}>Купить</button>
        <button className={"fav-btn" + (fav ? " is-on" : "")} onClick={onFav}
                aria-pressed={fav} aria-label="В избранное">♥</button>
      </div>
    </article>
  );
}
