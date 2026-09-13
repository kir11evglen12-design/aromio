import type { Product } from "../data/products";

interface Props {
  product: Product;
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Место аромата в сетке.
 *
 * Где владелец витрины передал снимок — стоит снимок. Где не передал —
 * не рисуем флакон и не притворяемся, что он есть: ставим типографский
 * образец, имя дома крупным гротеском. Пустая ячейка, честно набранная,
 * выглядит уместнее нарисованного флакона, которого никто не видел.
 */
export default function Plate({ product, style, className }: Props) {
  if (product.photo) {
    return (
      <div className={"photo " + (product.photoDark ? "photo--dark " : "") + (className ?? "")} style={style}>
        <img src={product.photo} alt={`${product.brand} ${product.name}`} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div className={"plate plate--type " + (className ?? "")} style={style} aria-hidden>
      <span className="plate-house">{product.brand}</span>
      <span className="plate-line">{product.line}</span>
    </div>
  );
}
