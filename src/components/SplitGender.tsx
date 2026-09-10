import { plural } from "../lib/auth";
import { byId, products } from "../data/products";
import { useShop } from "../lib/shop";
import Plate from "./Plate";
import { scrollToId } from "./Header";

const PANELS = [
  { cat: "men" as const, label: "Мужские", eyebrow: "Для него", bottle: 1, dark: false },
  { cat: "women" as const, label: "Женские", eyebrow: "Для неё", bottle: 3, dark: true }
];

export default function SplitGender() {
  const { setCategory } = useShop();

  const go = (cat: "men" | "women") => { setCategory(cat); scrollToId("collection"); };

  return (
    <section className="split" id="gender">
      {PANELS.map(p => {
        const count = products.filter(x => x.category === p.cat).length;
        return (
          <div
            key={p.cat}
            className={"split-panel" + (p.dark ? " split-panel--dark" : "")}
            role="button"
            tabIndex={0}
            aria-label={`${p.label} ароматы`}
            onClick={() => go(p.cat)}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(p.cat); } }}
          >
            <div className="split-bg" aria-hidden />
            <div className="split-inner">
              <div className="eyebrow">{p.eyebrow}</div>
              <Plate product={byId(p.bottle)}
                      style={{ ["--bw" as string]: "74px", ["--bh" as string]: "132px" }} />
              <div className="split-word">{p.label}</div>
              <div className="split-count">{count} {plural(count, "аромат", "аромата", "ароматов")}</div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
