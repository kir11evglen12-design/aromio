import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Product } from "../data/products";

interface Props {
  product: Product;
  /** rotation controls: hidden, shown on hover, or always visible */
  controls?: "none" | "hover" | "static";
  hint?: boolean;
  /** css sizing overrides, e.g. { "--bw": "150px" } */
  style?: React.CSSProperties;
  className?: string;
}

/**
 * A perfume bottle built from four CSS 3D faces. It costs a few kilobytes
 * where a WebGL scene would cost hundreds, and it can be tinted per scent.
 */
export default function Bottle({ product, controls = "hover", hint, style, className }: Props) {
  const [rot, setRot] = useState(0);

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
      <div className="b-float">
        <div className="b-stage" style={{ ["--rot" as string]: rot }}>
          <div className="b-face b-front"><span className="b-label">{product.line}</span></div>
          <div className="b-face b-back" />
          <div className="b-face b-side b-right" />
          <div className="b-face b-side b-left" />
          <div className="b-neck" />
          <div className="b-cap" />
        </div>
      </div>

      <div className="b-shadow" aria-hidden />

      {controls !== "none" && (
        <div className={"rotate-ui" + (controls === "static" ? " is-static" : "")}>
          <button
            className="rot-btn"
            onClick={e => { e.stopPropagation(); setRot(r => r - 90); }}
            aria-label={`Повернуть ${product.name} влево`}
          >
            <ChevronLeft size={15} strokeWidth={1.5} />
          </button>
          {hint && <span className="rot-hint">360°</span>}
          <button
            className="rot-btn"
            onClick={e => { e.stopPropagation(); setRot(r => r + 90); }}
            aria-label={`Повернуть ${product.name} вправо`}
          >
            <ChevronRight size={15} strokeWidth={1.5} />
          </button>
        </div>
      )}
    </div>
  );
}
