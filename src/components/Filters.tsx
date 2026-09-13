import { useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { byHouse, CATEGORY_LABEL, HOUSES, products } from "../data/products";
import type { Category, House } from "../data/products";
import { useShop } from "../lib/shop";

const CATEGORIES: Category[] = ["women", "men", "unisex", "niche"];

/**
 * Одна вкладка вместо россыпи: бренд и категория живут внутри панели, а
 * снаружи остаётся то, чем пользуются постоянно, — поиск и цена.
 *
 * Витрина держит один фильтр разом, поэтому и бренд, и категория здесь
 * одиночные. Галочка, а не флажок: рисовать флажки под интерфейс, где
 * множественный выбор невозможен, — врать руками пользователя.
 */
export default function Filters() {
  const { category, setCategory } = useShop();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const house = HOUSES.find(h => h === category);
  const cat = CATEGORIES.find(c => c === category);
  const active = house || cat ? 1 : 0;

  useEffect(() => {
    if (!open) { setQ(""); return; }
    setTimeout(() => input.current?.focus(), 130);

    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("mousedown", away);
    addEventListener("keydown", esc);
    return () => { removeEventListener("mousedown", away); removeEventListener("keydown", esc); };
  }, [open]);

  const brands = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return HOUSES
      .map(h => ({ house: h, count: byHouse(h).length }))
      .filter(r => (needle ? r.house.toLowerCase().includes(needle) : true));
  }, [q]);

  const pickHouse = (h: House) => setCategory(h === house ? "all" : h);
  const pickCat = (c: Category) => setCategory(c === cat ? "all" : c);

  return (
    <div className={"ft" + (open ? " is-open" : "")} ref={box}>
      <button className={"ft-btn" + (active ? " is-on" : "")}
              aria-expanded={open} aria-haspopup="dialog"
              onClick={() => setOpen(o => !o)}>
        <SlidersHorizontal size={17} strokeWidth={1.9} aria-hidden />
        <span>Фильтры</span>
        {active > 0 && <i className="ft-badge">{active}</i>}
      </button>

      {active > 0 && (
        <button className="ft-reset" onClick={() => setCategory("all")}>
          <RotateCcw size={13} strokeWidth={2.2} aria-hidden />
          <span>{house ?? CATEGORY_LABEL[cat as Category]}</span>
          <X size={13} strokeWidth={2.6} aria-hidden />
        </button>
      )}

      {open && (
        <div className="ft-panel" role="dialog" aria-label="Фильтры">
          <div className="ft-head">
            <b>Фильтры</b>
            <button className="ft-x" onClick={() => setOpen(false)} aria-label="Закрыть фильтры">
              <X size={16} strokeWidth={2} />
            </button>
          </div>

          <section className="ft-block">
            <div className="ft-block-title">Кому</div>
            <div className="ft-cats">
              {CATEGORIES.map(c => (
                <button key={c} className={"ft-cat ft-cat--" + c + (c === cat ? " is-on" : "")}
                        aria-pressed={c === cat}
                        onClick={() => pickCat(c)}>
                  {CATEGORY_LABEL[c]}
                  <i>{products.filter(p => p.category === c).length}</i>
                </button>
              ))}
            </div>
          </section>

          <section className="ft-block">
            <div className="ft-block-title">Бренд</div>

            <div className="ft-search">
              <Search size={15} strokeWidth={1.7} aria-hidden />
              <input ref={input} value={q} onChange={e => setQ(e.target.value)}
                     placeholder="Найти бренд" autoComplete="off" aria-label="Поиск по брендам" />
              {q && (
                <button className="ft-search-x" onClick={() => { setQ(""); input.current?.focus(); }}
                        aria-label="Очистить">
                  <X size={13} strokeWidth={2.6} />
                </button>
              )}
            </div>

            <div className="ft-list" role="listbox" aria-label="Бренды">
              <button className={"ft-row" + (!house ? " is-on" : "")}
                      role="option" aria-selected={!house}
                      onClick={() => setCategory(cat ?? "all")}>
                <span className="ft-mark">{!house && <Check size={12} strokeWidth={3} />}</span>
                <span className="ft-name">Все бренды</span>
                <i className="ft-count">{HOUSES.length}</i>
              </button>

              {brands.map(r => (
                <button key={r.house} role="option" aria-selected={r.house === house}
                        className={"ft-row" + (r.house === house ? " is-on" : "")}
                        onClick={() => pickHouse(r.house)}>
                  <span className="ft-mark">{r.house === house && <Check size={12} strokeWidth={3} />}</span>
                  <span className="ft-name">{r.house}</span>
                  <i className="ft-count">{r.count}</i>
                </button>
              ))}

              {brands.length === 0 && <p className="ft-empty">Такого бренда на витрине нет.</p>}
            </div>
          </section>

          <div className="ft-foot">
            <button className="ft-clear" onClick={() => setCategory("all")}>Сбросить всё</button>
            <button className="ft-done" onClick={() => setOpen(false)}>Показать</button>
          </div>
        </div>
      )}
    </div>
  );
}
