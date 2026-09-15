/**
 * Detectors, against series built to contain exactly one pattern.
 *
 * Two claims are worth testing and only these two: that a detector finds
 * the thing it is named after, and that it keeps quiet when the thing is
 * not there. The second matters more — a scanner that fires on noise
 * costs money, one that misses a setup costs nothing but the setup.
 */
"use strict";

const setups = require("../lib/setups.js");
const F = require("./fixtures.js");

let fails = 0;
const ok = (name, cond, extra) => {
  if (!cond) { fails++; console.log("FAIL " + name + (extra == null ? "" : " — " + extra)); }
  else console.log("ok   " + name);
};

const brief = s => s.kind + " " + s.side + " вход " + s.entry.toFixed(2) +
  " стоп " + s.stop.toFixed(2) + " R:R " + s.rr + " очки " + s.score;

/* ---------- every fixture holds the one pattern it is named after ---------- */

const CASES = [
  { fixture: "breakRetestLong",   kind: "break-retest",   side: "long" },
  { fixture: "trendPullbackLong", kind: "trend-pullback", side: "long" },
  { fixture: "squeezeBreakUp",    kind: "squeeze-break",  side: "long" },
  { fixture: "rsiDivergenceLong", kind: "rsi-divergence", side: "long" }
];

const found = {};

CASES.forEach(({ fixture, kind, side }) => {
  const f = F[fixture]();
  const list = setups.detect(f.symbol, f.tf, f.candles);
  const hit = list.find(s => s.kind === kind);
  found[kind] = hit;

  ok(fixture + ": " + kind + " found", !!hit, list.length ? list.map(brief).join("; ") : "nothing");
  if (!hit) return;
  ok(fixture + ": and it is the only thing found", list.length === 1, list.map(s => s.kind).join(", "));
  ok(fixture + ": the side is " + side, hit.side === side, hit.side);
});

/* ---------- and the same pattern upside down is the short side ---------- */

CASES.forEach(({ fixture, kind }) => {
  const f = F.mirror(F[fixture](), "SHORTUSDT");
  const list = setups.detect(f.symbol, f.tf, f.candles);
  const hit = list.find(s => s.kind === kind);
  ok(fixture + " mirrored: " + kind + " found short", !!hit && hit.side === "short",
     list.length ? list.map(brief).join("; ") : "nothing");
  if (hit) {
    ok(fixture + " mirrored: the R:R is the same both ways",
       Math.abs(hit.rr - found[kind].rr) < 0.05, hit.rr + " vs " + found[kind].rr);
  }
});

/* ---------- what a setup must never say ---------- */

Object.keys(found).forEach(kind => {
  const s = found[kind];
  if (!s) return;
  const dir = s.side === "long" ? 1 : -1;
  const n = v => typeof v === "number" && isFinite(v);

  ok(kind + ": the stop is on the losing side of the entry", (s.entry - s.stop) * dir > 0);
  ok(kind + ": the targets are on the winning side", s.targets.every(t => (t - s.entry) * dir > 0));
  ok(kind + ": the targets are in order",
     s.targets.every((t, i) => i === 0 || (t - s.targets[i - 1]) * dir > 0), s.targets.join(" "));
  ok(kind + ": R:R clears the minimum", s.rr >= setups.MIN_RR, String(s.rr));
  ok(kind + ": the first target has its own ratio", n(s.rr1) && s.rr1 > 0 && s.rr1 <= s.rr, String(s.rr1));
  ok(kind + ": the risk is a real percentage", n(s.riskPct) && s.riskPct > 0 && s.riskPct < 50, String(s.riskPct));
  ok(kind + ": the score is a score", n(s.score) && s.score >= 0 && s.score <= 100, String(s.score));
  ok(kind + ": every number is a number",
     [s.entry, s.stop, s.price, s.atr, s.at].concat(s.targets).every(n));
  ok(kind + ": it says why", Array.isArray(s.reasons) && s.reasons.length >= 2);
  ok(kind + ": the id names the bar it was found on",
     s.id === s.symbol + "|" + s.tf + "|" + s.kind + "|" + s.at, s.id);
  ok(kind + ": the price is the close of that bar", s.price === s.entry);
});

