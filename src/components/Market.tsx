import { useMemo, useState } from "react";
import { bottles, HOUSES, money, products, variantOf } from "../data/products";
import { plural } from "../lib/auth";
import { revealFrom, useGsap } from "../lib/motion";

/**
 * Statistics about the shelf itself, not about one bottle: how the houses
 * are represented, what a bottle costs, which notes repeat, which
 * concentrations dominate.
 *
 * Every chart is a single series — magnitude only — so colour carries no
 * meaning and the monochrome palette costs nothing. Direct labels replace
 * gridlines, bars are capped and rounded at the data end, and the numbers
 * are also available as a table.
 */

interface Row { label: string; value: number; extra?: string }

const BAR_MAX = 22;

function Bars({ rows, unit, format }: { rows: Row[]; unit?: string; format?: (n: number) => string }) {
  const max = Math.max(...rows.map(r => r.value), 1);
  const show = format ?? ((n: number) => String(n));

  return (
    <div className="mk-bars">
      {rows.map(r => (
        <div className="mk-row" key={r.label} title={`${r.label}: ${show(r.value)}${unit ? " " + unit : ""}`}>
          <span className="mk-key">{r.label}</span>
          <span className="mk-track">
            <span className="mk-fill" style={{ width: `${(r.value / max) * 100}%`, height: BAR_MAX }} />
          </span>
          <b className="mk-val">{show(r.value)}{r.extra ? <i>{r.extra}</i> : null}</b>
        </div>
      ))}
    </div>
  );
}

function Chart({ title, hint, rows, unit, format }: {
  title: string; hint: string; rows: Row[]; unit?: string; format?: (n: number) => string;
}) {
  const [asTable, setAsTable] = useState(false);
  return (
    <figure className="mk-card">
      <figcaption>
        <div>
          <h3>{title}</h3>
          <p>{hint}</p>
        </div>
        <button className="mk-toggle" onClick={() => setAsTable(t => !t)}>
          {asTable ? "Диаграммой" : "Таблицей"}
        </button>
      </figcaption>

      {asTable
        ? <table className="mk-table">
            <tbody>
              {rows.map(r => (
                <tr key={r.label}>
                  <th scope="row">{r.label}</th>
                  <td>{(format ?? String)(r.value)} {unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        : <Bars rows={rows} unit={unit} format={format} />}
    </figure>
  );
}

export default function Market() {
  const scope = useGsap(() => {
    revealFrom(".market .section-head > div > *", { stagger: 0.07 });
    revealFrom(".mk-card, .mk-tile", { stagger: 0.05, y: 22 });
  }, []);

  const data = useMemo(() => {
    const byHouse: Row[] = HOUSES.map(h => ({
      label: h, value: products.filter(p => p.brand === h).length
    })).sort((a, b) => b.value - a.value);

    /* the 100 ml bottle where a house sells one, otherwise the nearest size */
    const priceOf = (p: typeof products[number]) => variantOf(p, 100).price;

    const priceByHouse: Row[] = HOUSES.map(h => {
      const list = products.filter(p => p.brand === h).map(priceOf);
      const avg = Math.round(list.reduce((s, n) => s + n, 0) / list.length);
      return { label: h, value: avg };
    }).sort((a, b) => b.value - a.value);

    const noteCount = new Map<string, number>();
    for (const p of products) {
      const seen = new Set(
        `${p.notes.top},${p.notes.heart},${p.notes.base}`
          .split(",").map(n => n.trim().toLowerCase()).filter(Boolean)
      );
      for (const n of seen) noteCount.set(n, (noteCount.get(n) ?? 0) + 1);
    }
    const topNotes: Row[] = [...noteCount.entries()]
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([label, value]) => ({ label: label[0].toUpperCase() + label.slice(1), value }));

    const typeCount = new Map<string, number>();
    for (const p of products) typeCount.set(p.type, (typeCount.get(p.type) ?? 0) + 1);
    const byType: Row[] = [...typeCount.entries()]
      .sort((a, b) => b[1] - a[1]).map(([label, value]) => ({ label, value }));

    const allPrices = products.map(priceOf);
    const noses = new Set(products.map(p => p.nose).filter(Boolean) as string[]);
    const withPhoto = products.filter(p => p.photo).length;

    return {
      byHouse, priceByHouse, topNotes, byType,
      cheapest: Math.min(...products.flatMap(p => bottles(p).map(v => v.price))),
      dearest: Math.max(...allPrices),
      median: [...allPrices].sort((a, b) => a - b)[Math.floor(allPrices.length / 2)],
      notes: noteCount.size,
      noses: noses.size,
      withPhoto
    };
  }, []);

  return (
    <section className="section market" id="market" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Витрина в цифрах</div>
          <h2 className="display">Что <em>на полке</em></h2>
        </div>
        <p className="lead">
          Не отзывы и не рейтинги, которых у нас нет, а то, что можно посчитать по
          самому каталогу: сколько чего стоит, какие ноты повторяются чаще всего и
          из чего вообще состоит эта витрина.
        </p>
      </div>

      <div className="mk-tiles">
        <div className="mk-tile"><b>{products.length}</b><span>{plural(products.length, "аромат", "аромата", "ароматов")}</span></div>
        <div className="mk-tile"><b>{HOUSES.length}</b><span>{plural(HOUSES.length, "дом", "дома", "домов")}</span></div>
        <div className="mk-tile"><b>{data.noses}</b><span>{plural(data.noses, "парфюмер назван", "парфюмера названо", "парфюмеров названо")}</span></div>
        <div className="mk-tile"><b>{data.notes}</b><span>{plural(data.notes, "нота в описаниях", "ноты в описаниях", "нот в описаниях")}</span></div>
        <div className="mk-tile"><b>{money(data.median)}</b><span>медианный флакон 100 мл</span></div>
        <div className="mk-tile"><b>{money(data.cheapest)}</b><span>самый доступный флакон</span></div>
      </div>

      <div className="mk-grid">
        <Chart
          title="Ароматов у дома"
          hint="Сколько позиций каждого дома стоит на витрине"
          rows={data.byHouse}
          unit="шт"
        />
        <Chart
          title="Средняя цена 100 мл"
          hint="По всем позициям дома; там, где 100 мл нет, берётся ближайший объём"
          rows={data.priceByHouse}
          format={money}
        />
        <Chart
          title="Ноты, которые повторяются"
          hint="В скольких ароматах витрины встречается нота"
          rows={data.topNotes}
          unit="аром."
        />
        <Chart
          title="Концентрации"
          hint="Чем плотнее раствор, тем меньше нужно нажатий"
          rows={data.byType}
          unit="шт"
        />
      </div>

      <p className="mk-note">
        Считается по данным каталога при каждой загрузке страницы: добавится аромат —
        цифры сойдутся сами. Фотографий у {data.withPhoto} позиций из {products.length};
        у остальных на витрине цветная карточка.
      </p>
    </section>
  );
}
