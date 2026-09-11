const ITEMS: [string, string][] = [
  ["Новые запахи на каждый день", ""],
  ["Eau de Parfum", "парфюмерная вода"],
  ["Sillage", "шлейф"],
  ["Dry-down", "высыхание"],
  ["Nez", "парфюмер"],
  ["Chypre", "шипр"],
  ["Fougère", "фужер"],
  ["Absolue", "абсолю"],
  ["Flacon", "флакон"],
  ["Macération", "мацерация"],
  ["Grasse", "столица парфюмерии"]
];

/**
 * The running line doubles as a lesson: every French term carries its
 * Russian meaning, so the marquee is readable rather than decorative.
 */
export default function Ticker({ dark }: { dark?: boolean }) {
  const row = ITEMS.map(([fr, ru]) => (
    <span key={fr}><b>{fr}</b>{ru && <em>{ru}</em>}<i /></span>
  ));

  return (
    <div className={"ticker" + (dark ? " ticker--dark" : "")}>
      <div className="ticker-row">
        {[0, 1, 2, 3].map(i => <div key={i}>{row}</div>)}
      </div>
    </div>
  );
}
