/**
 * Setup detectors.
 *
 * Each one looks at closed candles only and either returns a setup or null.
 * A setup is never just "signal here": it carries the levels it was built
 * from, an entry, a stop, two targets and the reasons in plain words, so
 * the decision stays with the person reading it.
 *
 * None of this predicts anything. It recognises conditions that have a
 * name, and says how far price would have to go against the idea before
 * the idea is wrong.
 */
"use strict";

const ta = require("./ta.js");

const LOOKBACK = 40;          // how far back a detector may reach for structure
const MIN_RR = 1.2;           // below this the idea is not worth writing down

/* ---------- helpers ---------- */

function lastDefined(series) {
  for (let i = series.length - 1; i >= 0; i--) if (series[i] != null) return series[i];
  return null;
}

function highest(candles, from, to) {
  let best = -Infinity;
  for (let i = Math.max(0, from); i <= Math.min(candles.length - 1, to); i++) best = Math.max(best, candles[i].h);
  return best;
}

function lowest(candles, from, to) {
  let best = Infinity;
  for (let i = Math.max(0, from); i <= Math.min(candles.length - 1, to); i++) best = Math.min(best, candles[i].l);
  return best;
}

/** Everything a detector needs, computed once per symbol and timeframe. */
function context(symbol, tf, candles, htfTrend) {
  const closes = ta.closes(candles);
  return {
    symbol, tf, candles, closes,
    htfTrend: htfTrend || null,
    ema21: ta.ema(closes, 21),
    ema50: ta.ema(closes, 50),
    ema200: ta.ema(closes, 200),
    rsi: ta.rsi(closes, 14),
    atr: ta.atr(candles, 14),
    swings: ta.swings(candles, 3, 3),
    volMedian: ta.median(ta.volumes(candles).slice(-20)),
    last: candles.length - 1
  };
}

/**
 * Turns a raw idea into a setup, or rejects it. This is where every
 * detector's output gets the same shape and the same sanity checks.
 */
function build(ctx, idea) {
  const { entry, stop, side } = idea;
  if (!(entry > 0) || !(stop > 0)) return null;
  const risk = side === "long" ? entry - stop : stop - entry;
  if (!(risk > 0)) return null;                     // stop on the wrong side

  /* The stop has to stay inside what this market actually moves. Six ATR
     is wide but reachable; past that the risk unit is so big that the
     targets stop meaning anything, and under a sixth of an ATR the stop
     is inside the noise and gets taken out for no reason. */
  const atrNow = lastDefined(ctx.atr) || risk;
  if (risk > atrNow * 6 || risk < atrNow * 0.15) return null;

  const dir = side === "long" ? 1 : -1;
  const targets = idea.targets && idea.targets.length
    ? idea.targets
    : [entry + dir * risk * 1.5, entry + dir * risk * 3];
  const rr = Math.abs(targets[targets.length - 1] - entry) / risk;
  if (rr < MIN_RR) return null;

  const bar = ctx.candles[ctx.last];
  const setup = {
    id: `${ctx.symbol}|${ctx.tf}|${idea.kind}|${bar.t}`,
    symbol: ctx.symbol,
    tf: ctx.tf,
    kind: idea.kind,
    title: idea.title,
    side,
    at: bar.t,
    price: bar.c,
    entry, stop, targets,
    rr: Number(rr.toFixed(2)),
    rr1: Number((Math.abs(targets[0] - entry) / risk).toFixed(2)),
    riskPct: Number(((risk / entry) * 100).toFixed(2)),
    atr: Number(atrNow.toFixed(8)),
    levels: idea.levels || {},
    reasons: idea.reasons.slice()
  };
  setup.score = score(ctx, setup);
  return setup;
}

/**
 * How much the conditions agree with each other. Not a probability — a
 * count of confirmations, so two setups can be compared at a glance.
 */
