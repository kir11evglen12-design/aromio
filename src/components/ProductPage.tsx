import { useEffect, useState } from "react";
import { ArrowRight, Check, Heart, Layers, X } from "lucide-react";
import { byId, CATEGORY_LABEL, fromPrice, money, products, variantOf } from "../data/products";
import { HOUSE_STORIES, PRODUCT_STORIES } from "../data/facts";
import { plural } from "../lib/auth";
import { useShop } from "../lib/shop";
import Plate from "./Plate";
import Pyramid from "./Pyramid";

export default function ProductPage() {
  const {
    productId, closeProduct, addToCart, isFavorite, toggleFavorite,
    compare, toggleCompare, addToShelf, onShelf, openProduct
  } = useShop();
  const open = productId !== null;
  const p = byId(productId ?? 1);

  /* default to the 100 ml bottle where a house offers one */
  const [ml, setMl] = useState(() => variantOf(p, 100).ml);
  useEffect(() => { setMl(variantOf(p, 100).ml); }, [p]);

  const variant = variantOf(p, ml);
  const story = PRODUCT_STORIES[p.id];
  const house = HOUSE_STORIES[p.brand];

  /* how long a bottle lasts: one press of a sprayer is about 0.1 ml */
  const [sprays, setSprays] = useState(3);
  const days = Math.round(variant.ml / (sprays * 0.1));
  const months = Math.max(1, Math.round(days / 30));
  const perWear = Math.round(variant.price / Math.max(1, days));

  /* neighbours by shared notes — computed, not curated */
  const noteSet = (x: typeof p) =>
    (x.notes.top + "," + x.notes.heart + "," + x.notes.base)
      .toLowerCase().split(",").map(n => n.trim()).filter(Boolean);

  const mine = new Set(noteSet(p));
  const similar = products
    .filter(x => x.id !== p.id)
    .map(x => ({ x, score: noteSet(x).filter(n => mine.has(n)).length }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  return (
    <div className={"product-page" + (open ? " is-open" : "")} role="dialog" aria-modal="true"
         aria-label="Карточка аромата" aria-hidden={!open}>
      <button className="pp-close" onClick={closeProduct} aria-label="Закрыть карточку">
        <X size={17} strokeWidth={1.4} />
      </button>

      {open && (
        <div className="pp-inner">
          <div className={"pp-visual pp-anim" + (p.photo ? " pp-visual--photo" : "")}>
            <Plate product={p}
                    style={{ ["--bw" as string]: "150px", ["--bh" as string]: "266px" }} />
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
              <button className="btn btn--solid btn--buy" onClick={() => addToCart(p.id, ml)}>
                В корзину — {variant.ml} мл
                <ArrowRight className="btn__arrow" size={14} strokeWidth={1.4} />
              </button>
              <button className={"fav-btn" + (isFavorite(p.id) ? " is-on" : "")}
                      aria-pressed={isFavorite(p.id)}
                      aria-label={`${isFavorite(p.id) ? "Убрать" : "Добавить"} ${p.name} в избранное`}
                      onClick={() => toggleFavorite(p.id)}>
                <Heart size={17} strokeWidth={1.4} />
              </button>
              <button className={"fav-btn" + (compare.includes(p.id) ? " is-on" : "")}
                      aria-pressed={compare.includes(p.id)}
                      aria-label="Добавить в сравнение"
                      onClick={() => toggleCompare(p.id)}>
                {compare.includes(p.id) ? <Check size={16} strokeWidth={2} /> : <Layers size={16} strokeWidth={1.5} />}
              </button>
            </div>

            <div className="pp-calc pp-anim">
              <div className="pp-calc-head">
                <span className="eyebrow">Насколько хватит</span>
                <span className="pp-calc-val">
                  {days} {plural(days, "день", "дня", "дней")} · около {months} {plural(months, "месяца", "месяцев", "месяцев")}
                </span>
              </div>
              <label className="pp-calc-slider">
                <span>{sprays} {plural(sprays, "нажатие", "нажатия", "нажатий")} в день</span>
                <input type="range" min={1} max={8} value={sprays}
                       onChange={e => setSprays(Number(e.target.value))}
                       aria-label="Нажатий в день" />
              </label>
              <p className="pp-calc-note">
                Одно нажатие пульверизатора расходует примерно 0,1 мл. При такой носке
                флакон {variant.ml} мл обойдётся примерно в {money(perWear)} в день.
              </p>
              <button className="link-u" onClick={() => addToShelf(p.id, variant.ml)}>
                {onShelf(p.id) ? "Уже на вашей полке" : "У меня есть этот флакон"}
              </button>
            </div>

            {house && (
              <aside className="house-story pp-anim">
                <div className="story-meta"><span>{p.brand}</span><span>{house.founded} — {house.place}</span></div>
                <p>{house.text}</p>
              </aside>
            )}

            {similar.length > 0 && (
              <div className="pp-similar pp-anim">
                <div className="eyebrow">Рядом по нотам</div>
                <div className="pp-similar-row">
                  {similar.map(({ x, score }) => (
                    <button className="pp-sim" key={x.id} onClick={() => openProduct(x.id)}>
                      <i style={{ background: x.tint }} aria-hidden />
                      <b>{x.name}</b>
                      <span>{x.brand}</span>
                      <em>{score} {plural(score, "общая нота", "общие ноты", "общих нот")} · от {money(fromPrice(x))}</em>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
