import { useShop } from "../lib/shop";
import { GUIDES } from "../data/guides";
import { HOUSES } from "../data/products";
import { scrollToId } from "./Header";
import Wordmark from "./Wordmark";

/**
 * The footer carries the honest note: this is a prototype storefront and
 * says so, right under the navigation, rather than pretending to be a shop.
 */
export default function Footer() {
  const { setCategory, setPaletteOpen, openDrawer, openProfile } = useShop();
  const go = (c: "all" | "men" | "women" | "unisex" | "niche") => { setCategory(c); scrollToId("collection"); };

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <Wordmark className="footer-mark" />
          <p className="footer-claim">
            Витрина трёх домов, собранная как учебный проект: каталог, пирамиды нот,
            журнал и лексикон. Всё, что здесь можно нажать, работает — и живёт
            в вашем браузере.
          </p>
          <button className="btn btn--light btn--sm" onClick={() => setPaletteOpen(true)}>
            Открыть командную панель
          </button>
        </div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4>Каталог</h4>
            <button className="link-u" onClick={() => go("all")}>Все ароматы</button>
            <button className="link-u" onClick={() => go("men")}>Мужские</button>
            <button className="link-u" onClick={() => go("women")}>Женские</button>
            <button className="link-u" onClick={() => go("unisex")}>Унисекс</button>
            <button className="link-u" onClick={() => go("niche")}>Нишевая</button>
          </div>

          <div className="footer-col">
            <h4>Дома</h4>
            {HOUSES.map(h => (
              <button className="link-u" key={h} onClick={() => { setCategory(h); scrollToId("collection"); }}>{h}</button>
            ))}
            <button className="link-u" onClick={() => scrollToId("houses")}>Все дома и истории</button>
          </div>

          <div className="footer-col">
            <h4>Читать</h4>
            {GUIDES.slice(0, 4).map(g => (
              <button className="link-u" key={g.id} onClick={() => scrollToId("journal")}>{g.title}</button>
            ))}
            <button className="link-u" onClick={() => scrollToId("lexicon")}>Французский лексикон</button>
          </div>

          <div className="footer-col">
            <h4>Кабинет</h4>
            <button className="link-u" onClick={openProfile}>Заказы и полка</button>
            <button className="link-u" onClick={openProfile}>Напоминания</button>
            <button className="link-u" onClick={() => openDrawer("cart")}>Корзина</button>
            <button className="link-u" onClick={() => openDrawer("search")}>Поиск по нотам</button>
            <button className="link-u" onClick={() => scrollToId("service")}>Вопросы и ответы</button>
          </div>
        </div>
      </div>

      <div className="footer-note">
        <b>Это демонстрационная витрина.</b> Заказы не отправляются и не
        оплачиваются, цены приведены как пример. Аккаунт, корзина, полка и
        напоминания хранятся только в вашем браузере. Названия домов и ароматов
        принадлежат их правообладателям; фотографии предоставлены владельцем
        витрины. Сведения о сырье и практике носки — общеизвестные, без
        приписок конкретным людям и компаниям.
      </div>

      <div className="footer-bottom">
        <span>© 2026 AROMIO PARFUM’S</span>
        <span>Ctrl + K — поиск по сайту</span>
        <span>Eau de Parfum — Made in France</span>
      </div>
    </footer>
  );
}
