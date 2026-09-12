import { useEffect, useState } from "react";

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
  } catch { /* приватное окно — просто берём тему по умолчанию */ }
  return "green";
};

/**
 * Переключатель темы, собранный как деталь из металла: три положения на
 * одной планке, выбранное вдавлено внутрь. Выбор живёт в localStorage,
 * поэтому переживает перезагрузку, но дальше браузера не уходит.
 */
export default function ThemeSwitch() {
  const [skin, setSkin] = useState<Skin>(read);

  useEffect(() => {
    document.documentElement.dataset.theme = skin;
    try { localStorage.setItem(KEY, skin); } catch { /* см. выше */ }
  }, [skin]);

  return (
    <div className="skin" role="radiogroup" aria-label="Тема оформления">
      {SKINS.map(s => (
        <button key={s.id} role="radio" aria-checked={skin === s.id}
                className={"skin-btn skin-btn--" + s.id + (skin === s.id ? " is-on" : "")}
                title={s.title} onClick={() => setSkin(s.id)}>
          <i aria-hidden />
          <span className="sr-only">{s.label}</span>
        </button>
      ))}
    </div>
  );
}
