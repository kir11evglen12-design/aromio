import { useMemo, useState } from "react";
import { LEXICON, LEX_GROUPS } from "../data/lexicon";
import { revealFrom, useGsap } from "../lib/motion";

/**
 * The French lexicon. Perfumery speaks French, so every term keeps its
 * original spelling, a Russian pronunciation and a plain explanation.
 */
export default function Lexicon() {
  const [group, setGroup] = useState<string>("Все");
  const [q, setQ] = useState("");

  const scope = useGsap(() => {
    revealFrom(".lexicon .section-head > div > *", { stagger: 0.07 });
  }, []);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return LEXICON.filter(t =>
      (group === "Все" || t.group === group) &&
      (!s || t.fr.toLowerCase().includes(s) || t.ru.toLowerCase().includes(s) || t.what.toLowerCase().includes(s))
    );
  }, [group, q]);

  return (
    <section className="section lexicon" id="lexicon" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Lexique</div>
          <h2 className="display">Язык, на котором<br /><em>говорят духи</em></h2>
        </div>
        <p className="lead">
          Двадцать шесть слов, без которых описания ароматов читаются как шифр.
          Оригинал, произношение и объяснение — по-русски.
        </p>
      </div>

      <div className="lx-controls">
        <div className="filters" role="group" aria-label="Раздел лексикона">
          {["Все", ...LEX_GROUPS].map(g => (
            <button key={g} className={"filter" + (group === g ? " is-active" : "")}
                    onClick={() => setGroup(g)}>{g}</button>
          ))}
        </div>
        <label className="lx-search">
          <span className="sr-only">Поиск по лексикону</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="sillage, шлейф, Грасс…" />
        </label>
      </div>

      <div className="lx-grid">
        {list.map(t => (
          <article className="lx-card" key={t.fr}>
            <div className="lx-top">
              <h3 className="lx-fr">{t.fr}</h3>
              <span className="lx-say">[{t.say}]</span>
            </div>
            <div className="lx-ru">{t.ru}</div>
            <p className="lx-what">{t.what}</p>
            <span className="lx-group">{t.group}</span>
          </article>
        ))}
        {list.length === 0 && <p className="empty">Такого слова в лексиконе пока нет.</p>}
      </div>
    </section>
  );
}