function score(ctx, setup) {
  let points = 25;
  const bar = ctx.candles[ctx.last];
  const ema200 = lastDefined(ctx.ema200);
  const ema50 = lastDefined(ctx.ema50);
  const long = setup.side === "long";

  if (ema200 != null) {
    const withTrend = long ? bar.c > ema200 : bar.c < ema200;
    if (withTrend) { points += 15; setup.reasons.push("по стороне EMA200"); }
    else points -= 10;
  }
  if (ema50 != null && ema200 != null) {
    const stacked = long ? ema50 > ema200 : ema50 < ema200;
    if (stacked) points += 10;
  }
  if (ctx.htfTrend) {
    if ((long && ctx.htfTrend === "up") || (!long && ctx.htfTrend === "down")) {
      points += 20;
      setup.reasons.push("старший таймфрейм в ту же сторону");
    } else if (ctx.htfTrend !== "flat") {
      points -= 15;
      setup.reasons.push("старший таймфрейм против");
    }
  }
  if (ctx.volMedian && bar.v >= ctx.volMedian * 1.5) {
    points += 12;
    setup.reasons.push("объём выше обычного");
  }
  if (setup.rr >= 3) points += 18;
  else if (setup.rr >= 2) points += 12;
  else if (setup.rr >= 1.5) points += 6;

  return Math.max(0, Math.min(100, Math.round(points)));
}

/* ---------- detectors ---------- */

/**
 * Structure break, then a return to the broken level that holds.
 * The level that stopped price before is expected to stop it again from
 * the other side; the stop goes where that stops being true.
 */
function breakRetest(ctx) {
  const { candles, last } = ctx;
  const atrNow = lastDefined(ctx.atr);
  if (!atrNow) return null;
  const bar = candles[last];

  for (const side of ["long", "short"]) {
    const long = side === "long";
    const pivots = long ? ctx.swings.highs : ctx.swings.lows;

    /* Every pivot in reach is a candidate, newest first. Taking only the
       newest one would miss the pattern almost every time: the thrust
       that broke the level leaves a fresher pivot of its own behind, and
       that one has not been broken by anything. */
    const candidates = pivots
      .filter(p => p.i >= last - LOOKBACK && p.i <= last - 3)
      .slice()
      .reverse();

    for (const level of candidates) {
      /* the break: a close beyond the level, clear of it by enough that a
         single tick through does not count */
      let breakAt = -1;
      for (let i = level.i + 1; i <= last; i++) {
        const past = long ? candles[i].c - level.price : level.price - candles[i].c;
        if (past > atrNow * 0.25) { breakAt = i; break; }
      }
      if (breakAt < 0 || last - breakAt < 2) continue;

      /* the retest: price came back within a third of an ATR of the level */
      let touched = -1;
      for (let i = breakAt + 1; i <= last; i++) {
        const dist = long ? candles[i].l - level.price : level.price - candles[i].h;
        if (dist <= atrNow * 0.35) { touched = i; break; }
      }
      if (touched < 0) continue;

      /* and the current bar closed back on the breakout side */
      if (long ? bar.c <= level.price : bar.c >= level.price) continue;

      const swingAfter = long
        ? lowest(candles, breakAt, last) - atrNow * 0.4
        : highest(candles, breakAt, last) + atrNow * 0.4;

      return build(ctx, {
        kind: "break-retest",
        title: "Пробой уровня и ретест",
        side,
        entry: bar.c,
        stop: swingAfter,
        levels: { уровень: level.price, пробой: candles[breakAt].c },
        reasons: [
          long ? "пробит максимум структуры" : "пробит минимум структуры",
          "цена вернулась к уровню и удержала его"
        ]
      });
    }
  }
  return null;
}

/**
 * A trend that gave a discount: price pulls into the fast average and
 * closes back out of it without breaking the slow one.
 */