/* ---------- the regressions that made these fixtures worth having ---------- */

{
  /* The thrust that breaks a level leaves a fresher swing high behind it.
     Reading only the newest pivot found that one, saw nothing above it,
     and gave up — the pattern was never looked at. */
  const s = found["break-retest"];
  ok("break-retest uses the level that was broken, not the newest pivot",
     s && Math.abs(s.levels["уровень"] - 100.9) < 0.05, s && JSON.stringify(s.levels));
}
{
  /* A range breakout stopped at the far side of the range pays the height
     of the range to make the height of the range back. */
  const s = found["squeeze-break"];
  const risk = s && s.entry - s.stop;
  ok("squeeze-break risks less than the range it broke out of",
     s && risk < s.levels["высота"], s && risk + " vs " + s.levels["высота"]);
}
{
  const f = F.flat();
  const list = setups.detect(f.symbol, f.tf, f.candles);
  ok("nothing is a trend pullback in a market that has not moved",
     !list.some(s => s.kind === "trend-pullback"), list.map(brief).join("; "));
}

/* ---------- silence ---------- */

[["flat", "a market that goes nowhere"],
 ["straightUp", "a line straight up with no pullback"],
 ["straightDown", "a line straight down"]].forEach(([fixture, what]) => {
  const f = F[fixture]();
  const list = setups.detect(f.symbol, f.tf, f.candles);
  ok("silent on " + what, list.length === 0, list.map(brief).join("; "));
});

/* ---------- detect() itself ---------- */

{
  const f = F.breakRetestLong();
  ok("too little history means no opinion",
     setups.detect(f.symbol, f.tf, f.candles.slice(-40)).length === 0);
  ok("no candles at all is not a crash", setups.detect("X", "1h", null).length === 0);

  const a = setups.detect(f.symbol, f.tf, f.candles)[0];
  const b = setups.detect(f.symbol, f.tf, f.candles)[0];
  ok("the same candles give the same setup", JSON.stringify(a) === JSON.stringify(b));

  const agree = setups.detect(f.symbol, f.tf, f.candles, { htfTrend: "up" })[0];
  const against = setups.detect(f.symbol, f.tf, f.candles, { htfTrend: "down" })[0];
  ok("a higher timeframe pointing the same way scores higher",
     agree.score > a.score && against.score < a.score,
     against.score + " < " + a.score + " < " + agree.score);
  ok("and it says so", agree.reasons.some(r => /старший таймфрейм/.test(r)));

  ok("a minimum score filters the list out",
     setups.detect(f.symbol, f.tf, f.candles, { minScore: 101 }).length === 0);
}

/* ---------- trendOf ---------- */

ok("trendOf calls a rising market up", setups.trendOf(F.straightUp().candles) === "up");
ok("trendOf calls a falling market down", setups.trendOf(F.straightDown().candles) === "down");
ok("trendOf calls a flat market flat", setups.trendOf(F.flat().candles) === "flat");
ok("trendOf has no opinion without history", setups.trendOf([]) === "flat");

/* ---------- build() rejects what it should ---------- */

{
  const f = F.breakRetestLong();
  const ctx = setups.context(f.symbol, f.tf, f.candles, null);
  const base = { kind: "test", title: "тест", side: "long", reasons: ["раз", "два"] };
  const price = f.candles[f.candles.length - 1].c;

  ok("a stop above the entry on a long is refused",
     setups.build(ctx, { ...base, entry: price, stop: price + 1 }) === null);
  ok("a stop a mile away is refused",
     setups.build(ctx, { ...base, entry: price, stop: price - ctx.atr[ctx.last] * 20 }) === null);
  ok("a stop inside the noise is refused",
     setups.build(ctx, { ...base, entry: price, stop: price - ctx.atr[ctx.last] * 0.01 }) === null);
  ok("a target that does not pay for the risk is refused",
     setups.build(ctx, {
       ...base, entry: price, stop: price - 1, targets: [price + 0.5]
     }) === null);
  ok("a sound idea survives",
     setups.build(ctx, { ...base, entry: price, stop: price - 1 }) !== null);
}

console.log(fails ? "\n" + fails + " FAILURES" : "\nall setup checks passed");
process.exit(fails ? 1 : 0);
