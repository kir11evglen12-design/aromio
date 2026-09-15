/**
 * The loop that actually does the work.
 *
 * For every pair and timeframe being watched: get the closed candles, ask
 * the higher timeframe which way it is leaning, run the detectors, and
 * send whatever is new.
 *
 * "New" is the whole problem with a scanner. A pullback to EMA21 can be
 * true on six candles in a row, and six identical messages is how a tool
 * like this gets muted. A finding is sent once per pattern per pair until
 * enough bars have passed for it to mean something different.
 */
"use strict";

const market = require("./market.js");
const setups = require("./setups.js");

function scanner(options) {
  const { config, store, notify } = options;
  const trendCache = new Map();

  /** The higher timeframe's direction, re-read only when its bar closes. */
  async function higherTrend(symbol, tf) {
    const htf = market.higherOf(tf);
    if (htf === tf) return null;
    const key = symbol + "|" + htf;
    const cached = trendCache.get(key);
    if (cached && cached.until > Date.now()) return cached.trend;
    try {
      const data = await market.klines(symbol, htf, 260, { sources: config.sources });
      const trend = setups.trendOf(data.candles);
      trendCache.set(key, { trend, until: market.nextClose(htf) });
      return trend;
    } catch (e) {
      return null;                      // no higher timeframe is better than a wrong one
    }
  }

  /** One pair, one timeframe. Never throws — a dead symbol is a result too. */
  async function scan(symbol, tf) {
    const started = Date.now();
    try {
      const data = await market.klines(symbol, tf, config.lookback, { sources: config.sources });
      const htfTrend = await higherTrend(symbol, tf);
      const found = setups.detect(symbol, tf, data.candles, {
        htfTrend,
        minScore: config.minScore
      });
      const last = data.candles[data.candles.length - 1];
      const result = {
        symbol, tf,
        source: data.source,
        bars: data.candles.length,
        lastBar: last.t,
        price: last.c,
        htfTrend,
        setups: found,
        took: Date.now() - started
      };
      store.noteScan(symbol, tf, {
        source: data.source, bars: data.candles.length, lastBar: last.t,
        price: last.c, htfTrend, found: found.length
      });
      return result;
    } catch (e) {
      const result = { symbol, tf, error: e.message, setups: [], took: Date.now() - started };
      store.noteScan(symbol, tf, { error: e.message });
      return result;
    }
  }

  /**
   * Has this pattern already been sent recently enough that saying it
   * again would be noise?
   */
  function muted(setup) {
    const previous = store.lastOf(setup.symbol, setup.tf, setup.kind, setup.side);
    if (!previous) return false;
    const bars = (config.cooldownBars == null ? 6 : config.cooldownBars);
    return setup.at - previous.at < bars * market.msOf(setup.tf);
  }

  /** Records and sends one finding. Returns what happened, for the log. */
  async function deliver(setup) {
    if (store.has(setup.id)) return { setup, sent: false, why: "уже было" };
    if (muted(setup)) {
      store.add(setup);                 // remembered, deliberately not sent
      return { setup, sent: false, why: "тот же сетап недавно" };
    }
    store.add(setup);
    if (config.dry) return { setup, sent: false, why: "холостой прогон" };
    const results = await notify.send(setup);
    return { setup, sent: results.some(r => r.ok), results };
  }

  /** Everything on the watchlist, one pass. */
  async function scanAll() {
    const started = Date.now();
    const results = [];
    const delivered = [];

    for (const symbol of config.symbols) {
      for (const tf of config.timeframes) {
        if (!market.known(tf)) {
          results.push({ symbol, tf, error: "неизвестный таймфрейм", setups: [] });
          continue;
        }
        const result = await scan(symbol, tf);
        results.push(result);
        for (const setup of result.setups) delivered.push(await deliver(setup));
      }
    }

    store.save();
    return {
      started, finished: Date.now(),
      results,
      found: results.reduce((n, r) => n + r.setups.length, 0),
      sent: delivered.filter(d => d.sent).length,
      delivered,
      errors: results.filter(r => r.error).map(r => r.symbol + " " + r.tf + ": " + r.error)
    };
  }

  /** A symbol named by a TradingView alert, scanned on the spot. */
  async function scanAlert(alert) {
    const result = await scan(alert.symbol, alert.tf);
    const delivered = [];
    for (const setup of result.setups) delivered.push(await deliver(setup));
    store.save();
    return { result, delivered };
  }

  return { scan, scanAll, scanAlert, deliver, muted, higherTrend };
}

module.exports = { scanner };
