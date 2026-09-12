import { useMemo, useState } from "react";
import { plural } from "../lib/auth";
import { byHouse, fromPrice, HOUSES, money, products } from "../data/products";
import type { House } from "../data/products";
import { HOUSE_STORIES } from "../data/facts";
import { logoOf } from "../data/houseLogos";
import { useShop } from "../lib/shop";
import { revealFrom, useFlip, useGsap } from "../lib/motion";
import { scrollToId } from "./Header";
import { useRef } from "react";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Order = "az" | "count";

const ORDER_LABEL: Record<Order, string> = {
  az: "По алфавиту",
  count: "Больше ароматов"
};

/**
 * Указатель домов: буква сверху, плитки снизу. Где владелец витрины
 * положил логотип в assets/houses, стоит логотип; где не положил —
 * название, набранное шрифтом витрины. Чужой знак наугад мы не рисуем.
 */
export default function Lines() {
  const { setCategory } = useShop();
  const [letter, setLetter] = useState<string | null>(null);
  const [order, setOrder] = useState<Order>("az");

  const scope = useGsap(() => { revealFrom(".hx-tile", { y: 22, stagger: 0.03 }); }, []);
  const grid = useRef<HTMLDivElement>(null);
  useFlip(grid, [letter, order]);

  /* сколько домов начинается на каждую букву — пустые буквы гасим, а не
     прячем: ряд не должен прыгать при переключении */
  const perLetter = useMemo(() => {
    const m: Record<string, number> = {};
    for (const h of HOUSES) m[h[0]] = (m[h[0]] ?? 0) + 1;
    return m;
  }, []);

  const list = useMemo(() => {
    const rows: { house: House; count: number; from: number; story?: typeof HOUSE_STORIES[string]; logo?: string }[] = HOUSES
      .filter(h => (letter ? h.startsWith(letter) : true))
      .map(h => {
        const items = byHouse(h);
        return {
          house: h,
          count: items.length,
          from: items.length ? Math.min(...items.map(p => fromPrice(p))) : 0,
          story: HOUSE_STORIES[h],
          logo: logoOf(h)
        };
      });
    return order === "az"
      ? rows.sort((a, b) => a.house.localeCompare(b.house))
      : rows.sort((a, b) => b.count - a.count || a.house.localeCompare(b.house));
  }, [letter, order]);

  const open = (house: House) => { setCategory(house); scrollToId("collection"); };

  return (
    <section className="section houses-index" id="houses" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Дома</div>
          <h2 className="display">Указатель<br /><em>домов</em></h2>
        </div>
        <p className="lead">
          {HOUSES.length} {plural(HOUSES.length, "дом", "дома", "домов")} и {products.length}{" "}
          {plural(products.length, "аромат", "аромата", "ароматов")} на витрине. Выберите букву
          или дом — витрина отфильтруется сама.
        </p>
      </div>

      <div className="hx-alpha" role="group" aria-label="Дома по первой букве">
        <button className={"hx-letter hx-letter--all" + (letter === null ? " is-on" : "")}
                onClick={() => setLetter(null)}>Все</button>
        {ALPHABET.map(l => {
          const n = perLetter[l] ?? 0;
          return (
            <button key={l} disabled={!n}
                    className={"hx-letter" + (letter === l ? " is-on" : "")}
                    aria-label={n ? `Дома на букву ${l}: ${n}` : `На букву ${l} домов нет`}
                    onClick={() => setLetter(l === letter ? null : l)}>
              {l}
            </button>
          );
        })}
      </div>

      <div className="hx-tools">
        <div className="hx-order" role="group" aria-label="Порядок">
          {(Object.keys(ORDER_LABEL) as Order[]).map(k => (
            <button key={k} className={"cl-sort-btn" + (order === k ? " is-on" : "")}
                    onClick={() => setOrder(k)}>{ORDER_LABEL[k]}</button>
          ))}
        </div>
        <div className="cl-count" aria-live="polite">
          {list.length} {plural(list.length, "дом", "дома", "домов")}
        </div>
      </div>

      <div className="hx-grid" ref={grid}>
        {list.map(h => (
          <button className="hx-tile" key={h.house} data-flip-id={h.house}
                  onClick={() => open(h.house)}
                  aria-label={`Показать ароматы дома ${h.house}`}>
            <span className="hx-mark">
              {h.logo
                ? <img src={h.logo} alt="" loading="lazy" decoding="async" />
                : <span className="hx-word">{h.house}</span>}
              <i className="hx-count">{h.count}</i>
            </span>

            {h.logo ? <span className="hx-name">{h.house}</span> : null}
            <span className="hx-meta">
              {h.story
                /* у Creed вместо года целая оговорка — в строку она не влезает,
                   поэтому в плитке остаётся только город, а оговорка живёт
                   в самой справке о доме */
                ? [/^\d{4}$/.test(h.story.founded) ? h.story.founded : null, h.story.place]
                    .filter(Boolean).join(" · ")
                : `от ${money(h.from)}`}
            </span>
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <p className="empty">На эту букву домов пока нет.</p>
      )}
    </section>
  );
}
