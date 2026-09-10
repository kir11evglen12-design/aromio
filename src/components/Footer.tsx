import { useShop } from "../lib/shop";
import { scrollToId } from "./Header";

export default function Footer() {
  const { setCategory } = useShop();
  const go = (c: "all" | "men" | "women") => { setCategory(c); scrollToId("collection"); };

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-word">AROMIO</div>

        <div className="footer-cols">
          <div className="footer-col">
            <h4>Навигация</h4>
            <button className="link-u" onClick={() => go("all")}>Каталог</button>
            <button className="link-u" onClick={() => go("men")}>Мужские</button>
            <button className="link-u" onClick={() => go("women")}>Женские</button>
            <button className="link-u" onClick={() => scrollToId("lines")}>Дома</button>
          </div>
          <div className="footer-col">
            <h4>Контакты</h4>
            <p>hello@aromio.parfum</p>
            <p>+7 900 000 00 00</p>
            <p>Пн–Вс, 10:00–22:00</p>
          </div>
          <div className="footer-col">
            <h4>Сервис</h4>
            <p>Доставка по России</p>
            <p>Обмен и возврат 14 дней</p>
            <p>Подарочная упаковка</p>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© 2026 AROMIO PARFUM’S</span>
        <span>Eau de Parfum — Made in France</span>
      </div>
    </footer>
  );
}
