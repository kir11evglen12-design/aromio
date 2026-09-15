/**
 * Price series with patterns put there on purpose.
 *
 * A detector is only worth anything if it fires on the thing it is named
 * after and stays quiet otherwise. Real charts cannot prove that — you
 * never know what else was in the window. These series are built bar by
 * bar, so every fixture knows exactly which pattern it contains and which
 * ones it does not.
 *
 * Levels that have to line up with an indicator (a wick that just touches
 * EMA21, a low that sits under the previous one by a third of an ATR) are
 * computed from the bars already pushed, not guessed.
 */
"use strict";

const ta = require("../lib/ta.js");

const HOUR = 3600e3;
const START = Date.UTC(2026, 0, 1);

/** Small deterministic generator — same fixtures on every machine. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Appends one bar. The open is the previous close, so the series has no
 * gaps; `up` and `down` place the wicks explicitly when a fixture needs a
 * high or a low at an exact price.
 */
function bar(candles, close, opts) {
  opts = opts || {};
  const prev = candles.length ? candles[candles.length - 1] : null;
  const open = prev ? prev.c : close;
  const wick = opts.wick == null ? 0.15 : opts.wick;
  const top = Math.max(open, close), bottom = Math.min(open, close);
  /* The wick runs long in the direction of the move and short against it.
     Without that, a bar and the one after a turn share the same high and
     the pivot rule — strictly lower on both sides — never sees a swing. */
  const rising = close >= open;
  const candle = {
    t: prev ? prev.t + HOUR : START,
    o: round(open),
    h: round(opts.high == null ? top + wick * (rising ? 1 : 0.35) : opts.high),
    l: round(opts.low == null ? bottom - wick * (rising ? 0.35 : 1) : opts.low),
    c: round(close),
    v: opts.vol == null ? 1000 : opts.vol
  };
  candles.push(candle);
  return candle;
}

const round = v => Number(v.toFixed(6));

function seq(candles, closes, opts) {
  closes.forEach(close => bar(candles, close, opts));
  return candles;
}

/** Mean-reverting noise around `base` — movement without a direction. */
function chop(candles, n, base, amp, rnd, opts) {
  let v = candles.length ? candles[candles.length - 1].c : base;
  for (let i = 0; i < n; i++) {
    v += (rnd() - 0.5) * amp - (v - base) * 0.2;
    bar(candles, v, opts);
  }
  return candles;
}

/** EMA of the closes pushed so far — used to aim a wick at an average. */
function emaNow(candles, period) {
  const line = ta.ema(ta.closes(candles), period);
  return line[line.length - 1];
}

function atrNow(candles, period) {
  const line = ta.atr(candles, period || 14);
  return line[line.length - 1];
}

/* ---------------- fixtures with a pattern ---------------- */

/**
 * Resistance at ~100.9 held twice, broke, was retested from above and
 * held. The chop after the level deliberately leaves newer swing highs in
 * the window: the detector has to look past them to the level that
 * actually got broken.
 */
function breakRetestLong() {
  const rnd = mulberry32(7);
  const c = [];
  chop(c, 168, 99, 0.55, rnd, { wick: 0.2 });
  seq(c, [99.3, 99.8, 100.25, 100.6, 100.2, 99.8, 99.5, 99.3], { wick: 0.3 });  // the level: high 100.9
  chop(c, 12, 99.4, 0.45, rnd, { wick: 0.2 });
  seq(c, [99.9, 100.4], { wick: 0.2 });                        // approach
  bar(c, 101.5, { wick: 0.2, vol: 1900 });                     // the break
  seq(c, [101.1, 100.75], { wick: 0.2 });                      // back to the level
  seq(c, [101.15, 101.6], { wick: 0.2 });                      // and held
  return { symbol: "TESTUSDT", tf: "1h", candles: c };
}

/**
 * A long uptrend with regular breathers, ending on a dip that touches
 * EMA21 and closes back above it. The last two bars are aimed at the
 * average rather than typed in.
 */
function trendPullbackLong() {
  const rnd = mulberry32(11);
  const c = [];
  chop(c, 70, 100, 0.5, rnd, { wick: 0.2 });
  let price = 100;
  for (let i = 0; i < 190; i++) {
    price += 0.34 + (rnd() - 0.5) * 0.35;
    if (i % 17 === 15) price -= 1.5;                           // breathers keep RSI honest
    bar(c, price, { wick: 0.25 });
  }
  const a = atrNow(c);
  for (let i = 0; i < 3; i++) {                                // the pullback
    price -= a * 0.85;
    bar(c, price, { wick: 0.25 });
  }
  const e21 = emaNow(c, 21);
  bar(c, e21 + a * 0.6, { wick: 0.2, low: e21 * 0.999, vol: 1400 });   // touched and closed back
  return { symbol: "TESTUSDT", tf: "1h", candles: c };
}

