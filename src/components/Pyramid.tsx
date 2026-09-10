import type { Product } from "../data/products";
import { noteFamily } from "../lib/notes";

/** Top / heart / base, drawn as tinted discs that grow toward the base. */
export default function Pyramid({ product }: { product: Product }) {
  const tiers: [string, string, string, number][] = [
    ["Верхние", "Первое впечатление", product.notes.top, 58],
    ["Сердце", "Характер аромата", product.notes.heart, 68],
    ["База", "Шлейф на коже", product.notes.base, 78]
  ];

  return (
    <div className="pyramid">
      {tiers.map(([label, sub, list, size]) => (
        <div className="tier" key={label}>
          <div className="tier-label">{label}<i>{sub}</i></div>
          <div className="notes-row">
            {list.split(",").map(raw => {
              const note = raw.trim();
              const fam = noteFamily(note);
              return (
                <div className="note" key={note}>
                  <div className={`note-img n-${fam.key}`} style={{ ["--r" as string]: `${size}px` }}>
                    <svg viewBox="0 0 24 24" aria-hidden dangerouslySetInnerHTML={{ __html: fam.icon }} />
                  </div>
                  <b>{note}</b>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
