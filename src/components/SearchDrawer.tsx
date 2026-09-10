import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { money, products } from "../data/products";
import { useShop } from "../lib/shop";

export default function SearchDrawer() {
  const { drawer, closeDrawer, openProduct } = useShop();
  const open = drawer === "search";
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 140);
    else setQ("");
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return products;
    return products.filter(p =>
      p.name.toLowerCase().includes(needle) ||
      p.brand.toLowerCase().includes(needle) ||
      p.line.toLowerCase().includes(needle) ||
      Object.values(p.notes).join(" ").toLowerCase().includes(needle)
    );
  }, [q]);

  return (
    <aside className={"drawer" + (open ? " is-open" : "")} aria-label="Поиск" aria-hidden={!open}>
      <div className="drawer-head">
        <h3>Поиск</h3>
        <button className="icon-btn" onClick={closeDrawer} aria-label="Закрыть поиск">
          <X size={17} strokeWidth={1.4} />
        </button>
      </div>

      <div className="search-field">
        <Search size={18} strokeWidth={1.3} aria-hidden />
        <label htmlFor="searchInput" className="sr-only">Название аромата или нота</label>
        <input id="searchInput" ref={input} value={q} onChange={e => setQ(e.target.value)}
               placeholder="Название или нота…" autoComplete="off" />
      </div>

      <div className="drawer-body">
        {results.length === 0
          ? <p className="empty">Ничего не найдено. Попробуйте другую ноту.</p>
          : results.map(p => (
              <div className="row" key={p.id}>
                <div>
                  <div className="row-name">{p.name}</div>
                  <div className="row-sub">{p.brand} — {p.line} — {money(p.price)}</div>
                </div>
                <button onClick={() => openProduct(p.id)}>Открыть</button>
              </div>
            ))}
      </div>
    </aside>
  );
}
