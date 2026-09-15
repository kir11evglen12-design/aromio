/**
 * Indicators, written out rather than imported.
 *
 * Every function here takes plain arrays and returns plain arrays of the
 * same length, with `null` where there is not enough history yet. That
 * keeps indices aligned with the candles, so a setup can always point at
 * the exact bar it was found on.
 */
"use strict";

/** Simple average of a window ending at i. */
function sma(values, period) {
  const out = new Array(values.length).fill(null);
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) sum -= values[i - period];
    if (i >= period - 1) out[i] = sum / period;
  }
  return out;
}

/** Exponential average, seeded with the first simple average. */
function ema(values, period) {
  const out = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

/** Wilder's smoothing — what RSI and ATR are actually defined on. */
function wilder(values, period) {
  const out = new Array(values.length).fill(null);
  if (values.length < period) return out;
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = (prev * (period - 1) + values[i]) / period;
    out[i] = prev;
  }
  return out;
}

function rsi(closes, period = 14) {
  const gains = [0], losses = [0];
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gains.push(Math.max(d, 0));
    losses.push(Math.max(-d, 0));
  }
  const ag = wilder(gains, period), al = wilder(losses, period);
  return closes.map((_, i) => {
    if (ag[i] === null || al[i] === null) return null;
    if (al[i] === 0) return 100;
    const rs = ag[i] / al[i];
    return 100 - 100 / (1 + rs);
  });
}

/** True range of each bar, then Wilder-smoothed. */
function atr(candles, period = 14) {
  const tr = candles.map((c, i) => {
    if (i === 0) return c.h - c.l;
    const prev = candles[i - 1].c;
    return Math.max(c.h - c.l, Math.abs(c.h - prev), Math.abs(c.l - prev));
  });
  return wilder(tr, period);
}

/**
 * Swing points: a high with `left` lower highs before it and `right` after.
 * The last `right` bars can never be swings yet — that is the point, a
 * swing is only confirmed once price has moved away from it.
 */
function swings(candles, left = 2, right = 2) {
  const highs = [], lows = [];
  for (let i = left; i < candles.length - right; i++) {
    let isHigh = true, isLow = true;
    for (let j = i - left; j <= i + right; j++) {
      if (j === i) continue;
      if (candles[j].h >= candles[i].h) isHigh = false;
      if (candles[j].l <= candles[i].l) isLow = false;
    }
    if (isHigh) highs.push({ i, price: candles[i].h });
    if (isLow) lows.push({ i, price: candles[i].l });
  }
  return { highs, lows };
}

function median(values) {
  const list = values.filter(v => v != null).slice().sort((a, b) => a - b);
  if (!list.length) return null;
  const mid = list.length >> 1;
  return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
}

/** Where `value` sits inside `values`, 0 to 1. */
function percentRank(values, value) {
  const list = values.filter(v => v != null);
  if (!list.length) return null;
  return list.filter(v => v <= value).length / list.length;
}

/** Slope of a least-squares line through the last `n` values, per bar. */
function slope(values, n) {
  const list = values.slice(-n).filter(v => v != null);
  if (list.length < 2) return null;
  const xs = list.map((_, i) => i);
  const mx = xs.reduce((a, b) => a + b, 0) / list.length;
  const my = list.reduce((a, b) => a + b, 0) / list.length;
  let num = 0, den = 0;
  for (let i = 0; i < list.length; i++) {
    num += (xs[i] - mx) * (list[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

const closes = candles => candles.map(c => c.c);
const volumes = candles => candles.map(c => c.v);

module.exports = { sma, ema, wilder, rsi, atr, swings, median, percentRank, slope, closes, volumes };
