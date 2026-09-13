/**
 * The simulated market.
 *
 * Prices here are generated, not fetched — the wallet makes no network
 * requests at all. Each token gets a seeded random walk per timeframe, so
 * the chart you see for "1Д" is the same chart after a reload, and the
 * percentage on a row is read off the series it is drawn from rather than
 * being a second, unrelated number.
 */
(function (global) {
  "use strict";

  var TOKENS = [
    { id: "cob",  sym: "COB",  name: "Cobalt",   hue: 218, price: 2.184,   vol: 0.055, dp: 2, chain: "Cobalt",   note: "Токен сети Cobalt" },
    { id: "btc",  sym: "BTC",  name: "Bitcoin",  hue: 34,  price: 71240,   vol: 0.022, dp: 5, chain: "Bitcoin",  note: "Первая криптовалюта" },
    { id: "eth",  sym: "ETH",  name: "Ethereum", hue: 232, price: 3824.50, vol: 0.026, dp: 4, chain: "Ethereum", note: "Смарт-контракты" },
    { id: "sol",  sym: "SOL",  name: "Solana",   hue: 158, price: 184.20,  vol: 0.038, dp: 3, chain: "Solana",   note: "Быстрые расчёты" },
    { id: "ton",  sym: "TON",  name: "Toncoin",  hue: 202, price: 6.42,    vol: 0.033, dp: 2, chain: "TON",      note: "Сеть TON" },
    { id: "usdc", sym: "USDC", name: "USD Coin", hue: 214, price: 1.0,     vol: 0.001, dp: 2, chain: "Solana",   note: "Стейблкоин, привязан к доллару" },
    { id: "doge", sym: "DOGE", name: "Dogecoin", hue: 46,  price: 0.1642,  vol: 0.048, dp: 0, chain: "Dogecoin", note: "Мем-монета" }
  ];

  var BY_ID = {};
  TOKENS.forEach(function (t) { BY_ID[t.id] = t; t.base = t.price; });

  /* label, number of points, step in minutes, volatility per step */
  var FRAMES = [
    { id: "1h", label: "1Ч",  points: 60,  step: 1,      vol: 0.0016 },
    { id: "1d", label: "1Д",  points: 96,  step: 15,     vol: 0.0042 },
    { id: "1w", label: "1Н",  points: 84,  step: 120,    vol: 0.0100 },
    { id: "1m", label: "1М",  points: 90,  step: 480,    vol: 0.0165 },
    { id: "1y", label: "1Г",  points: 120, step: 4380,   vol: 0.0330 },
    { id: "all", label: "ВСЁ", points: 140, step: 13140, vol: 0.0480 }
  ];

  function mulberry(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  var cache = {};

  /**
   * A price series ending at the token's live price. The walk is generated
   * once per token and frame, then rescaled on every read so the right-hand
   * edge always sits on the current price.
   */
  function series(tokenId, frameId) {
    var token = BY_ID[tokenId];
    var frame = FRAMES.filter(function (f) { return f.id === frameId; })[0] || FRAMES[1];
    var key = tokenId + ":" + frameId;

    if (!cache[key]) {
      var rnd = mulberry(hashSeed(key));
      var n = frame.points;
      var vol = frame.vol * (token.vol / 0.03);
      var trend = (rnd() - 0.45) * frame.vol * n * 0.55;
      var walk = new Array(n);
      var v = 1;
      for (var i = 0; i < n; i++) {
        /* two uniforms make a rough bell, which looks less spiky than one */
        var shock = ((rnd() + rnd() + rnd()) / 1.5 - 1) * vol;
        v *= 1 + shock + trend / n;
        walk[i] = Math.max(v, 0.05);
      }
      cache[key] = { walk: walk, step: frame.step };
    }

    var entry = cache[key];
    var scale = token.price / entry.walk[entry.walk.length - 1];
    return entry.walk.map(function (x) { return x * scale; });
  }

  /** Percentage move across a frame, straight from the series it draws. */
  function change(tokenId, frameId) {
    var s = series(tokenId, frameId || "1d");
    return ((s[s.length - 1] - s[0]) / s[0]) * 100;
  }

  /** One market tick: a small nudge, with stablecoins staying put. */
  function tick() {
    var moved = [];
    TOKENS.forEach(function (t) {
      var pull = t.id === "usdc" ? 0.4 : 0.012;              // drift back toward base
      var jitter = (Math.random() + Math.random() - 1) * t.vol * 0.09;
      var next = t.price * (1 + jitter) + (t.base - t.price) * pull * 0.02;
      if (t.id === "usdc") next = Math.min(1.002, Math.max(0.998, next));
      var before = t.price;
      t.price = Math.max(next, t.base * 0.2);
      /* the newest point of every cached walk follows the live price */
      Object.keys(cache).forEach(function (key) {
        if (key.indexOf(t.id + ":") === 0) {
          var w = cache[key].walk;
          w[w.length - 1] *= t.price / before;
        }
      });
      if (t.price !== before) moved.push(t.id);
    });
    return moved;
  }

  /* ---------- money ---------- */

  var CURRENCIES = {
    USD: { code: "USD", sign: "$", rate: 1 },
    RUB: { code: "RUB", sign: "₽", rate: 92.4 },
    EUR: { code: "EUR", sign: "€", rate: 0.92 }
  };

  function rate(code) { return (CURRENCIES[code] || CURRENCIES.USD).rate; }

  /** Fiat, in the currency the wallet is set to. */
  function money(usd, code, opts) {
    opts = opts || {};
    var cur = CURRENCIES[code] || CURRENCIES.USD;
    var value = usd * cur.rate;
    var dp = opts.dp;
    if (dp == null) dp = Math.abs(value) >= 1000 ? 0 : Math.abs(value) >= 1 ? 2 : 4;
    return new Intl.NumberFormat("ru-RU", {
      style: "currency", currency: cur.code,
      minimumFractionDigits: dp, maximumFractionDigits: dp
    }).format(value);
  }

  /** A token amount with the precision that token deserves. */
  function amount(value, tokenId) {
    var t = BY_ID[tokenId];
    var dp = t ? t.dp : 4;
    if (value !== 0 && Math.abs(value) < Math.pow(10, -dp)) dp = Math.min(dp + 4, 8);
    return new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: 0, maximumFractionDigits: dp
    }).format(value);
  }

  function percent(value) {
    return (value >= 0 ? "+" : "−") + Math.abs(value).toFixed(2).replace(".", ",") + " %";
  }

  var api = {
    TOKENS: TOKENS, FRAMES: FRAMES, CURRENCIES: CURRENCIES,
    byId: function (id) { return BY_ID[id]; },
    series: series, change: change, tick: tick,
    money: money, amount: amount, percent: percent, rate: rate,
    mulberry: mulberry, hashSeed: hashSeed
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.Market = api;
})(typeof window !== "undefined" ? window : globalThis);
