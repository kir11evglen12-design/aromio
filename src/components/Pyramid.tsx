import type { Product } from "../data/products";
import { noteImage } from "../data/noteImages";
import { noteFamily } from "../lib/notes";

const TIERS: [string, string, keyof Product["notes"], number][] = [
  ["Верхние ноты", "Первые 15 минут", "top", 62],
  ["Ноты сердца", "Через полчаса", "heart", 76],
  ["Базовые ноты", "Шлейф до суток", "base", 90]
];

/**
 * The classic three-tier reading of a fragrance. Discs grow from top to
 * base so the block reads as a pyramid; each note shows its photograph
 * where we have one, and a drawn ingredient family where we do not.
 */
export default function Pyramid({ product }: { product: Product }) {
  return (
    <div className="pyramid">
      {TIERS.map(([label, sub, key, size], tierIndex) => (
        <div className="tier" key={key} data-tier={tierIndex + 1}>
          <div className="tier-label">
            <span className="tier-index">0{tierIndex + 1}</span>
            {label}
            <i>{sub}</i>
          </div>

          <div className="notes-row">
            {product.notes[key].split(",").map(raw => {
              const note = raw.trim();
              const photo = noteImage(note);
              const fam = noteFamily(note);

              return (
                <div className="note" key={note}>
                  <div
                    className={"note-img" + (photo ? " has-photo" : ` n-${fam.key}`)}
                    style={{ ["--r" as string]: `${size}px` }}
                  >
                    {photo
                      ? <img src={photo.src} alt={photo.label} loading="lazy" decoding="async" />
                      : <svg viewBox="0 0 24 24" aria-hidden dangerouslySetInnerHTML={{ __html: fam.icon }} />}
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
