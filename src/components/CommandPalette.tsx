import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { CATEGORY_LABEL, HOUSES, money, fromPrice, products } from "../data/products";
import { GUIDES } from "../data/guides";
import { LEXICON } from "../data/lexicon";
import { useShop } from "../lib/shop";
import { scrollToId } from "./Header";

interface Action {
  id: string;
  label: string;
  hint: string;
  group: string;
  /** extra searchable text that is not shown, e.g. a fragrance's notes */
  keys?: string;
  run: () => void;
}

/**
 * Everything the site can do, in one list, opened with Ctrl/⌘ + K.
 * Products, sections, filters, guides and lexicon entries are all actions,
 * so the whole catalogue is one keystroke away from anywhere on the page.
 */
export default function CommandPalette() {
  const {
    paletteOpen, setPaletteOpen, openProduct, setCategory, addToCart,
    openDrawer, openProfile, setSort, toggleCompare, setCompareOpen
  } = useShop();

  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* Ctrl/⌘ + K anywhere, Escape to leave */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  useEffect(() => {
    if (paletteOpen) { setQ(""); setCursor(0); setTimeout(() => input.current?.focus(), 40); }
  }, [paletteOpen]);

  const close = () => setPaletteOpen(false);

  const actions = useMemo<Action[]>(() => {
    const go = (id: string) => () => { close(); scrollToId(id); };

    const list: Action[] = [
      { id: "s-collection", label: "Каталог", hint: "12 ароматов трёх домов", group: "Разделы", run: go("collection") },
      { id: "s-journal", label: "Журнал", hint: "6 разборов о выборе и носке", group: "Разделы", run: go("journal") },
      { id: "s-lexicon", label: "Лексикон", hint: "26 французских терминов", group: "Разделы", run: go("lexicon") },
      { id: "s-houses", label: "Дома", hint: "Dior, Louis Vuitton, Valentino", group: "Разделы", run: go("houses") },
      { id: "s-picker", label: "Подбор аромата", hint: "Круг выбора", group: "Разделы", run: go("picker") },
      { id: "a-cart", label: "Открыть корзину", hint: "Что уже отложено", group: "Действия", run: () => { close(); openDrawer("cart"); } },
      { id: "a-search", label: "Поиск по нотам", hint: "Например: уд, кофе, ирис", group: "Действия", run: () => { close(); openDrawer("search"); } },
      { id: "a-profile", label: "Личный кабинет", hint: "Заказы, полка, напоминания", group: "Действия", run: () => { close(); openProfile(); } },
      { id: "a-compare", label: "Сравнение", hint: "До трёх ароматов рядом", group: "Действия", run: () => { close(); setCompareOpen(true); } },
      {
        id: "a-calm", label: "Спокойный режим", hint: "Остановить фон и анимации",
        group: "Действия",
        run: () => {
          close();
          document.documentElement.classList.toggle("calm");
          try { localStorage.setItem("aromioCalm", document.documentElement.classList.contains("calm") ? "1" : "0"); } catch { /* ignore */ }
        }
      },
      { id: "f-cheap", label: "Сортировать: сначала дешевле", hint: "По минимальному объёму", group: "Фильтры", run: () => { close(); setSort("price-asc"); scrollToId("collection"); } },
      { id: "f-rich", label: "Сортировать: сначала дороже", hint: "От максимума", group: "Фильтры", run: () => { close(); setSort("price-desc"); scrollToId("collection"); } }
    ];

    for (const h of HOUSES) {
      list.push({
        id: "h-" + h, label: "Дом: " + h, hint: `${products.filter(p => p.brand === h).length} аромата в наличии`,
        group: "Фильтры", run: () => { close(); setCategory(h); scrollToId("collection"); }
      });
    }

    for (const c of ["women", "men", "unisex", "niche"] as const) {
      list.push({
        id: "c-" + c, label: "Категория: " + CATEGORY_LABEL[c], hint: "Фильтр каталога",
        group: "Фильтры", run: () => { close(); setCategory(c); scrollToId("collection"); }
      });
    }

    for (const p of products) {
      const notes = `${p.notes.top}, ${p.notes.heart}, ${p.notes.base}`;
      list.push({
        id: "p-" + p.id, label: `${p.brand} ${p.name}`,
        hint: `${p.type} · от ${money(fromPrice(p))}`,
        keys: `${p.line} ${notes}`,
        group: "Ароматы", run: () => { close(); openProduct(p.id); }
      });
      list.push({
        id: "buy-" + p.id, label: `В корзину: ${p.name}`, hint: "100 мл",
        group: "Быстрая покупка", run: () => { close(); addToCart(p.id, 100); }
      });
      list.push({
        id: "cmp-" + p.id, label: `Сравнить: ${p.name}`, hint: "Добавить в сравнение",
        group: "Сравнение", run: () => { close(); toggleCompare(p.id); setCompareOpen(true); }
      });
    }

    for (const g of GUIDES) {
      list.push({
        id: "g-" + g.id, label: g.title, hint: `${g.kicker} · ${g.minutes} мин чтения`,
        group: "Журнал", run: () => { close(); scrollToId("journal"); }
      });
    }

    for (const t of LEXICON) {
      list.push({
        id: "l-" + t.fr, label: `${t.fr} — ${t.ru}`, hint: t.say,
        group: "Лексикон", run: () => { close(); scrollToId("lexicon"); }
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProduct, setCategory, addToCart, openDrawer, openProfile, setSort, toggleCompare, setCompareOpen]);

  const found = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return actions.slice(0, 12);
    return actions.filter(a =>
      a.label.toLowerCase().includes(s) ||
      a.hint.toLowerCase().includes(s) ||
      a.group.toLowerCase().includes(s) ||
      (a.keys ?? "").toLowerCase().includes(s)
    ).slice(0, 40);
  }, [q, actions]);

  useEffect(() => { setCursor(0); }, [q]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, found.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); found[cursor]?.run(); }
    if (e.key === "Escape") close();
  };

  /* keep the highlighted row in view while arrowing through a long list */
  useEffect(() => {
    listRef.current?.querySelector(".cmd-row.is-on")?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  if (!paletteOpen) return null;

  let lastGroup = "";

  return (
    <div className="cmd-scrim" onClick={close} role="presentation">
      <div className="cmd" role="dialog" aria-modal="true" aria-label="Командная панель"
           onClick={e => e.stopPropagation()}>
        <div className="cmd-head">
          <Search size={17} strokeWidth={1.5} />
          <input
            ref={input}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Аромат, раздел, термин, действие…"
            aria-label="Что нужно найти"
          />
          <kbd>ESC</kbd>
        </div>

        <div className="cmd-list" ref={listRef}>
          {found.length === 0 && <p className="cmd-empty">Ничего не нашлось. Попробуйте «уд», «объём» или «Dior».</p>}
          {found.map((a, i) => {
            const head = a.group !== lastGroup ? (lastGroup = a.group) : null;
            return (
              <div key={a.id}>
                {head && <div className="cmd-group">{head}</div>}
                <button
                  className={"cmd-row" + (i === cursor ? " is-on" : "")}
                  onMouseEnter={() => setCursor(i)}
                  onClick={a.run}
                >
                  <span className="cmd-label">{a.label}</span>
                  <span className="cmd-hint">{a.hint}</span>
                  <ArrowRight size={14} strokeWidth={1.5} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="cmd-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> выбрать</span>
          <span><kbd>↵</kbd> открыть</span>
          <span><kbd>Ctrl</kbd>+<kbd>K</kbd> закрыть</span>
        </div>
      </div>
    </div>
  );
}
