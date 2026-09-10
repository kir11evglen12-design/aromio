const ITEMS = ["Eau de Parfum", "Нишевая парфюмерия", "Доставка по России", "Dior · Louis Vuitton · Valentino", "Оригинал 100%"];

export default function Ticker({ dark }: { dark?: boolean }) {
  const row = ITEMS.map(t => <span key={t}>{t}<i /></span>);
  return (
    <div className={"ticker" + (dark ? " ticker--dark" : "")}>
      <div className="ticker-row">
        {[0, 1, 2, 3].map(i => <div key={i}>{row}</div>)}
      </div>
    </div>
  );
}
