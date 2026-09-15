/**
 * The TradingView side.
 *
 * What TradingView can actually do for a program: fire a webhook when an
 * alert condition hits. It cannot hand over chart data, and the webhook
 * itself needs a paid plan — that is TradingView's rule, not ours.
 *
 * So the division of labour is: TradingView notices, Scout analyses. An
 * alert arrives, and the symbol and timeframe it names get scanned
 * immediately against the exchange's candles. Anything found is measured
 * the same way as on a scheduled scan.
 *
 * The endpoint is public the moment you expose it, so every alert must
 * carry a secret and the comparison is timing-safe.
 */
"use strict";

const crypto = require("crypto");
const market = require("./market.js");

const FIELD = {
  secret: ["secret", "key", "passphrase", "token"],
  symbol: ["symbol", "ticker", "pair"],
  tf:     ["tf", "interval", "timeframe", "resolution"],
  side:   ["side", "action", "direction", "order"],
  price:  ["price", "close", "last"],
  note:   ["note", "comment", "message", "text", "reason"]
};

function pick(object, names) {
  for (const name of names) {
    for (const key of Object.keys(object)) {
      if (key.toLowerCase() === name && object[key] != null && object[key] !== "") return object[key];
    }
  }
  return null;
}

function sideOf(raw) {
  if (!raw) return null;
  const s = String(raw).toLowerCase();
  if (/\b(buy|long|лонг|покуп)/.test(s)) return "long";
  if (/\b(sell|short|шорт|прода)/.test(s)) return "short";
  return null;
}

/**
 * Reads whatever TradingView sent. The alert box there is a plain text
 * field, so the body can be JSON or a line of text; both are accepted and
 * the pipe form is there for anyone who does not want to type braces.
 */
function parse(body) {
  const raw = String(body == null ? "" : body).trim();
  if (!raw) return { ok: false, error: "пустое тело запроса" };

  let fields = null;
  if (raw[0] === "{" || raw[0] === "[") {
    try {
      const json = JSON.parse(raw);
      if (json && typeof json === "object" && !Array.isArray(json)) fields = json;
    } catch (e) { /* fall through to the text form */ }
  }

  if (!fields && raw.includes("|")) {
    /* SCOUT|secret|BINANCE:BTCUSDT|60|long|65000|заметка */
    const parts = raw.split("|").map(p => p.trim());
    if (parts[0].toUpperCase() === "SCOUT") parts.shift();
    fields = { secret: parts[0], symbol: parts[1], tf: parts[2], side: parts[3], price: parts[4], note: parts[5] };
  }

  if (!fields) return { ok: false, error: "не разобрать: нужен JSON или строка с разделителем |", raw };

  const symbol = market.normaliseSymbol(pick(fields, FIELD.symbol));
  const tfRaw = pick(fields, FIELD.tf);
  const tf = market.timeframeFromTv(tfRaw);
  const priceRaw = pick(fields, FIELD.price);
  const price = priceRaw == null ? null : parseFloat(String(priceRaw).replace(",", "."));

  if (!symbol) return { ok: false, error: "в алерте нет тикера", raw };
  if (!tf) return { ok: false, error: "неизвестный интервал: " + (tfRaw == null ? "нет" : tfRaw), raw };

  return {
    ok: true,
    secret: pick(fields, FIELD.secret),
    alert: {
      symbol, tf,
      side: sideOf(pick(fields, FIELD.side)),
      price: Number.isFinite(price) ? price : null,
      note: pick(fields, FIELD.note),
      raw: raw.length > 2000 ? raw.slice(0, 2000) + "…" : raw
    }
  };
}

/** Constant-time comparison — a wrong secret must not leak its length. */
function secretMatches(given, expected) {
  if (!expected) return false;
  const a = Buffer.from(String(given == null ? "" : given));
  const b = Buffer.from(String(expected));
  if (a.length !== b.length) {
    crypto.timingSafeEqual(b, b);        // same work either way
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

/** A secret worth using, for the first run. */
function makeSecret() {
  return crypto.randomBytes(24).toString("base64url");
}

/** What to paste into the alert's message box on TradingView. */
function templateFor(secret, note) {
  const s = secret || "ВАШ_СЕКРЕТ";
  return {
    json: JSON.stringify({
      secret: s,
      symbol: "{{ticker}}",
      tf: "{{interval}}",
      price: "{{close}}",
      note: note || "{{strategy.order.alert_message}}"
    }),
    text: `SCOUT|${s}|{{ticker}}|{{interval}}||{{close}}|${note || "проверить"}`
  };
}

module.exports = { parse, secretMatches, makeSecret, templateFor, sideOf };
