import { useEffect, useRef, useState } from "react";
import { QUOTES } from "../data/quotes";
import { FRENCH } from "../data/french";
import { revealFrom, useGsap } from "../lib/motion";

/**
 * Французские строки о запахе. Листаются вручную — сами по себе они
 * никуда не едут: текст, который уезжает, пока его читают, читать
 * невозможно.
 */
export default function Quotes() {
  const [i, setI] = useState(0);
  const q = QUOTES[i];
  const body = useRef<HTMLDivElement>(null);

  const scope = useGsap(() => { revealFrom(".qt-card, .qt-dots", { y: 24, stagger: 0.08 }); }, []);

  /* при смене строки текст проявляется заново — иначе подмена букв на
     месте читается как опечатка, а не как новая цитата */
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: "cubic-bezier(.16,1,.3,1)" });
  }, [i]);

  return (
    <section className="section quotes" id="quotes" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Слова о запахе</div>
          <h2 className="display">Les parfums<br /><em>de Baudelaire</em></h2>
        </div>
        <p className="lead">
          О запахе по-французски писали точнее всего. Здесь только те строки, за которые
          мы можем назвать стихотворение, сборник и год.
        </p>
      </div>

      <figure className="qt-card">
        <div className="qt-body" ref={body}>
          <blockquote className="qt-fr" lang="fr">
            {q.fr.split("\n").map((line, n) => <span key={n}>{line}</span>)}
          </blockquote>

          <p className="qt-ru">
            {q.ru.split("\n").map((line, n) => <span key={n}>{line}</span>)}
          </p>

          <figcaption className="qt-meta">
            <b>{q.author}</b>
            <span lang="fr">{q.source}</span>
            <i>{q.year} · подстрочник витрины</i>
          </figcaption>
        </div>
      </figure>

      <div className="qt-dots" role="group" aria-label="Выбрать цитату">
        {QUOTES.map((item, n) => (
          <button key={item.source} className={"qt-dot" + (n === i ? " is-on" : "")}
                  aria-current={n === i}
                  aria-label={`Цитата ${n + 1} из ${QUOTES.length}: ${item.source}`}
                  onClick={() => setI(n)} />
        ))}
      </div>

      {/* словарь: французское слово, примерное чтение, перевод */}
      <div className="fr-head">
        <h3 className="fr-title">Словарь витрины</h3>
        <p className="fr-note">
          Парфюмерный язык французский, и половина слов на сайте — калька с него.
          Чтение подписано как примерное: точную французскую фонетику русскими
          буквами не записать.
        </p>
      </div>

      <div className="fr-groups">
        {FRENCH.map(g => (
          <section className={"fr-group fr-group--" + g.tone} key={g.title}>
            <h4 className="fr-group-title">{g.title}</h4>

            <ul className="fr-list">
              {g.words.map(w => (
                <li className="fr-word" key={w.fr}>
                  <b lang="fr">{w.fr}</b>
                  <em>{w.say}</em>
                  <span>{w.ru}</span>
                  {w.note && <i>{w.note}</i>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
