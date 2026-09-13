import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeftRight, BarChart3, BookOpen, FlaskConical, Search, SlidersHorizontal, Wand2, X
} from "lucide-react";
import { byId, fromPrice, money, products } from "../data/products";
import { useShop } from "../lib/shop";
import { scrollToId } from "./Header";
import Plate from "./Plate";

/**
 * Пустой поиск не должен быть пустым экраном: сверху — то, что человек уже
 * смотрел, ниже — входы в инструменты, которые на сайте действительно есть.
 * Ничего выдуманного: каждая плитка ведёт в работающий раздел.
 */
export default function SearchDrawer() {
  const {
    drawer, closeDrawer, openProduct, recent, removeRecent, clearRecent,
    openCatalog, setCompareOpen, setNoteQuery
  } = useShop();

  const open = drawer === "search";
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 140);
    else setQ("");
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(needle) ||
      p.brand.toLowerCase().includes(needle) ||
      p.line.toLowerCase().includes(needle) ||
      p.type.toLowerCase().includes(needle) ||
      Object.values(p.notes).join(" ").toLowerCase().includes(needle)
    );
  }, [q]);

  const go = (run: () => void) => { closeDrawer(); setTimeout(run, 220); };

  const TOOLS: { icon: React.ReactNode; title: string; note: string; run: () => void }[] = [
    {
      icon: <SlidersHorizontal size={19} strokeWidth={1.9} />,
      title: "Каталог с фильтрами",
      note: "Дом, кому, концентрация, цена",
      run: () => go(openCatalog)
    },
    {
      icon: <FlaskConical size={19} strokeWidth={1.9} />,
      title: "Поиск по нотам",
      note: "Ваниль, уд, бергамот",
      run: () => go(() => { setNoteQuery("ваниль"); scrollToId("collection"); })
    },
    {
      icon: <Wand2 size={19} strokeWidth={1.9} />,
      title: "Подбор аромата",
      note: "Пять вопросов — и подборка",
      run: () => go(() => scrollToId("picker"))
    },
    {
      icon: <ArrowLeftRight size={19} strokeWidth={1.9} />,
      title: "Сравнить",
      note: "До трёх ароматов рядом",
      run: () => go(() => setCompareOpen(true))
    },
    {
      icon: <BookOpen size={19} strokeWidth={1.9} />,
      title: "Лексикон",
      note: "Что значит шипр и фужер",
      run: () => go(() => scrollToId("lexicon"))
    },
    {
      icon: <BarChart3 size={19} strokeWidth={1.9} />,
      title: "Статистика витрины",
      note: "Цены, ноты, концентрации",
      run: () => go(() => scrollToId("market"))
    }
  ];

  return (
    <aside className={"drawer drawer--search" + (open ? " is-open" : "")}
           aria-label="Поиск" aria-hidden={!open} inert={!open}>
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
               placeholder="Название, дом или нота…" autoComplete="off" />
        {q && (
          <button className="sd-clear" onClick={() => { setQ(""); input.current?.focus(); }}
                  aria-label="Очистить строку поиска">
            <X size={15} strokeWidth={2} />
          </button>
        )}
      </div>

      <div className="drawer-body sd-body">
        {q.trim() ? (
          results.length === 0
            ? <p className="empty">Ничего не нашлось. Попробуйте ноту — «уд», «ваниль», «ирис».</p>
            : (
              <div className="sd-results">
                {results.map(p => (
                  <button className="sd-hit" key={p.id} onClick={() => { closeDrawer(); openProduct(p.id); }}>
                    <span className="sd-hit-media">
                      <Plate product={p} style={{ ["--bw" as string]: "34px" }} />
                    </span>
                    <span className="sd-hit-text">
                      <b>{p.name}</b>
                      <i>{p.brand} · {p.type}</i>
                    </span>
                    <span className="sd-hit-price">от {money(fromPrice(p))}</span>
                  </button>
                ))}
              </div>
            )
        ) : (
          <>
            {recent.length > 0 && (
              <section className="sd-block">
                <div className="sd-block-head">
                  <span className="sd-eyebrow">Вы смотрели</span>
                  <button className="sd-clear-all" onClick={clearRecent}>Очистить</button>
                </div>

                <div className="sd-recent">
                  {recent.slice(0, 6).map(id => {
                    const p = byId(id);
                    return (
                      <div className="sd-chip" key={id}>
                        <button className="sd-chip-open" onClick={() => { closeDrawer(); openProduct(id); }}>
                          <span className="sd-chip-media">
                            <Plate product={p} style={{ ["--bw" as string]: "30px" }} />
                          </span>
                          <span className="sd-chip-text">
                            <b>{p.name}</b>
                            <i>{p.brand}</i>
                          </span>
                        </button>
                        <button className="sd-chip-x" onClick={() => removeRecent(id)}
                                aria-label={`Убрать ${p.name} из истории`}>
                          <X size={15} strokeWidth={2} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="sd-block">
              <div className="sd-block-head">
                <span className="sd-eyebrow">Или откройте инструменты витрины</span>
              </div>

              <div className="sd-tools">
                {TOOLS.map(t => (
                  <button className="sd-tool" key={t.title} onClick={t.run}>
                    <span className="sd-tool-icon">{t.icon}</span>
                    <span className="sd-tool-text">
                      <b>{t.title}</b>
                      <i>{t.note}</i>
                    </span>
                  </button>
                ))}
              </div>

              <p className="sd-hint">Нажмите любой инструмент, чтобы начать</p>
            </section>
          </>
        )}
      </div>
    </aside>
  );
}
