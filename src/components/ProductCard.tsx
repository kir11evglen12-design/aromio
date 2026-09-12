import { useRef, useState } from "react";
import { Check, Heart, Layers, ShoppingBag } from "lucide-react";
import { bottles, CATEGORY_LABEL, money, priceList, priceNow, SHORT_TYPE, sprays, variantOf } from "../data/products";
import type { Product } from "../data/products";
import { useShop } from "../lib/shop";
import { flyToCart, setSharedOrigin } from "../lib/motion";
import Plate from "./Plate";

/**
 * The shelf card, laid out the way a marketplace lays one out: the labels
 * ride on top of the image, the facts sit in a column under it, and the
 * buy button runs the full width of the card so it is never a guess where
 * to press. Everything shown comes from the product's own data.
 */
export default function ProductCard({ product: p }: { product: Product }) {
  const { addToCart, openProduct, isFavorite, toggleFavorite, compare, toggleCompare } = useShop();
  const [ml, setMl] = useState(() => variantOf(p, 100).ml);
  const variant = variantOf(p, ml);
  const [sprayLo, sprayHi] = sprays(p);
  const list = priceList(p, variant);
  const inCompare = compare.includes(p.id);
  const fav = isFavorite(p.id);

  const media = useRef<HTMLDivElement>(null);

  /* the plate the visitor clicked is where the product page comes from */
  const open = () => { setSharedOrigin(media.current); openProduct(p.id); };

  const buy = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToCart(e.currentTarget);
    addToCart(p.id, ml);
  };

  return (
    <article className="card" data-flip-id={p.id} style={{ ["--tint" as string]: p.tint }}>
      <div className="card-top">
        <span className="card-label">{SHORT_TYPE[p.type] ?? p.type}</span>
        {p.sale ? <span className="card-label card-label--sale">−{p.sale}%</span> : null}

        <button className={"card-mini" + (inCompare ? " is-on" : "")}
                aria-pressed={inCompare}
                aria-label={`${inCompare ? "Убрать" : "Добавить"} ${p.name} в сравнение`}
                onClick={e => { e.stopPropagation(); toggleCompare(p.id); }}>
          {inCompare ? <Check size={15} strokeWidth={2.4} /> : <Layers size={15} strokeWidth={1.7} />}
        </button>

        <button className={"card-mini" + (fav ? " is-on" : "")}
                aria-pressed={fav}
                aria-label={`${fav ? "Убрать" : "Добавить"} ${p.name} в избранное`}
                onClick={e => { e.stopPropagation(); toggleFavorite(p.id); }}>
          <Heart size={16} strokeWidth={1.7} />
        </button>
      </div>

      <button className={"card-media" + (p.photo ? " media--photo" : "")}
              onClick={open} aria-label={`Открыть ${p.brand} ${p.name}`}>
        <span className="card-media-in" ref={media}>
          <Plate product={p} />
        </span>
      </button>

      <div className="card-body">
        <div className="card-line">{p.brand} · {CATEGORY_LABEL[p.category]}</div>
        <button className="card-name" onClick={open} title={p.name}>{p.name}</button>

        <div className="card-sizes" role="radiogroup" aria-label={`Объём — ${p.name}`}>
          {bottles(p).map(v => (
            <button key={v.ml} role="radio" aria-checked={v.ml === ml}
                    className={"card-size" + (v.ml === ml ? " is-on" : "")}
                    onClick={e => { e.stopPropagation(); setMl(v.ml); }}>
              {v.ml}
            </button>
          ))}
        </div>

        <div className="card-price">
          <b>{money(priceNow(p, variant))}</b>
          <span>
            {list !== undefined ? <s>{money(list)}</s> : null}
            <i>×{variant.ml} мл</i>
          </span>
        </div>

        <div className="card-chips">
          <span className="card-chip">{sprayLo}–{sprayHi} пшика</span>
          <span className="card-chip">пробники от 1 мл</span>
        </div>
      </div>

      <div className="card-buybar">
        <button className="card-cta" onClick={buy}>Купить сейчас</button>
        <button className="card-cart" onClick={buy} aria-label={`Положить ${p.name} в корзину`}>
          <ShoppingBag size={19} strokeWidth={1.6} />
        </button>
      </div>
    </article>
  );
}
