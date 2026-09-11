import { useEffect, useState } from "react";
import { Search, ShoppingBag, User as UserIcon } from "lucide-react";
import { useShop } from "../lib/shop";
import type { Filter } from "../lib/shop";
import { initials } from "../lib/auth";
import Wordmark from "./Wordmark";

const NAV: [string, Filter | "houses"][] = [
  ["Каталог", "all"],
  ["Мужские", "men"],
  ["Женские", "women"],
  ["Дома", "houses"]
];

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + scrollY - 96;
  scrollTo({ top, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}

export default function Header() {
  const { cart, user, openDrawer, openProfile, openCatalog, setCategory, setPaletteOpen } = useShop();
  const [compact, setCompact] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setCompact(scrollY > 40);
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("menu-open", menu);
  }, [menu]);

  const go = (target: Filter | "houses") => {
    setMenu(false);
    if (target === "houses") { scrollToId("houses"); return; }
    /* «Каталог» открывает витрину отдельным окном, остальные пункты фильтруют её */
    if (target === "all") { openCatalog(); return; }
    setCategory(target);
    scrollToId("collection");
  };

  return (
    <>
      <header className={"header" + (compact ? " is-compact" : "")}>
        <a className="brand" href="#top" onClick={e => { e.preventDefault(); scrollTo({ top: 0, behavior: "smooth" }); }}>
          <Wordmark className="brand-mark" />
          <small>PARFUM’S</small>
        </a>

        <nav className="nav">
          {NAV.map(([label, target]) => (
            <button className="link-u" key={label} onClick={() => go(target)}>{label}</button>
          ))}
        </nav>

        <div className="tools">
          <button className="icon-btn" onClick={() => openDrawer("search")} aria-label="Поиск">
            <Search size={19} strokeWidth={1.3} />
          </button>

          <button className="icon-btn" onClick={openProfile}
                  aria-label={user ? `Личный кабинет — ${user.name}` : "Вход и регистрация"}>
            {user ? <span className="avatar">{initials(user)}</span> : <UserIcon size={19} strokeWidth={1.3} />}
          </button>

          <button className="icon-btn" onClick={() => openDrawer("cart")} aria-label="Корзина">
            <ShoppingBag size={19} strokeWidth={1.3} />
            <span className="cart-count">{cart.length}</span>
          </button>

          <button className="burger" onClick={() => setMenu(m => !m)}
                  aria-label="Меню" aria-expanded={menu}>
            <span /><span /><span />
          </button>
        </div>
      </header>

      <div className="mobile-menu">
        {NAV.map(([label, target]) => (
          <button key={label} onClick={() => go(target)}>{label}</button>
        ))}
        <button onClick={() => { setMenu(false); setCategory("niche"); scrollToId("collection"); }}>Нишевая</button>

        <div className="mobile-menu-sep" aria-hidden />

        {([["Журнал", "journal"], ["Лексикон", "lexicon"], ["Вопросы", "service"]] as const).map(([label, id]) => (
          <button key={id} className="mobile-menu-sub" onClick={() => { setMenu(false); scrollToId(id); }}>{label}</button>
        ))}
        <button className="mobile-menu-sub" onClick={() => { setMenu(false); setPaletteOpen(true); }}>
          Поиск по всему сайту
        </button>
      </div>
    </>
  );
}