/**
 * A hundred bars of wide swings, then twenty quiet ones, then a close
 * above the quiet range on volume.
 */
function squeezeBreakUp() {
  const rnd = mulberry32(19);
  const c = [];
  let price = 100;
  for (let i = 0; i < 60; i++) {                               // history for ATR and the width ranking
    price += Math.sin(i / 3) * 1.2 + (rnd() - 0.5) * 0.4;
    bar(c, price, { wick: 0.35 });
  }
  for (let i = 0; i < 110; i++) {                              // wide, directional swings
    price += Math.sin(i / 9) * 1.5 + (rnd() - 0.5) * 0.5;
    bar(c, price, { wick: 0.4 });
  }
  const mid = price;
  for (let i = 0; i < 20; i++) {                               // the squeeze
    const v = mid + Math.sin(i / 2) * 0.35 + (rnd() - 0.5) * 0.2;
    bar(c, v, { wick: 0.1, vol: 700 });
  }
  const hi = Math.max(...c.slice(-20).map(b => b.h));
  const a = atrNow(c);
  bar(c, hi + a * 0.5, { wick: 0.12, low: hi - a * 0.25, vol: 2600 });
  return { symbol: "TESTUSDT", tf: "1h", candles: c };
}

/**
 * Two lows, the second lower, made slowly enough that RSI holds up; then
 * a close back above the high between them.
 */
function rsiDivergenceLong() {
  const rnd = mulberry32(23);
  const c = [];
  chop(c, 150, 100, 0.5, rnd, { wick: 0.2 });
  let price = c[c.length - 1].c;

  const drop = [-1.4, -1.6, -1.2, -1.5, -1.1, -0.9];           // sharp — RSI goes with it
  drop.forEach(d => bar(c, (price += d), { wick: 0.25 }));
  bar(c, (price -= 0.5), { wick: 0.25 });                      // first low
  const first = c[c.length - 1].l;

  [0.5, 0.6, 0.45, 0.3, 0.35].forEach(d => bar(c, (price += d), { wick: 0.25 }));  // the high between
  const a = atrNow(c);
  [-0.3, -0.35, -0.25, -0.3, -0.2, -0.25, -0.15].forEach(d => bar(c, (price += d), { wick: 0.2 }));

  const low2 = first - a * 0.65;                               // lower low, gently
  bar(c, low2 + 0.15, { wick: 0.1, low: low2 });
  price = low2 + 0.15;

  const neck = Math.max(...c.slice(-14).map(b => b.h));
  const legs = 5;
  for (let i = 1; i <= legs; i++) {                            // monotone recovery, no new swing low
    price = low2 + ((neck + a * 0.35 - low2) * i) / legs;
    bar(c, price, { wick: 0.12, vol: i === legs ? 1700 : 1000 });
  }
  return { symbol: "TESTUSDT", tf: "1h", candles: c };
}

/**
 * The same chart turned upside down. Every detector is written twice, once
 * per side, and reflecting a fixture is the cheapest way to find out
 * whether the second copy says the same thing as the first.
 */
function mirror(fixture, symbol) {
  const pivot = Math.max(...fixture.candles.map(b => b.h)) + 50;
  const flip = v => round(2 * pivot - v);
  return {
    symbol: symbol || fixture.symbol,
    tf: fixture.tf,
    candles: fixture.candles.map(b => ({
      t: b.t, o: flip(b.o), h: flip(b.l), l: flip(b.h), c: flip(b.c), v: b.v
    }))
  };
}

/* ---------------- fixtures with nothing in them ---------------- */

/** A market that goes nowhere. Anything that fires here fires on noise. */
function flat() {
  const rnd = mulberry32(31);
  const c = [];
  chop(c, 300, 100, 0.12, rnd, { wick: 0.05 });
  return { symbol: "FLATUSDT", tf: "1h", candles: c };
}

/** A line straight up: a trend, but never a pullback to buy. */
function straightUp() {
  const c = [];
  let price = 100;
  for (let i = 0; i < 300; i++) bar(c, (price *= 1.004), { wick: 0.05 });
  return { symbol: "UPUSDT", tf: "1h", candles: c };
}

/** The same downwards — nothing long may be found here. */
function straightDown() {
  const c = [];
  let price = 400;
  for (let i = 0; i < 300; i++) bar(c, (price *= 0.996), { wick: 0.05 });
  return { symbol: "DOWNUSDT", tf: "1h", candles: c };
}

module.exports = {
  bar, seq, chop, mirror, mulberry32, emaNow, atrNow, HOUR, START,
  breakRetestLong, trendPullbackLong, squeezeBreakUp, rsiDivergenceLong,
  flat, straightUp, straightDown
};
