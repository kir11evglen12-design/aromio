import { useEffect, useState } from "react";
import { ArrowRight, Heart, X } from "lucide-react";
import { byId, CATEGORY_LABEL, money, variantOf } from "../data/products";
import { PRODUCT_STORIES } from "../data/facts";
import { useShop } from "../lib/shop";
import Bottle from "./Bottle";
import Pyramid from "./Pyramid";

export default function ProductPage() {
  const { productId, closeProduct, addToCart, isFavorite, toggleFavorite } = useShop();
  const open = productId !== null;
  const p = byId(productId ?? 1);

  /* default to the 100 ml bottle where a house offers one */
  const [ml, setMl] = useState(() => variantOf(p, 100).ml);
  useEffect(() => { setMl(variantOf(p, 100).ml); }, [p]);

  const variant = variantOf(p, ml);
  const story = PRODUCT_STORIES[p.id];

  return (
    <div className={"product-page" + (open ? " is-open" : "")} role="dialog" aria-modal="true"
         aria-label="Карточка аромата" aria-hidden={!open}>
      <button className="pp-close" onClick={closeProduct} aria-label="Закрыть карточку">
        <X size={17} strokeWidth={1.4} />
      </button>

      {open && (
        <div className="pp-inner">
          <div className={"pp-visual pp-anim" + (p.photo ? " pp-visual--photo" : "")}>
            <Bottle product={p} controls="static"
                    style={{ ["--bw" as string]: "150px", ["--bh" as string]: "266px", ["--bd" as string]: "60px" }} />
          </div>

          <div className="pp-copy">
            <div className="eyebrow pp-anim">{p.brand} — {p.line}</div>
            <h2 className="display pp-name pp-anim">{p.name}</h2>
            <p className="lead pp-anim">{p.desc}</p>

            {story && (
              <aside className="story pp-anim">
                <div className="story-meta">
                  <span>{story.year}</span>
                  {story.nose && <span>Парфюмер — {story.nose}</span>}
                </div>
                <p>{story.text}</p>
              </aside>
            )}

            <div className="pp-anim"><Pyramid product={p} /></div>

            <div className="sizes pp-anim" role="radiogroup" aria-label="Объём флакона">
              <div className="sizes-head">
                <span className="eyebrow">Объём</span>
                <span className="sizes-hint">{variant.ml} мл — {money(variant.price)}</span>
              </div>
              <div className="sizes-row">
                {p.variants.map(v => (
                  <button
                    key={v.ml}
                    role="radio"
                    aria-checked={v.ml === ml}
                    className={"size" + (v.ml === ml ? " is-on" : "")}
                    onClick={() => setMl(v.ml)}
                  >
                    <b>{v.ml}<i>мл</i></b>
                    <span>{money(v.price)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pp-meta pp-anim">
              <div><span>Концентрация</span><b>{p.type}</b></div>
              <div><span>Категория</span><b>{CATEGORY_LABEL[p.category]}</b></div>
              <div><span>Наличие</span><b className="pp-stock"><i />В наличии</b></div>
            </div>

            <div className="pp-buy pp-anim">
              <span className="pp-price">{money(variant.price)}</span>
              <button className="btn btn--solid" onClick={() => addToCart(p.id, ml)}>
                В корзину — {variant.ml} мл
                <ArrowRight className="btn__arrow" size={14} strokeWidth={1.4} />
              </button>
              <button className={"fav-btn" + (isFavorite(p.id) ? " is-on" : "")}
                      aria-pressed={isFavorite(p.id)}
                      aria-label={`${isFavorite(p.id) ? "Убрать" : "Добавить"} ${p.name} в избранное`}
                      onClick={() => toggleFavorite(p.id)}>
                <Heart size={17} strokeWidth={1.4} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
