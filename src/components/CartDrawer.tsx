import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { money } from "../data/products";
import { useShop } from "../lib/shop";
import { animate, dur, EXIT, prefersReducedMotion, STEP, useFlip } from "../lib/motion";

export default function CartDrawer() {
  const { drawer, closeDrawer, cart, cartTotal, removeFromCart, restoreToCart, checkout, toast } = useShop();
  const open = drawer === "cart";

  const panel = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);

  /* removing a line pulls the ones below it up from where they stood */
  useFlip(body, [cart.length]);

  /* the rows arrive one after another, then the footer */
  useEffect(() => {
    if (!open || prefersReducedMotion()) return;
    panel.current?.querySelectorAll<HTMLElement>(".row, .drawer-foot > *").forEach((el, i) => {
      el.animate(
        [{ opacity: 0, transform: "translateX(18px)" }, { opacity: 1, transform: "none" }],
        { duration: dur(420), easing: "cubic-bezier(.16,1,.3,1)", delay: dur(80) + dur(STEP) * i, fill: "backwards" }
      );
    });
  }, [open]);

  /* focus stays inside the panel while it is up */
  useEffect(() => {
    if (!open) return;
    const node = panel.current;
    if (!node) return;
    const last = document.activeElement as HTMLElement | null;
    node.querySelector<HTMLElement>("button")?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const f = [...node.querySelectorAll<HTMLElement>("button, a[href], input")];
      if (!f.length) return;
      const first = f[0], end = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { end.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === end) { first.focus(); e.preventDefault(); }
    };

    addEventListener("keydown", trap);
    return () => { removeEventListener("keydown", trap); last?.focus?.(); };
  }, [open]);

  /* the line collapses first, and only then leaves the cart */
  const drop = (e: React.MouseEvent<HTMLButtonElement>, index: number) => {
    const line = cart[index];
    const row = e.currentTarget.closest(".row");
    const undo = () => restoreToCart(index, line);

    const done = () => {
      removeFromCart(index);
      toast(`«${line.product.name}» убран из корзины`, undo);
    };

    const anim = animate(row,
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(28px)" }],
      EXIT, { easing: "cubic-bezier(.5,0,.75,0)" });

    if (anim) anim.finished.then(done, done); else done();
  };

  return (
    <aside className={"drawer" + (open ? " is-open" : "")} aria-label="Корзина" aria-hidden={!open}
           ref={panel}>
      <div className="drawer-head">
        <h3>Корзина</h3>
        <button className="icon-btn" onClick={closeDrawer} aria-label="Закрыть корзину">
          <X size={17} strokeWidth={1.4} />
        </button>
      </div>

      <div className="drawer-body" ref={body}>
        {cart.length === 0
          ? <p className="empty">Пока пусто. Выберите аромат из коллекции.</p>
          : cart.map((line, i) => (
              <div className="row" data-flip-id={line.uid} key={line.uid}>
                <div>
                  <div className="row-name">{line.product.name}</div>
                  <div className="row-sub">
                    {line.product.brand} — {line.ml} мл — {money(line.price)}
                  </div>
                </div>
                <button onClick={e => drop(e, i)}>Удалить</button>
              </div>
            ))}
      </div>

      <div className="drawer-foot">
        <div className="total"><span>Итого</span><b>{money(cartTotal)}</b></div>
        <button className="btn btn--solid btn--buy" onClick={checkout}>Оформить заказ</button>
      </div>
    </aside>
  );
}