function trendPullback(ctx) {
  const { candles, last } = ctx;
  const bar = candles[last];
  const e21 = ctx.ema21[last], e50 = ctx.ema50[last], e200 = ctx.ema200[last];
  const rsiNow = ctx.rsi[last];
  const atrNow = lastDefined(ctx.atr);
  if (e21 == null || e50 == null || e200 == null || rsiNow == null || !atrNow) return null;

  /* An ordering of averages is not a trend. In a flat market EMA50 and
     EMA200 sit on top of each other and one of them is always nominally
     above — so ask for daylight between them, measured in ATR, and for
     the fast average to be actually going somewhere. */
  const spread = Math.abs(e50 - e200) >= atrNow * 0.5;
  const drift = ta.slope(ctx.ema21.slice(0, last + 1), 10);
  if (!spread || drift == null) return null;

  const up = e50 > e200 && bar.c > e200 && drift > 0;
  const down = e50 < e200 && bar.c < e200 && drift < 0;
  if (!up && !down) return null;

  const side = up ? "long" : "short";
  const touched = up ? bar.l <= e21 * 1.001 : bar.h >= e21 * 0.999;
  const closedBack = up ? bar.c > e21 : bar.c < e21;
  const rsiRoom = up ? rsiNow >= 35 && rsiNow <= 60 : rsiNow <= 65 && rsiNow >= 40;
  if (!touched || !closedBack || !rsiRoom) return null;

  const stop = up
    ? lowest(candles, last - 3, last) - atrNow * 0.5
    : highest(candles, last - 3, last) + atrNow * 0.5;

  return build(ctx, {
    kind: "trend-pullback",
    title: "Откат в тренде к EMA21",
    side,
    entry: bar.c,
    stop,
    levels: { EMA21: e21, EMA50: e50, EMA200: e200 },
    reasons: [
      up ? "EMA50 выше EMA200 — тренд вверх" : "EMA50 ниже EMA200 — тренд вниз",
      "EMA21 идёт в ту же сторону",
      "откат к EMA21 и закрытие обратно",
      `RSI ${rsiNow.toFixed(0)} — без перегрева`
    ]
  });
}

/**
 * A range that got quiet, then left. The measured move of the range is
 * the target, because that is the only number the range itself gives.
 */
function squeezeBreak(ctx) {
  const { candles, last } = ctx;
  if (last < 120) return null;
  const bar = candles[last];
  const atrNow = lastDefined(ctx.atr);
  if (!atrNow) return null;

  /* how wide the previous twenty bars were, in ATR, over the last hundred */
  const widths = [];
  for (let i = 100; i <= last; i++) {
    const hi = highest(candles, i - 20, i - 1);
    const lo = lowest(candles, i - 20, i - 1);
    const a = ctx.atr[i];
    if (a) widths.push({ i, ratio: (hi - lo) / a });
  }
  if (widths.length < 20) return null;
  const current = widths[widths.length - 1];
  const rank = ta.percentRank(widths.map(w => w.ratio), current.ratio);
  if (rank == null || rank > 0.3) return null;               // not quiet enough

  const hi = highest(candles, last - 20, last - 1);
  const lo = lowest(candles, last - 20, last - 1);
  const height = hi - lo;
  if (!(height > 0)) return null;

  const up = bar.c > hi;
  const down = bar.c < lo;
  if (!up && !down) return null;
  if (ctx.volMedian && bar.v < ctx.volMedian * 1.2) return null;

  /* The stop goes where the breakout itself is wrong — under the bar that
     made it, or under the range if the range is the tighter of the two.
     Hanging it on the far side of the range instead would cost the whole
     height of the range to make the height of the range back. */
  const side = up ? "long" : "short";
  return build(ctx, {
    kind: "squeeze-break",
    title: "Сжатие и выход из диапазона",
    side,
    entry: bar.c,
    stop: up
      ? Math.max(lo, bar.l) - atrNow * 0.3
      : Math.min(hi, bar.h) + atrNow * 0.3,
    targets: up
      ? [hi + height, hi + height * 2]
      : [lo - height, lo - height * 2],
    levels: { верх: hi, низ: lo, высота: height, ретест: up ? hi : lo },
    reasons: [
      `диапазон уже, чем ${Math.round((1 - rank) * 100)} % последних ста баров`,
      up ? "закрытие выше границы диапазона" : "закрытие ниже границы диапазона",
      "первая цель — высота диапазона от границы, вторая — две высоты"
    ]
  });
}

