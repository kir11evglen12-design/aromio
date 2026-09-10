import { ArrowRight, Heart, X } from "lucide-react";
import { byId, CATEGORY_LABEL, money } from "../data/products";
import { useShop } from "../lib/shop";
import Bottle from "./Bottle";
import Pyramid from "./Pyramid";

export default function ProductPage() {
  const { productId, closeProduct, addToCart, isFavorite, toggleFavorite } = useShop();
  const open = productId !== null;
  const p = byId(productId ?? 1);

  return (
    <div className={"product-page" + (open ? " is-open" : "")} role="dialog" aria-modal="true"
         aria-label="Карточка аромата" aria-hidden={!open}>
      <button className="pp-close" onClick={closeProduct} aria-label="Закрыть карточку">
        <X size={17} strokeWidth={1.4} />
      </button>

      {open && (
        <div className="pp-inner">
          <div className={"pp-visual pp-anim" + (p.photo ? " pp-visual--photo" : "")}>
            <Bottle product={p} controls="static" hint
                    style={{ ["--bw" as string]: "150px", ["--bh" as string]: "266px", ["--bd" as string]: "60px" }} />
          </div>

          <div className="pp-copy">
            <div className="eyebrow pp-anim">{p.brand} — {p.line}</div>
            <h2 className="display pp-name pp-anim">{p.name}</h2>
            <p className="lead pp-anim">{p.desc}</p>

            <div className="pp-anim"><Pyramid product={p} /></div>

            <div className="pp-meta pp-anim">
              <div><span>Объём</span><b>{p.volume}</b></div>
              <div><span>Концентрация</span><b>{p.type}</b></div>
              <div><span>Категория</span><b>{CATEGORY_LABEL[p.category]}</b></div>
              <div><span>Наличие</span><b className="pp-stock"><i />В наличии</b></div>
            </div>

            <div className="pp-buy pp-anim">
              <span className="pp-price">{money(p.price)}</span>
              <button className="btn btn--solid" onClick={() => addToCart(p.id)}>
                В корзину
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
