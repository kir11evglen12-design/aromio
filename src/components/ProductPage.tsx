import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowRight, Check, Heart, Layers, ShoppingBag, X } from "lucide-react";
import { bottles, byId, CATEGORY_LABEL, fromPrice, money, priceList, priceNow, products, samples, saleUntil, season, sprays, variantOf } from "../data/products";
import { SEASON_IMAGES, SEASON_LABEL } from "../data/seasonImages";
import { HOUSE_STORIES, PRODUCT_STORIES } from "../data/facts";
import { plural } from "../lib/auth";
import { useShop } from "../lib/shop";
import { animate, dur, ENTER, EXIT, flyToCart, prefersReducedMotion } from "../lib/motion";
import Plate from "./Plate";
import Pyramid from "./Pyramid";

export default function ProductPage() {
  const {
    productId, closeProduct, addToCart, buyNow, isFavorite, toggleFavorite,
    compare, toggleCompare, addToShelf, onShelf, openProduct
  } = useShop();
  const open = productId !== null;
  const p = byId(productId ?? 1);

  /* the page itself travels: it comes in from the right edge */
  const panel = useRef<HTMLDivElement>(null);
  const visual = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [leaving, setLeaving] = useState(false);

  /* панель выезжает с правого края — это делает CSS через класс is-open,
     а содержимое догоняет её чуть позже, поэтому движение читается как
     «панель приехала», а не «страница мигнула» */
  useLayoutEffect(() => {
    if (!open || prefersReducedMotion()) return;
    animate(inner.current,
      [{ opacity: 0, transform: "translateX(56px)" }, { opacity: 1, transform: "none" }],
      ENTER, { delay: dur(90), fill: "backwards" });
  }, [open, productId]);

  /* the way back is the same path, run shorter — a slow exit feels sticky */
  const leave = () => {
    if (leaving) return;
    setLeaving(true);
    /* тем же путём назад и быстрее: выход короче входа */
    setTimeout(() => { setLeaving(false); closeProduct(); }, dur(EXIT) + 20);
  };

  /* default to the 100 ml bottle where a house offers one */
  const [ml, setMl] = useState(() => variantOf(p, 100).ml);
  useEffect(() => { setMl(variantOf(p, 100).ml); }, [p]);

  const variant = variantOf(p, ml);

  /* какой флакон дешевле за миллилитр и насколько — считаем, а не назначаем */
  const perMl = (v: { ml: number; price: number }) => priceNow(p, v) / v.ml;
  const best = bottles(p).reduce((a, v) => (perMl(v) < perMl(a) ? v : a), bottles(p)[0]);
  const worst = bottles(p).reduce((a, v) => (perMl(v) > perMl(a) ? v : a), bottles(p)[0]);
  const bestGain = bottles(p).length > 1
    ? Math.round((1 - perMl(best) / perMl(worst)) * 100)
    : 0;
  const story = PRODUCT_STORIES[p.id];
  const house = HOUSE_STORIES[p.brand];

  /* how long a bottle lasts: one press of a sprayer is about 0.1 ml */
  const [sprayCount, setSprayCount] = useState(3);
  const [sprayLo, sprayHi] = sprays(p);
  const days = Math.round(variant.ml / (sprayCount * 0.1));
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
    <div className={"product-page" + (open && !leaving ? " is-open" : "") + (leaving ? " is-leaving" : "")}
         role="dialog" aria-modal="true"
         aria-label="Карточка аромата" aria-hidden={!open} ref={panel}>
      <button className="pp-close" onClick={leave} aria-label="Закрыть карточку">
        <X size={17} strokeWidth={1.4} />
      </button>

      {open && (
        <div className="pp-inner" ref={inner}>
          <div className={"pp-visual pp-anim" + (p.photo ? " pp-visual--photo" : "")} ref={visual}>
            <Plate product={p}
                    style={{ ["--bw" as string]: "150px", ["--bh" as string]: "266px" }} />
          </div>

          <div className="pp-copy">
            <div className="eyebrow pp-anim">{p.brand} — {p.line}</div>
            <h2 className="display pp-name pp-anim">{p.name}</h2>
            <p className="lead pp-anim">{p.desc}</p>

            {/* время года — маленький снимок, а не фон: когда его носят */}
            <figure className="pp-season pp-anim">
              <img src={SEASON_IMAGES[season(p)]} alt="" loading="lazy" decoding="async" />
              <figcaption>
                <span>Когда носить</span>
                <b>{SEASON_LABEL[season(p)]}</b>
              </figcaption>
            </figure>

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
                {bottles(p).map(v => (
                  <button
                    key={v.ml}
                    role="radio"
                    aria-checked={v.ml === ml}
                    className={"size" + (v.ml === ml ? " is-on" : "")}
                    onClick={() => setMl(v.ml)}
                  >
                    <b>{v.ml}<i>мл</i></b>
                    <span>{money(priceNow(p, v))}</span>
                    {v.ml === best.ml && bestGain >= 3 && (
                      <em className="size-best">
                        <i aria-hidden>↓</i>выгоднее на {bestGain}%
                      </em>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="samples pp-anim">
              <div className="sizes-head">
                <span className="eyebrow">Пробники</span>
                <span className="sizes-hint">Отлив из флакона — попробовать, прежде чем брать целиком</span>
              </div>
              <div className="sizes-row">
                {samples(p).map(v => (
                  <button key={v.ml}
                          className={"size size--sample" + (v.ml === ml ? " is-on" : "")}
                          onClick={() => setMl(v.ml)}>
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
              <div><span>Хватает</span><b>{sprayLo}–{sprayHi} {plural(sprayHi, "пшик", "пшика", "пшиков")}</b></div>
            </div>

            {p.sale && (
              <div className="pp-sale pp-anim">
                <span className="pp-sale-tag"><i aria-hidden>↓</i>{p.sale}%</span>
                <span>
                  Промо дома до {saleUntil()}: было {money(variant.price)},
                  сейчас {money(priceNow(p, variant))}. В корзину уходит цена со скидкой.
                </span>
              </div>
            )}

            <div className="pp-buy pp-anim">
              <span className="pp-price">
                {money(priceNow(p, variant))}
                {priceList(p, variant) !== undefined && <s>{money(variant.price)}</s>}
              </span>
              <button className="btn btn--solid btn--buy" onClick={() => buyNow(p.id, ml)}>
                Купить сейчас<span className="pp-buy-ml"> — {variant.ml} мл</span>
                <ArrowRight className="btn__arrow" size={14} strokeWidth={1.4} />
              </button>
              <button className="fav-btn pp-add"
                      aria-label={`Положить ${p.name} в корзину, ${variant.ml} мл`}
                      onClick={e => { flyToCart(e.currentTarget); addToCart(p.id, ml); }}>
                <ShoppingBag size={18} strokeWidth={1.5} />
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
                <span>{sprayCount} {plural(sprayCount, "нажатие", "нажатия", "нажатий")} в день</span>
                <input type="range" min={1} max={8} value={sprayCount}
                       onChange={e => setSprayCount(Number(e.target.value))}
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
