import { useState } from "react";
import { Clock, X } from "lucide-react";
import { GUIDES } from "../data/guides";
import { revealFrom, useGsap } from "../lib/motion";

/**
 * The reading section: six guides written from general perfumery practice.
 * A card opens in place, so the section never sends the visitor away.
 */
export default function Journal() {
  const [open, setOpen] = useState<string | null>(null);
  const scope = useGsap(() => {
    revealFrom(".journal .section-head > div > *", { stagger: 0.07 });
    revealFrom(".jr-card", { stagger: 0.05, y: 26 });
  }, []);

  const guide = GUIDES.find(g => g.id === open);

  return (
    <section className="section journal" id="journal" ref={scope}>
      <div className="section-head">
        <div>
          <div className="eyebrow">Журнал</div>
          <h2 className="display">Как <em>носить</em><br />и как выбирать</h2>
        </div>
        <p className="lead">
          Шесть разборов из общей практики парфюмерии: концентрации, примерка,
          хранение, объём, слои и пирамида нот. Без мистики и без обещаний.
        </p>
      </div>

      <div className="jr-grid">
        {GUIDES.map(g => (
          <article className={"jr-card" + (open === g.id ? " is-open" : "")} key={g.id}>
            <button className="jr-head" onClick={() => setOpen(open === g.id ? null : g.id)}
                    aria-expanded={open === g.id}>
              <span className="jr-kicker">{g.kicker}</span>
              <h3 className="jr-title">{g.title}</h3>
              <p className="jr-lead">{g.lead}</p>
              <span className="jr-meta"><Clock size={13} strokeWidth={1.5} />{g.minutes} мин</span>
            </button>

            <ul className="jr-points">
              {g.points.map(pt => <li key={pt}>{pt}</li>)}
            </ul>
          </article>
        ))}
      </div>

      {guide && (
        <div className="jr-reader" role="dialog" aria-modal="true" aria-label={guide.title}>
          <div className="jr-reader-inner">
            <button className="pp-close" onClick={() => setOpen(null)} aria-label="Закрыть статью">
              <X size={17} strokeWidth={1.4} />
            </button>
            <div className="eyebrow">{guide.kicker} · {guide.minutes} мин чтения</div>
            <h3 className="display jr-reader-title">{guide.title}</h3>
            <p className="jr-reader-lead">{guide.lead}</p>
            {guide.body.map((para, i) => <p className="jr-para" key={i}>{para}</p>)}
            <ul className="jr-points jr-points--wide">
              {guide.points.map(pt => <li key={pt}>{pt}</li>)}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
