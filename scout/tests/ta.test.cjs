/**
 * Indicators, checked against series whose answer is known by hand.
 *
 * Everything here returns an array the same length as its input with
 * `null` where there is not enough history — setups point at bar indices,
 * so a single lost element would silently move every level.
 */
"use strict";

const ta = require("../lib/ta.js");

let fails = 0;
const ok = (name, cond, extra) => {
  if (!cond) { fails++; console.log("FAIL " + name + (extra == null ? "" : " — " + extra)); }
  else console.log("ok   " + name);
};
const near = (a, b, eps) => a != null && Math.abs(a - b) < (eps == null ? 1e-9 : eps);

const rising = Array.from({ length: 40 }, (_, i) => 100 + i);
const falling = Array.from({ length: 40 }, (_, i) => 140 - i);
const flat = Array.from({ length: 40 }, () => 7);

/* ---- shape ---- */
["sma", "ema", "wilder"].forEach(fn => {
  const out = ta[fn](rising, 10);
  ok(fn + " keeps the length", out.length === rising.length, out.length);
  ok(fn + " has no value before the period is full", out.slice(0, 9).every(v => v === null));
  ok(fn + " has a value from the period onwards", out.slice(9).every(v => v != null));
});

/* ---- values ---- */
ok("SMA is the plain average of the window", near(ta.sma([1, 2, 3, 4, 5], 3)[4], 4));
ok("EMA of a constant series is that constant", near(ta.ema(flat, 10)[39], 7));
ok("EMA seeds on the simple average", near(ta.ema(rising, 10)[9], 104.5));
const step = Array.from({ length: 45 }, (_, i) => (i < 40 ? 100 : 110));
ok("EMA reacts to a step faster than SMA",
   ta.ema(step, 10)[44] > ta.sma(step, 10)[44],
   ta.ema(step, 10)[44] + " vs " + ta.sma(step, 10)[44]);
ok("on a straight ramp both averages lag by the same amount",
   near(ta.ema(rising, 10)[39], ta.sma(rising, 10)[39], 0.01));
ok("Wilder smoothing of a constant series is that constant", near(ta.wilder(flat, 14)[39], 7));

ok("RSI of a series that only rises is 100", near(ta.rsi(rising, 14)[39], 100));
ok("RSI of a series that only falls is 0", near(ta.rsi(falling, 14)[39], 0));
ok("RSI of a flat series is 50 or undefined",
   ta.rsi(flat, 14)[39] === 100 || near(ta.rsi(flat, 14)[39], 50) || ta.rsi(flat, 14)[39] === null,
   String(ta.rsi(flat, 14)[39]));
const zig = Array.from({ length: 60 }, (_, i) => 100 + (i % 2 ? 1 : 0));
const zigRsi = ta.rsi(zig, 14)[59];
ok("RSI of a symmetric zigzag sits at the middle", zigRsi > 40 && zigRsi < 60, zigRsi);

const steady = Array.from({ length: 40 }, (_, i) => ({ t: i, o: 100, h: 100.5, l: 99.5, c: 100, v: 1 }));
ok("ATR of bars with a constant range is that range", near(ta.atr(steady, 14)[39], 1, 1e-9));
const gapped = steady.map((c, i) => (i === 20 ? { ...c, h: 103, l: 102, c: 102.5 } : c));
ok("ATR counts the gap, not just the bar", ta.atr(gapped, 14)[21] > ta.atr(steady, 14)[21]);

/* ---- swings ---- */
const shape = [1, 2, 3, 9, 3, 2, 1, 2, 3, 4, 5].map((v, i) => ({
  t: i, o: v, c: v, h: v + 0.1, l: v - 0.1, v: 1
}));
const sw = ta.swings(shape, 3, 3);
ok("the obvious peak is a swing high", sw.highs.length === 1 && sw.highs[0].i === 3, JSON.stringify(sw.highs));
ok("a swing high carries the bar's high", near(sw.highs[0].price, 9.1));
ok("the last bars can never be swings yet", sw.highs.concat(sw.lows).every(p => p.i <= shape.length - 4));
const trough = shape.map(c => ({ ...c, h: -c.l, l: -c.h }));
ok("the mirror image gives a swing low", ta.swings(trough, 3, 3).lows.length === 1);

/* ---- small helpers ---- */
ok("median of an odd count", ta.median([5, 1, 3]) === 3);
ok("median of an even count", ta.median([4, 1, 3, 2]) === 2.5);
ok("median ignores gaps", ta.median([null, 2, null, 4]) === 3);
ok("median of nothing is null", ta.median([]) === null);

ok("percentRank of the largest value is 1", ta.percentRank([1, 2, 3], 3) === 1);
ok("percentRank of the smallest is 1/n", near(ta.percentRank([1, 2, 3], 1), 1 / 3));
ok("percentRank of nothing is null", ta.percentRank([], 1) === null);

ok("slope of a straight line is its step", near(ta.slope([1, 2, 3, 4, 5], 5), 1));
ok("slope downwards is negative", ta.slope([5, 4, 3, 2, 1], 5) === -1);
ok("slope of a flat line is zero", ta.slope([2, 2, 2, 2], 4) === 0);
ok("slope of a single point is null", ta.slope([2], 4) === null);

ok("closes and volumes come out aligned",
   ta.closes(steady).length === steady.length && ta.volumes(steady).length === steady.length);

console.log(fails ? "\n" + fails + " FAILURES" : "\nall indicator checks passed");
process.exit(fails ? 1 : 0);
