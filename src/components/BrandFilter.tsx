import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { byHouse, HOUSES, products } from "../data/products";
import type { House } from "../data/products";
import { useShop } from "../lib/shop";

/**
 * Бренды больше не лежат лентой из двадцати трёх чипов поперёк экрана —
 * это отдельный фильтр, как на маркетплейсах: кнопка со счётчиком,
 * внутри поиск по домам и список с числом ароматов у каждого.
 *
 * Витрина умеет держать только один фильтр разом, поэтому выбор здесь
 * одиночный. Галочка, а не флажок: обещать множественный выбор
 * интерфейсом, которого нет, — врать руками пользователя.
 */
export default function BrandFilter() {
  const { category, setCategory } = useShop();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const chosen = HOUSES.find(h => h === category);

  useEffect(() => {
    if (!open) { setQ(""); return; }
    setTimeout(() => input.current?.focus(), 120);

    const away = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    addEventListener("mousedown", away);
    addEventListener("keydown", esc);
    return () => { removeEventListener("mousedown", away); removeEventListener("keydown", esc); };
  }, [open]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return HOUSES
      .map(h => ({ house: h, count: byHouse(h).length }))
      .filter(r => (needle ? r.house.toLowerCase().includes(needle) : true));
  }, [q]);

  const pick = (h: House) => {
    setCategory(h === chosen ? "all" : h);
    setOpen(false);
  };

  return (
    <div className={"bf" + (open ? " is-open" : "")} ref={box}>
      <button className={"bf-btn" + (chosen ? " is-on" : "")}
              aria-expanded={open} aria-haspopup="listbox"
              onClick={() => setOpen(o => !o)}>
        <span className="bf-btn-label">Бренд</span>
        <span className="bf-btn-value">{chosen ?? `Все · ${HOUSES.length}`}</span>
        <ChevronDown size={16} strokeWidth={2} aria-hidden />
      </button>

      {chosen && (
        <button className="bf-clear" onClick={() => setCategory("all")}
                aria-label={`Убрать бренд ${chosen}`}>
          <X size={14} strokeWidth={2.4} />
        </button>
      )}

      {open && (
        <div className="bf-panel" role="listbox" aria-label="Бренды">
          <div className="bf-search">
            <Search size={16} strokeWidth={1.6} aria-hidden />
            <input ref={input} value={q} onChange={e => setQ(e.target.value)}
                   placeholder="Найти бренд" autoComplete="off"
                   aria-label="Поиск по брендам" />
            {q && (
              <button className="bf-search-x" onClick={() => { setQ(""); input.current?.focus(); }}
                      aria-label="Очистить">
                <X size={14} strokeWidth={2.4} />
              </button>
            )}
          </div>

          <div className="bf-list">
            <button className={"bf-row" + (!chosen ? " is-on" : "")}
                    role="option" aria-selected={!chosen}
                    onClick={() => { setCategory("all"); setOpen(false); }}>
              <span className="bf-mark">{!chosen && <Check size={13} strokeWidth={3} />}</span>
              <span className="bf-name">Все бренды</span>
              <i className="bf-count">{products.length}</i>
            </button>

            {list.map(r => (
              <button key={r.house} role="option" aria-selected={r.house === chosen}
                      className={"bf-row" + (r.house === chosen ? " is-on" : "")}
                      onClick={() => pick(r.house)}>
                <span className="bf-mark">{r.house === chosen && <Check size={13} strokeWidth={3} />}</span>
                <span className="bf-name">{r.house}</span>
                <i className="bf-count">{r.count}</i>
              </button>
            ))}

            {list.length === 0 && <p className="bf-empty">Такого бренда на витрине нет.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
