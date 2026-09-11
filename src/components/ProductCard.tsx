import { useState } from "react";
import { Check, Heart, Layers, Maximize2, ShoppingBag, Truck } from "lucide-react";
import { bottles, CATEGORY_LABEL, money, priceList, priceNow, sprays, variantOf } from "../data/products";
import type { Product } from "../data/products";
import { useShop } from "../lib/shop";
import Plate from "./Plate";

/** short badge text: the concentration, which is what the label really says */
const SHORT_TYPE: Record<string, string> = {
  "Eau de Parfum": "EDP",
  "Eau de Toilette": "EDT",
  "Extrait de Parfum": "EXTRAIT"
};

/**
 * A marketplace-style card: glass frame, media pane, a strip that picks
 * the volume (the price under it follows), two honest chips and a buy
 * button. Everything in it comes from the product's own data — no invented
 * discounts, badges or ratings.
 */
export default function ProductCard({ product: p }: { product: Product }) {
  const { addToCart, openProduct, isFavorite, toggleFavorite, compare, toggleCompare } = useShop();
  const [ml, setMl] = useState(() => variantOf(p, 100).ml);
  const variant = variantOf(p, ml);
  const [sprayLo, sprayHi] = sprays(p);
  const list = priceList(p, variant);
  const inCompare = compare.includes(p.id);

  const open = () => openProduct(p.id);

  return (
    <article
      className="card"
      style={{ ["--tint" as string]: p.tint }}
      role="button"
      tabIndex={0}
      aria-label={`${p.brand} ${p.name} — открыть карточку`}
      onClick={open}
      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
    >
      <div className={"card-media" + (p.photo ? " media--photo" : "")}>
        <button
          className={"card-round card-cmp" + (inCompare ? " is-on" : "")}
          aria-pressed={inCompare}
          aria-label={`${inCompare ? "Убрать" : "Добавить"} ${p.name} в сравнение`}
          onClick={e => { e.stopPropagation(); toggleCompare(p.id); }}
        >
          {inCompare ? <Check size={15} strokeWidth={2.2} /> : <Layers size={15} strokeWidth={1.6} />}
        </button>

        <span className="card-badge">{SHORT_TYPE[p.type] ?? p.type}</span>
        {p.sale && <span className="card-sale">−{p.sale}%</span>}

        <Plate product={p} />

        <button className="card-round card-zoom" aria-label={`Открыть ${p.name}`}
                onClick={e => { e.stopPropagation(); open(); }}>
          <Maximize2 size={14} strokeWidth={1.6} />
        </button>
      </div>

      {/* the thumbnail strip of a shop, doing something real: volume */}
      <div className="card-sizes" role="radiogroup" aria-label={`Объём — ${p.name}`}>
        {bottles(p).map(v => (
          <button
            key={v.ml}
            role="radio"
            aria-checked={v.ml === ml}
            className={"card-size" + (v.ml === ml ? " is-on" : "")}
            onClick={e => { e.stopPropagation(); setMl(v.ml); }}
          >
            <b>{v.ml}</b><i>мл</i>
          </button>
        ))}
      </div>

      <div className="card-body">
        <div className="card-head">
          <div>
            <div className="card-line">{p.brand}</div>
            <h3 className="card-name" title={p.name}>{p.name}</h3>
          </div>
          <button
            className={"card-round card-fav" + (isFavorite(p.id) ? " is-on" : "")}
            aria-pressed={isFavorite(p.id)}
            aria-label={`${isFavorite(p.id) ? "Убрать" : "Добавить"} ${p.name} в избранное`}
            onClick={e => { e.stopPropagation(); toggleFavorite(p.id); }}
          >
            <Heart size={16} strokeWidth={1.5} />
          </button>
        </div>

        <p className="card-desc">{p.desc}</p>

        <div className="card-chips">
          <span className="card-chip" data-cat={p.category}>{CATEGORY_LABEL[p.category]}</span>
          <span className="card-chip">{sprayLo}–{sprayHi} пшика</span>
          <span className="card-chip card-chip--ship"><Truck size={12} strokeWidth={1.6} />Доставка</span>
        </div>

        <div className="card-foot">
          <div className="card-price">
            <b>{money(priceNow(p, variant))}</b>
            {list !== undefined
              ? <span><s>{money(list)}</s> · {variant.ml} мл</span>
              : <span>{variant.ml} мл</span>}
          </div>

          <button className="card-round card-cart" aria-label={`Положить ${p.name} в корзину`}
                  onClick={e => { e.stopPropagation(); addToCart(p.id, ml); }}>
            <ShoppingBag size={16} strokeWidth={1.5} />
          </button>

          <button className="card-buy" onClick={e => { e.stopPropagation(); addToCart(p.id, ml); }}>
            Купить
          </button>
        </div>
      </div>
    </article>
  );
}
