import { useRef, useState } from "react";
import { Check, Heart, Layers, ShoppingBag } from "lucide-react";
import {
  bottles, CATEGORY_LABEL, money, priceList, priceNow, samples, SHORT_TYPE, variantOf
} from "../data/products";
import type { Product } from "../data/products";
import { CATEGORY_TONE } from "../data/categoryTone";
import { useShop } from "../lib/shop";
import { flyToCart, setSharedOrigin } from "../lib/motion";
import Plate from "./Plate";

/**
 * Квадратная плитка с прямыми углами: сверху флакон, снизу панель с
 * ценой и кнопкой. Время года за флаконом убрано — оно спорило со
 * снимком и стало маленькой фотографией на самой карточке товара.
 */
export default function ProductCard({ product: p }: { product: Product }) {
  const { addToCart, buyNow, openProduct, isFavorite, toggleFavorite, compare, toggleCompare } = useShop();
  const [ml, setMl] = useState(() => variantOf(p, 100).ml);
  const variant = variantOf(p, ml);
  const list = priceList(p, variant);
  const inCompare = compare.includes(p.id);
  const fav = isFavorite(p.id);

  /* самый дешёвый отлив — им аромат и пробуют, поэтому он вынесен
     отдельной кнопкой, а не спрятан внутрь карточки товара */
  const trial = samples(p).reduce((a, v) => (priceNow(p, v) < priceNow(p, a) ? v : a), samples(p)[0]);

  const media = useRef<HTMLDivElement>(null);
  const open = () => { setSharedOrigin(media.current); openProduct(p.id); };

  const add = (e: React.MouseEvent) => {
    e.stopPropagation();
    flyToCart(e.currentTarget);
    addToCart(p.id, ml);
  };

  const buy = (e: React.MouseEvent) => {
    e.stopPropagation();
    buyNow(p.id, ml);
  };

  const tryIt = (e: React.MouseEvent) => {
    e.stopPropagation();
    buyNow(p.id, trial.ml);
  };

  return (
    <article className="card" data-flip-id={p.id}
             style={{ ["--tint" as string]: p.tint }}>
      <button className={"card-media" + (p.photo ? " media--photo" : "")}
              onClick={open} aria-label={`Открыть ${p.brand} ${p.name}`}>
        <span className="card-top">
          <span className="card-label">{SHORT_TYPE[p.type] ?? p.type}</span>
          {p.sale ? <span className="card-label card-label--sale"><i aria-hidden>↓</i>{p.sale}%</span> : null}
        </span>

        <span className="card-media-in" ref={media}>
          <Plate product={p} />
        </span>
      </button>

      <div className="card-tools">
        <button className={"card-mini card-mini--cmp" + (inCompare ? " is-on" : "")}
                aria-pressed={inCompare}
                aria-label={`${inCompare ? "Убрать" : "Добавить"} ${p.name} в сравнение`}
                onClick={e => { e.stopPropagation(); toggleCompare(p.id); }}>
          {inCompare ? <Check size={15} strokeWidth={2.4} /> : <Layers size={15} strokeWidth={1.7} />}
        </button>

        <button className={"card-mini card-mini--fav" + (fav ? " is-on" : "")}
                aria-pressed={fav}
                aria-label={`${fav ? "Убрать" : "Добавить"} ${p.name} в избранное`}
                onClick={e => { e.stopPropagation(); toggleFavorite(p.id); }}>
          <Heart size={16} strokeWidth={1.7} />
        </button>
      </div>

      <div className="card-body">
        <div className={"card-line " + CATEGORY_TONE[p.category]}>
          {p.brand}
          {" · "}
          <span className="cat-name"><i className="cat-dot" aria-hidden />{CATEGORY_LABEL[p.category]}</span>
        </div>
        <button className="card-name" onClick={open} title={p.name}>{p.name}</button>

        <div className="card-row">
          <div className="card-price">
            <b>{money(priceNow(p, variant))}</b>
            {list !== undefined ? <s>{money(list)}</s> : null}
          </div>

          <div className="card-sizes" role="radiogroup" aria-label={`Объём — ${p.name}`}>
            {bottles(p).map(v => (
              <button key={v.ml} role="radio" aria-checked={v.ml === ml}
                      className={"card-size" + (v.ml === ml ? " is-on" : "")}
                      onClick={e => { e.stopPropagation(); setMl(v.ml); }}>
                {v.ml}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="card-try" onClick={tryIt}>
        <span className="card-try-label">Пробник {trial.ml} мл</span>
        <span className="card-try-price">{money(priceNow(p, trial))}</span>
      </button>

      <div className="card-buybar">
        <button className="card-cta" onClick={buy}>Купить<span className="cta-more"> сейчас</span></button>
        <button className="card-cart" onClick={add} aria-label={`Положить ${p.name} в корзину`}>
          <ShoppingBag size={19} strokeWidth={1.6} />
        </button>
      </div>
    </article>
  );
}
