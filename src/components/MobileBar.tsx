import { LayoutGrid, Search, ShoppingBag, User as UserIcon } from "lucide-react";
import { useShop } from "../lib/shop";

/**
 * The phone's home row. On a small screen the header's icons are a stretch
 * for a thumb, so the four things people actually do live at the bottom
 * of the screen instead, above the home indicator.
 */
export default function MobileBar() {
  const { cart, openDrawer, openProfile, openCatalog, drawer, productId, profileOpen, catalogOpen } = useShop();

  /* an overlay owns the screen while it is up; the bar would sit on top of it */
  const hidden = drawer !== null || productId !== null || profileOpen || catalogOpen;

  return (
    <nav className={"mbar" + (hidden ? " is-hidden" : "")} aria-label="Основное меню">
      <button onClick={openCatalog}>
        <LayoutGrid size={20} strokeWidth={1.5} />
        <span>Каталог</span>
      </button>

      <button onClick={() => openDrawer("search")}>
        <Search size={20} strokeWidth={1.5} />
        <span>Поиск</span>
      </button>

      <button onClick={() => openDrawer("cart")}>
        <span className="mbar-icon">
          <ShoppingBag size={20} strokeWidth={1.5} />
          {cart.length > 0 && <i>{cart.length}</i>}
        </span>
        <span>Корзина</span>
      </button>

      <button onClick={openProfile}>
        <UserIcon size={20} strokeWidth={1.5} />
        <span>Кабинет</span>
      </button>
    </nav>
  );
}
