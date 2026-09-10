import type { Product } from "../data/products";

interface Props {
  product: Product;
  style?: React.CSSProperties;
  className?: string;
}

const MONOGRAM: Record<string, string> = {
  DIOR: "D",
  "LOUIS VUITTON": "LV",
  VALENTINO: "V"
};

/**
 * The product plate. Where the store owner supplied a real photograph we
 * show it; everywhere else the slot stays deliberately empty — a colour
 * field in the scent's own tint with the house monogram, and no drawn
 * bottle pretending to be one.
 */
export default function Plate({ product, style, className }: Props) {
  if (product.photo) {
    return (
      <div className={"photo " + (className ?? "")} style={style}>
        <img src={product.photo} alt={`${product.brand} ${product.name}`} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div
      className={"plate " + (className ?? "")}
      style={{ ...style, ["--tint" as string]: product.tint }}
    >
      <div className="pl-field" aria-hidden>
        <span className="pl-mono">{MONOGRAM[product.brand] ?? product.brand.slice(0, 1)}</span>
        <span className="pl-grid" />
      </div>
      <div className="pl-meta">
        <span className="pl-line">{product.line}</span>
        <span className="pl-type">{product.type}</span>
      </div>
    </div>
  );
}
