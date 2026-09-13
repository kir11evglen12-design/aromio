import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { fromPrice, money, products } from "../data/products";
import { useShop } from "../lib/shop";
import { formatOrderDate, initials, memberSince, plural } from "../lib/auth";
import { scrollToId } from "./Header";

type Tab = "orders" | "favorites" | "shelf" | "reminders" | "data";

const TABS: [Tab, string][] = [
  ["orders", "Заказы"],
  ["favorites", "Избранное"],
  ["shelf", "Моя полка"],
  ["reminders", "Напоминания"],
  ["data", "Данные"]
];

/** how long a bottle has been open, in whole days */
const daysOpen = (iso: string): number =>
  Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));

export default function ProfilePage() {
  const {
    profileOpen, closeProfile, user, saveProfile, signOut, openProduct, toast,
    shelf, removeFromShelf, reminders, addReminder, toggleReminder, removeReminder
  } = useShop();
  const [tab, setTab] = useState<Tab>("orders");
  const [form, setForm] = useState({ name: "", phone: "", city: "", address: "" });
  const [rem, setRem] = useState({ text: "", due: "" });

  useEffect(() => {
    if (user) setForm({ name: user.name, phone: user.phone, city: user.city, address: user.address });
  }, [user]);

  if (!user) {
    return <div className="product-page" aria-hidden="true" />;
  }

  const spent = user.orders.reduce((s, o) => s + o.total, 0);
  const favs = products.filter(p => user.favorites.includes(p.id));

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name.trim().length < 2) { toast("Имя — минимум 2 символа"); return; }
    saveProfile({
      name: form.name.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      address: form.address.trim()
    });
  };

  return (
    <div className={"product-page" + (profileOpen ? " is-open" : "")} role="dialog" aria-modal="true"
         aria-label="Личный кабинет" aria-hidden={!profileOpen} inert={!profileOpen}>
      <button className="pp-close" onClick={closeProfile} aria-label="Закрыть кабинет">
        <X size={17} strokeWidth={1.4} />
      </button>

      <div className="pp-inner profile-inner">
        <div className="profile-head pp-anim">
          <span className="avatar">{initials(user)}</span>
          <div>
            <div className="eyebrow">В AROMIO с {memberSince(user.createdAt)}</div>
            <h2 className="profile-name">{user.name}</h2>
            <div className="profile-mail">{user.email}</div>
          </div>
        </div>

        <div className="profile-stats pp-anim">
          <div><b>{user.orders.length}</b><span>Заказов</span></div>
          <div><b>{money(spent)}</b><span>На сумму</span></div>
          <div><b>{user.favorites.length}</b><span>В избранном</span></div>
        </div>

        <div className="profile-tabs pp-anim" role="tablist">
          {TABS.map(([key, label]) => (
            <button key={key} role="tab" aria-selected={tab === key}
                    className={"profile-tab" + (tab === key ? " is-active" : "")}
                    onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="pp-anim">
          {tab === "orders" && (
            user.orders.length === 0
              ? <p className="empty">
                  Заказов пока нет.{" "}
                  <button className="link-inline"
                          onClick={() => { closeProfile(); scrollToId("collection"); }}>
                    Перейти в каталог
                  </button>
                </p>
              : user.orders.map(o => (
                  <div className="order" key={o.id}>
                    <div className="order-top">
                      <span className="order-id">{o.id}</span>
                      <span className="order-date">{formatOrderDate(o.date)}</span>
                    </div>
                    <div className="order-items">
                      {o.items.map(i => `${i.brand} ${i.name}`).join(" · ")}
                    </div>
                    <div className="order-foot">
                      <span className="status"><i />{o.status}</span>
                      <span className="order-sum">{money(o.total)}</span>
                    </div>
                  </div>
                ))
          )}

          {tab === "favorites" && (
            favs.length === 0
              ? <p className="empty">В избранном пусто. Нажмите на сердце у любого аромата.</p>
              : <div className="fav-grid">
                  {favs.map(p => (
                    <button className="fav-card" key={p.id}
                            onClick={() => { closeProfile(); openProduct(p.id); }}>
                      <span>{p.brand}</span>
                      <b>{p.name}</b>
                      <em>от {money(fromPrice(p))}</em>
                    </button>
                  ))}
                </div>
          )}

          {tab === "shelf" && (
            shelf.length === 0
              ? <p className="empty">
                  Полка пуста. Отметьте на карточке аромата, что флакон у вас есть —
                  и здесь появится, сколько дней он открыт.
                </p>
              : <div className="shelf-list">
                  {shelf.map(item => {
                    const p = products.find(x => x.id === item.id);
                    if (!p) return null;
                    const d = daysOpen(item.opened);
                    return (
                      <div className="shelf-row" key={item.id}>
                        <i className="shelf-dot" style={{ background: p.tint }} aria-hidden />
                        <div className="shelf-main">
                          <b>{p.brand} {p.name}</b>
                          <span>{item.ml} мл · открыт {d} {plural(d, "день", "дня", "дней")}</span>
                        </div>
                        <button className="link-quiet" onClick={() => removeFromShelf(item.id)}>Убрать</button>
                      </div>
                    );
                  })}
                  <p className="shelf-note">
                    Початый флакон стареет быстрее полного: кислород попадает внутрь при каждом
                    нажатии. Дата открытия нужна, чтобы это было видно.
                  </p>
                </div>
          )}

          {tab === "reminders" && (
            <div className="rem-wrap">
              <form
                className="rem-form"
                onSubmit={e => {
                  e.preventDefault();
                  if (rem.text.trim().length < 3) { toast("Опишите напоминание"); return; }
                  if (!rem.due) { toast("Выберите дату"); return; }
                  addReminder(rem.text.trim(), rem.due);
                  setRem({ text: "", due: "" });
                }}
              >
                <div className="field">
                  <label htmlFor="remText">Напомнить о чём</label>
                  <input id="remText" value={rem.text} placeholder="Дозаказать Sauvage 100 мл"
                         onChange={e => setRem(r => ({ ...r, text: e.target.value }))} />
                </div>
                <div className="field">
                  <label htmlFor="remDue">Когда</label>
                  <input id="remDue" type="date" value={rem.due}
                         onChange={e => setRem(r => ({ ...r, due: e.target.value }))} />
                </div>
                <button className="btn btn--solid" type="submit">Сохранить</button>
              </form>

              {reminders.length === 0
                ? <p className="empty">
                    Напоминаний нет. Обычно их ставят на дозаказ флакона или на то,
                    чтобы вернуться к образцу через неделю носки.
                  </p>
                : <ul className="rem-list">
                    {reminders.map(r => {
                      const late = !r.done && new Date(r.due) < new Date(new Date().toDateString());
                      return (
                        <li className={"rem-item" + (r.done ? " is-done" : "") + (late ? " is-late" : "")} key={r.id}>
                          <button className="rem-check" onClick={() => toggleReminder(r.id)}
                                  aria-pressed={r.done} aria-label="Отметить выполненным">
                            {r.done ? "✓" : ""}
                          </button>
                          <div className="rem-main">
                            <b>{r.text}</b>
                            <span>{new Date(r.due).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}{late ? " · срок прошёл" : ""}</span>
                          </div>
                          <button className="link-quiet" onClick={() => removeReminder(r.id)}>Удалить</button>
                        </li>
                      );
                    })}
                  </ul>}
            </div>
          )}

          {tab === "data" && (
            <form className="profile-form" onSubmit={submit}>
              <div className="field">
                <label htmlFor="pfName">Имя</label>
                <input id="pfName" value={form.name} onChange={set("name")} autoComplete="name" />
              </div>
              <div className="field">
                <label htmlFor="pfPhone">Телефон</label>
                <input id="pfPhone" type="tel" value={form.phone} onChange={set("phone")}
                       placeholder="+7 900 000 00 00" autoComplete="tel" />
              </div>
              <div className="field">
                <label htmlFor="pfCity">Город</label>
                <input id="pfCity" value={form.city} onChange={set("city")}
                       placeholder="Москва" autoComplete="address-level2" />
              </div>
              <div className="field">
                <label htmlFor="pfAddress">Адрес доставки</label>
                <input id="pfAddress" value={form.address} onChange={set("address")}
                       placeholder="Улица, дом, квартира" autoComplete="street-address" />
              </div>
              <div className="profile-actions">
                <button className="btn btn--solid" type="submit">Сохранить</button>
                <button className="link-quiet" type="button" onClick={signOut}>Выйти из аккаунта</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