/**
 * Price made a new extreme, momentum did not. Only counted when the bar
 * that follows takes back the swing between the two lows.
 */
function rsiDivergence(ctx) {
  const { candles, last } = ctx;
  const bar = candles[last];
  const atrNow = lastDefined(ctx.atr);
  if (!atrNow) return null;

  for (const side of ["long", "short"]) {
    const long = side === "long";
    const pivots = (long ? ctx.swings.lows : ctx.swings.highs)
      .filter(p => p.i >= last - LOOKBACK * 2);
    if (pivots.length < 2) continue;
    const [prev, curr] = pivots.slice(-2);
    if (curr.i > last - 2) continue;

    /* Both halves have to be worth the name: a new extreme that clears
       the old one by a third of an ATR, and a momentum gap of a few
       points rather than a rounding difference. */
    const priceExtreme = long
      ? curr.price < prev.price - atrNow * 0.3
      : curr.price > prev.price + atrNow * 0.3;
    const rsiPrev = ctx.rsi[prev.i], rsiCurr = ctx.rsi[curr.i];
    if (rsiPrev == null || rsiCurr == null) continue;
    const rsiHolds = long ? rsiCurr > rsiPrev + 3 : rsiCurr < rsiPrev - 3;
    const rsiZone = long ? rsiCurr < 45 : rsiCurr > 55;
    if (!priceExtreme || !rsiHolds || !rsiZone) continue;

    /* the trigger: price takes back the swing between the two pivots */
    const between = long ? highest(candles, prev.i, curr.i) : lowest(candles, prev.i, curr.i);
    if (long ? bar.c <= between : bar.c >= between) continue;

    return build(ctx, {
      kind: "rsi-divergence",
      title: long ? "Бычья дивергенция RSI" : "Медвежья дивергенция RSI",
      side,
      entry: bar.c,
      stop: long ? curr.price - atrNow * 0.5 : curr.price + atrNow * 0.5,
      levels: {
        [long ? "минимум" : "максимум"]: curr.price,
        предыдущий: prev.price,
        RSI: Number(rsiCurr.toFixed(1))
      },
      reasons: [
        long ? "цена ниже, RSI выше — импульс слабеет" : "цена выше, RSI ниже — импульс слабеет",
        `RSI ${rsiPrev.toFixed(0)} → ${rsiCurr.toFixed(0)}`,
        "забран промежуточный экстремум"
      ]
    });
  }
  return null;
}

const DETECTORS = [breakRetest, trendPullback, squeezeBreak, rsiDivergence];

/** Every setup visible on the last closed bar, best first. */
function detect(symbol, tf, candles, options) {
  options = options || {};
  if (!candles || candles.length < 60) return [];
  const ctx = context(symbol, tf, candles, options.htfTrend);
  const found = [];
  for (const detector of DETECTORS) {
    let setup = null;
    try { setup = detector(ctx); } catch (e) { setup = null; }
    if (setup && setup.score >= (options.minScore || 0)) found.push(setup);
  }
  return found.sort((a, b) => b.score - a.score);
}

/**
 * Direction of a higher timeframe, for agreement scoring.
 *
 * "Flat" is the honest answer far more often than either direction: two
 * averages a hair apart are not a trend, whichever of them happens to be
 * on top, so the gap has to be worth at least half an ATR before this
 * calls it anything.
 */
function trendOf(candles) {
  if (!candles || candles.length < 60) return "flat";
  const closes = ta.closes(candles);
  const deep = candles.length >= 200;
  const fast = lastDefined(ta.ema(closes, deep ? 50 : 20));
  const slow = lastDefined(ta.ema(closes, deep ? 200 : 50));
  const atrNow = lastDefined(ta.atr(candles, 14));
  const price = closes[closes.length - 1];
  if (fast == null || slow == null || !atrNow) return "flat";
  if (Math.abs(fast - slow) < atrNow * 0.5) return "flat";
  if (price > slow && fast > slow) return "up";
  if (price < slow && fast < slow) return "down";
  return "flat";
}

module.exports = { detect, trendOf, context, build, score, DETECTORS, MIN_RR };
