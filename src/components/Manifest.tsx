import { gsap, prefersReducedMotion, revealFrom, useGsap } from "../lib/motion";

const TEXT = "Мы не создаём запахи. Мы создаём память, которая остаётся с вами дольше, чем вечер.";

/** Words brighten one by one as the section crosses the viewport. */
export default function Manifest() {
  const words = TEXT.split(" ");

  const scope = useGsap(() => {
    if (prefersReducedMotion()) return;
    revealFrom(".stat", { stagger: 0.1 });
    gsap.fromTo(".manifest-text .w",
      { opacity: 0.16 },
      {
        opacity: 1, ease: "none", stagger: 1,
        scrollTrigger: { trigger: ".manifest", start: "top 75%", end: "bottom 75%", scrub: 0.5 }
      }
    );
  }, []);

  return (
    <section className="section section--dark manifest" id="manifest" ref={scope}>
      <div className="eyebrow">Философия дома</div>
      <p className="manifest-text">
        {words.map((w, i) => (
          <span className="w" key={i}>{w === "память," ? <em>память,</em> : w}{" "}</span>
        ))}
      </p>

      <div className="stats">
        <div className="stat"><b>12</b><span>Ароматов в витрине</span></div>
        <div className="stat"><b>24</b><span>Часа стойкости</span></div>
        <div className="stat"><b>100%</b><span>Оригинальность</span></div>
      </div>
    </section>
  );
}
