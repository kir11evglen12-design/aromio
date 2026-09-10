import { X } from "lucide-react";
import { money } from "../data/products";
import { useShop } from "../lib/shop";

export default function CartDrawer() {
  const { drawer, closeDrawer, cart, cartTotal, removeFromCart, checkout } = useShop();
  const open = drawer === "cart";

  return (
    <aside className={"drawer" + (open ? " is-open" : "")} aria-label="Корзина" aria-hidden={!open}>
      <div className="drawer-head">
        <h3>Корзина</h3>
        <button className="icon-btn" onClick={closeDrawer} aria-label="Закрыть корзину">
          <X size={17} strokeWidth={1.4} />
        </button>
      </div>

      <div className="drawer-body">
        {cart.length === 0
          ? <p className="empty">Пока пусто. Выберите аромат из коллекции.</p>
          : cart.map((p, i) => (
              <div className="row" key={`${p.id}-${i}`}>
                <div>
                  <div className="row-name">{p.name}</div>
                  <div className="row-sub">{p.line} — {p.volume} — {money(p.price)}</div>
                </div>
                <button onClick={() => removeFromCart(i)}>Удалить</button>
              </div>
            ))}
      </div>

      <div className="drawer-foot">
        <div className="total"><span>Итого</span><b>{money(cartTotal)}</b></div>
        <button className="btn btn--solid" onClick={checkout}>Оформить заказ</button>
      </div>
    </aside>
  );
}
