import type { Product } from "../data/products";
import { noteImage } from "../data/noteImages";
import { noteFamily } from "../lib/notes";

/**
 * A literal pyramid: two top notes at the apex, three at the heart, four
 * at the base. Tiles shrink as the rows widen, so the block narrows toward
 * the top the way a fragrance is usually drawn.
 */
const TIERS: [string, string, keyof Product["notes"], number][] = [
  ["Верхние ноты", "Первые 15 минут", "top", 104],
  ["Ноты сердца", "Через полчаса", "heart", 88],
  ["Базовые ноты", "Шлейф до суток", "base", 74]
];

export default function Pyramid({ product }: { product: Product }) {
  return (
    <div className="pyramid">
      {TIERS.map(([label, sub, key, size], tier) => (
        <div className="p-tier" key={key} data-tier={tier + 1}>
          <div className="p-row" style={{ ["--tile" as string]: `${size}px` }}>
            {product.notes[key].split(",").map(raw => {
              const note = raw.trim();
              const photo = noteImage(note);
              const fam = noteFamily(note);

              return (
                <figure className="p-note" key={note}>
                  <div className={"p-tile" + (photo ? " has-photo" : ` n-${fam.key}`)}>
                    {photo
                      ? <img src={photo.src} alt={photo.label} loading="lazy" decoding="async" />
                      : <svg viewBox="0 0 24 24" aria-hidden dangerouslySetInnerHTML={{ __html: fam.icon }} />}
                  </div>
                  <figcaption>{note}</figcaption>
                </figure>
              );
            })}
          </div>

          <div className="p-legend">
            <span className="p-step">0{tier + 1}</span>
            <b>{label}</b>
            <i>{sub}</i>
          </div>
        </div>
      ))}
    </div>
  );
}
