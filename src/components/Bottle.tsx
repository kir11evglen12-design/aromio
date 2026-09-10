import type { Product } from "../data/products";

interface Props {
  product: Product;
  /** css sizing overrides, e.g. { "--bw": "150px" } */
  style?: React.CSSProperties;
  className?: string;
}

/**
 * A flat bottle: one glass face, a cap and a coloured halo in the scent's
 * own tint. No 3D transforms and no perspective — the page composites in
 * two dimensions, which is what keeps a grid of twelve of these cheap.
 */
export default function Bottle({ product, style, className }: Props) {
  if (product.photo) {
    return (
      <div className={"photo " + (className ?? "")} style={style}>
        <img src={product.photo} alt={`${product.brand} ${product.name}`} loading="lazy" decoding="async" />
      </div>
    );
  }

  return (
    <div
      className={"viewer " + (className ?? "")}
      style={{ ...style, ["--tint" as string]: product.tint }}
    >
      <div className="b-halo" aria-hidden />
      <div className="b-float">
        <div className="b-body">
          <span className="b-liquid" aria-hidden />
          <span className="b-gloss" aria-hidden />
          <span className="b-label">{product.line}</span>
        </div>
        <span className="b-neck" aria-hidden />
        <span className="b-cap" aria-hidden />
      </div>
      <div className="b-shadow" aria-hidden />
    </div>
  );
}
