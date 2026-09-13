import { useEffect, useState } from "react";
import { flushSync } from "react-dom";

export type Skin = "white" | "green" | "black";

const SKINS: { id: Skin; label: string; title: string }[] = [
  { id: "white", label: "Белый", title: "Белая тема" },
  { id: "green", label: "Зелёный", title: "Зелёная тема" },
  { id: "black", label: "Чёрный", title: "Чёрная тема" }
];

const KEY = "aromio:skin";

const read = (): Skin => {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "white" || v === "green" || v === "black") return v;
  } catch { /* приватное окно — берём тему по умолчанию */ }
  return "green";
};

const reduced = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Переключатель темы — деталь из металла: планка со шлифовкой, три
 * гнезда, выбранное вдавлено внутрь.
 *
 * Сама смена не мигает, а разливается: новая тема выходит кругом из той
 * кнопки, которую нажали, и накрывает страницу. Делает это View
 * Transitions — браузер снимает кадр «до», мы рисуем поверх круг
 * растущего радиуса. Где такого API нет, тема просто меняется: это не
 * украшение, без которого что-то сломается.
 */
export default function ThemeSwitch() {
  const [skin, setSkin] = useState<Skin>(read);

  useEffect(() => {
    document.documentElement.dataset.theme = skin;
    try { localStorage.setItem(KEY, skin); } catch { /* см. выше */ }
  }, [skin]);

  const pick = (next: Skin, el: HTMLElement) => {
    if (next === skin) return;

    /* API есть не во всех браузерах — отсюда и проверка, и приведение */
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const start = doc.startViewTransition?.bind(doc);
    if (!start || reduced()) { setSkin(next); return; }

    /* центр круга — центр нажатой кнопки, радиус — до дальнего угла */
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    const root = document.documentElement;
    root.style.setProperty("--vt-x", x + "px");
    root.style.setProperty("--vt-y", y + "px");
    root.style.setProperty("--vt-r", far + "px");
    root.classList.add("vt-skin");

    /* Внутри колбэка DOM должен измениться СИНХРОННО: браузер снимает
       кадр «после» сразу по возврату. Обычный setState отложен, поэтому
       на момент снимка тема была ещё старой и переход выходил пустым.
       Атрибут пишем руками — от него и зависят все цвета, — а состояние
       кнопки досылаем flushSync, чтобы вдавленное гнездо переехало тем
       же кадром. */
    const t = start(() => {
      root.dataset.theme = next;
      flushSync(() => setSkin(next));
    });
    t.finished.finally(() => root.classList.remove("vt-skin"));
  };

  return (
    <div className="skin" role="radiogroup" aria-label="Тема оформления">
      {SKINS.map(s => (
        <button key={s.id} role="radio" aria-checked={skin === s.id}
                className={"skin-btn skin-btn--" + s.id + (skin === s.id ? " is-on" : "")}
                title={s.title}
                onClick={e => pick(s.id, e.currentTarget)}>
          <i aria-hidden />
          <span className="sr-only">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
