import { useState } from "react";
import { X } from "lucide-react";
import { useShop } from "../lib/shop";
import { canHash, derive, loadUsers, randomSalt } from "../lib/auth";
import type { User } from "../lib/auth";

interface Errors { name?: string; email?: string; password?: string }

export default function AuthDrawer() {
  const {
    drawer, closeDrawer, authMode, setAuthMode, authIntro,
    setUser, openProfile, toast
  } = useShop();

  const open = drawer === "auth";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const next: Errors = {};

    if (authMode === "register" && name.length < 2) next.name = "Укажите имя — минимум 2 символа";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) next.email = "Введите корректный email";
    if (form.password.length < 8) next.password = "Пароль — минимум 8 символов";

    if (Object.keys(next).length) { setErrors(next); return; }

    if (!canHash()) {
      setErrors({ password: "Браузер не даёт безопасно захешировать пароль — откройте сайт по https" });
      return;
    }

    setErrors({});
    setBusy(true);

    try {
      const users = loadUsers();
      const found = users.find(u => u.email === email);

      if (authMode === "register") {
        if (found) { setErrors({ email: "Этот email уже зарегистрирован" }); return; }

        const salt = randomSalt();
        const user: User = {
          email, name, salt,
          hash: await derive(form.password, salt),
          createdAt: new Date().toISOString(),
          phone: "", city: "", address: "",
          orders: [], favorites: [], shelf: [], reminders: []
        };
        setUser(user);
        toast(`Добро пожаловать, ${user.name}!`);
      } else {
        if (!found || (await derive(form.password, found.salt)) !== found.hash) {
          setErrors({ password: "Неверный email или пароль" });
          return;
        }
        setUser({
          ...found,
          orders: found.orders ?? [],
          favorites: found.favorites ?? [],
          shelf: found.shelf ?? [],
          reminders: found.reminders ?? []
        });
        toast(`С возвращением, ${found.name}!`);
      }

      setForm({ name: "", email: "", password: "" });
      closeDrawer();
      openProfile();
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (mode: "login" | "register") => { setAuthMode(mode); setErrors({}); };

  return (
    <aside className={"drawer" + (open ? " is-open" : "")} aria-label="Вход и регистрация" aria-hidden={!open} inert={!open}>
      <div className="drawer-head">
        <h3>Личный кабинет</h3>
        <button className="icon-btn" onClick={closeDrawer} aria-label="Закрыть">
          <X size={17} strokeWidth={1.4} />
        </button>
      </div>

      <div className="drawer-body">
        <div className="auth-tabs" role="tablist">
          {(["login", "register"] as const).map(m => (
            <button key={m} role="tab" aria-selected={authMode === m}
                    className={"auth-tab" + (authMode === m ? " is-active" : "")}
                    onClick={() => switchMode(m)}>
              {m === "login" ? "Вход" : "Регистрация"}
            </button>
          ))}
        </div>

        <p className="auth-intro">{authIntro}</p>

        <form onSubmit={submit} noValidate>
          {authMode === "register" && (
            <div className={"field" + (errors.name ? " has-error" : "")}>
              <label htmlFor="authName">Имя</label>
              <input id="authName" value={form.name} onChange={set("name")}
                     autoComplete="given-name" placeholder="Как к вам обращаться"
                     aria-invalid={!!errors.name} aria-describedby="errName" />
              <span className="field-error" id="errName" role="alert">{errors.name}</span>
            </div>
          )}

          <div className={"field" + (errors.email ? " has-error" : "")}>
            <label htmlFor="authEmail">Email</label>
            <input id="authEmail" type="email" value={form.email} onChange={set("email")}
                   autoComplete="email" placeholder="you@example.com"
                   aria-invalid={!!errors.email} aria-describedby="errEmail" />
            <span className="field-error" id="errEmail" role="alert">{errors.email}</span>
          </div>

          <div className={"field" + (errors.password ? " has-error" : "")}>
            <label htmlFor="authPass">Пароль</label>
            <input id="authPass" type="password" value={form.password} onChange={set("password")}
                   autoComplete={authMode === "login" ? "current-password" : "new-password"}
                   placeholder="Минимум 8 символов"
                   aria-invalid={!!errors.password} aria-describedby="errPass" />
            <span className="field-error" id="errPass" role="alert">{errors.password}</span>
          </div>

          <button className={"btn btn--solid auth-submit" + (busy ? " is-busy" : "")} type="submit">
            {busy
              ? (authMode === "login" ? "Проверяем…" : "Создаём…")
              : (authMode === "login" ? "Войти" : "Создать аккаунт")}
          </button>
        </form>

        <p className="auth-note">
          Демонстрационный режим: аккаунт хранится только в этом браузере, пароль сохраняется
          в виде PBKDF2-хеша с солью. Для реального магазина нужен серверный вход.
        </p>
      </div>
    </aside>
  );
}
