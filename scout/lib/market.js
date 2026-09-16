/**
 * Candles, from an exchange.
 *
 * TradingView has no public data API — the charts you see there are not
 * something a program is allowed to read. So the analysis runs on the
 * exchange's own klines, which is the same data TradingView draws for a
 * spot pair anyway. Two sources, in order: whichever answers first wins.
 *
 * The bar still forming is always dropped. A setup found on a candle that
 * has not closed can disappear before you read the message.
 */
"use strict";

const TIMEFRAMES = {
  "1m":  { ms: 60e3,      binance: "1m",  bybit: "1",   tv: "1"   },
  "5m":  { ms: 300e3,     binance: "5m",  bybit: "5",   tv: "5"   },
  "15m": { ms: 900e3,     binance: "15m", bybit: "15",  tv: "15"  },
  "30m": { ms: 1800e3,    binance: "30m", bybit: "30",  tv: "30"  },
  "1h":  { ms: 3600e3,    binance: "1h",  bybit: "60",  tv: "60"  },
  "2h":  { ms: 7200e3,    binance: "2h",  bybit: "120", tv: "120" },
  "4h":  { ms: 14400e3,   binance: "4h",  bybit: "240", tv: "240" },
  "1d":  { ms: 86400e3,   binance: "1d",  bybit: "D",   tv: "D"   }
};

const HIGHER = { "1m": "15m", "5m": "1h", "15m": "4h", "30m": "4h", "1h": "4h", "2h": "1d", "4h": "1d", "1d": "1d" };

/** The timeframe one step up, for checking the setup against the tide. */
function higherOf(tf) { return HIGHER[tf] || "4h"; }
function msOf(tf) { return (TIMEFRAMES[tf] || TIMEFRAMES["1h"]).ms; }
function known(tf) { return Object.prototype.hasOwnProperty.call(TIMEFRAMES, tf); }

const num = v => {
  const n = typeof v === "number" ? v : parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

/** One candle, in the only shape the rest of the program knows. */
function candle(t, o, h, l, c, v) {
  const bar = { t: num(t), o: num(o), h: num(h), l: num(l), c: num(c), v: num(v) || 0 };
  const sane = bar.t != null && [bar.o, bar.h, bar.l, bar.c].every(x => x != null && x > 0) &&
               bar.h >= bar.l && bar.h >= bar.o && bar.h >= bar.c && bar.l <= bar.o && bar.l <= bar.c;
  return sane ? bar : null;
}

async function getJson(url, timeout) {
  /* No User-Agent header on purpose: a browser refuses to set one, and
     this module runs in one too — the standalone page does its own
     scanning with exactly this code. */
  const res = await fetch(url, {
    signal: AbortSignal.timeout(timeout || 12000),
    headers: { accept: "application/json" }
  });
  if (!res.ok) throw new Error("HTTP " + res.status + " " + res.statusText);
  return res.json();
}

/* ---------------- sources ---------------- */

const binance = {
  name: "binance",
  url(symbol, tf, limit) {
    return "https://api.binance.com/api/v3/klines?symbol=" + encodeURIComponent(symbol) +
      "&interval=" + TIMEFRAMES[tf].binance + "&limit=" + Math.min(limit, 1000);
  },
  parse(body) {
    if (!Array.isArray(body)) throw new Error("не массив свечей");
    /* [openTime, open, high, low, close, volume, closeTime, ...] — oldest first */
    return body.map(r => candle(r[0], r[1], r[2], r[3], r[4], r[5])).filter(Boolean);
  }
};

const bybit = {
  name: "bybit",
  url(symbol, tf, limit) {
    return "https://api.bybit.com/v5/market/kline?category=spot&symbol=" + encodeURIComponent(symbol) +
      "&interval=" + TIMEFRAMES[tf].bybit + "&limit=" + Math.min(limit, 1000);
  },
  parse(body) {
    if (!body || !body.result || !Array.isArray(body.result.list)) {
      throw new Error(body && body.retMsg ? body.retMsg : "нет result.list");
    }
    /* [start, open, high, low, close, volume, turnover] — newest first here */
    return body.result.list
      .map(r => candle(r[0], r[1], r[2], r[3], r[4], r[5]))
      .filter(Boolean)
      .sort((a, b) => a.t - b.t);
  }
};

const SOURCES = { binance, bybit };
const ORDER = ["binance", "bybit"];

/**
 * Closed candles for a symbol, newest last.
 *
 * `options.sources` picks and orders the exchanges; the default tries
 * Binance and falls back to Bybit. Whatever answers, the last bar is
 * dropped unless the clock says it has already closed.
 */
async function klines(symbol, tf, limit, options) {
  options = options || {};
  if (!known(tf)) throw new Error("неизвестный таймфрейм: " + tf);
  limit = Math.max(60, Math.min(limit || 400, 1000));

  const names = (options.sources && options.sources.length ? options.sources : ORDER)
    .filter(n => SOURCES[n]);
  if (!names.length) throw new Error("не задан ни один источник данных");

  const problems = [];
  for (const name of names) {
    const source = SOURCES[name];
    try {
      const body = await getJson(source.url(symbol, tf, limit + 1), options.timeout);
      let bars = source.parse(body);
      if (bars.length < 60) throw new Error("слишком мало свечей: " + bars.length);
      bars = dropUnclosed(bars, tf, options.now);
      return { symbol, tf, source: name, candles: bars };
    } catch (e) {
      problems.push(name + ": " + (e && e.message ? e.message : e));
    }
  }
  throw new Error("не удалось получить свечи " + symbol + " " + tf + " — " + problems.join("; "));
}

/** Removes the bar that is still being painted. */
function dropUnclosed(bars, tf, now) {
  const step = msOf(tf);
  const t = now == null ? Date.now() : now;
  while (bars.length && bars[bars.length - 1].t + step > t) bars = bars.slice(0, -1);
  return bars;
}

/** When the candle currently open will close. */
function nextClose(tf, now) {
  const step = msOf(tf);
  const t = now == null ? Date.now() : now;
  return Math.ceil((t + 1) / step) * step;
}

/**
 * TradingView writes symbols with the exchange in front and a suffix for
 * perpetuals; the exchange APIs want neither.
 */
function normaliseSymbol(raw) {
  if (!raw) return "";
  let s = String(raw).trim().toUpperCase();
  if (s.includes(":")) s = s.slice(s.indexOf(":") + 1);
  s = s.replace(/\.P$/, "").replace(/[^A-Z0-9]/g, "");
  return s;
}

/** The reverse of the TradingView interval codes. */
function timeframeFromTv(raw) {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  const direct = Object.keys(TIMEFRAMES).find(tf => tf.toUpperCase() === s);
  if (direct) return direct;
  return Object.keys(TIMEFRAMES).find(tf => TIMEFRAMES[tf].tv === s) || null;
}

module.exports = {
  TIMEFRAMES, SOURCES, ORDER,
  klines, dropUnclosed, nextClose, candle,
  higherOf, msOf, known, normaliseSymbol, timeframeFromTv
};
