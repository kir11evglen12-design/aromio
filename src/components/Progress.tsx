import { useEffect, useState } from "react";

/** Reading progress across the whole page. */
export default function Progress() {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      setPct(max > 0 ? (scrollY / max) * 100 : 0);
    };
    addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => removeEventListener("scroll", onScroll);
  }, []);

  return <div className="progress" style={{ width: pct + "%" }} aria-hidden />;
}
