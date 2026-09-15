/**
 * Getting a finding out of the program and in front of you.
 *
 * Three sinks: the terminal, a log file you can grep, and Telegram. The
 * first two always work; the third needs a bot token and a chat id, and
 * says so plainly when it does not have them instead of failing silently.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const SIDE = { long: "ЛОНГ", short: "ШОРТ" };
const TF_NAME = { "1m": "1 мин", "5m": "5 мин", "15m": "15 мин", "30m": "30 мин",
                  "1h": "1 час", "2h": "2 часа", "4h": "4 часа", "1d": "1 день" };

/** Enough digits to tell two prices apart, and no more. */
function price(value) {
  const v = Math.abs(value);
  const digits = v >= 1000 ? 2 : v >= 10 ? 3 : v >= 1 ? 4 : v >= 0.01 ? 6 : 8;
  return Number(value.toFixed(digits)).toLocaleString("ru-RU", { maximumFractionDigits: digits });
}

/** Numbers in a Russian message take a comma. */
const dec = v => String(v).replace(".", ",");

function stars(score) {
  const filled = Math.max(1, Math.min(5, Math.round(score / 20)));
  return "★".repeat(filled) + "☆".repeat(5 - filled);
}

/** The message itself. Telegram's HTML mode, which is also readable as text. */
function format(setup, options) {
  options = options || {};
  const long = setup.side === "long";
  const arrow = long ? "▲" : "▼";
  const when = new Date(setup.at).toLocaleString("ru-RU", { timeZone: options.tz || "Europe/Moscow" });

  const lines = [
    `${arrow} <b>${escape(setup.symbol)}</b> · ${TF_NAME[setup.tf] || setup.tf} · <b>${SIDE[setup.side]}</b>`,
    `<i>${escape(setup.title)}</i>`,
    "",
    `Вход      <b>${price(setup.entry)}</b>`,
    `Стоп      ${price(setup.stop)}  (${dec(setup.riskPct)} % от цены)`,
    `Цель 1    ${price(setup.targets[0])}  (${dec(setup.rr1)}R)`,
    setup.targets[1] != null ? `Цель 2    ${price(setup.targets[1])}  (${dec(setup.rr)}R)` : null,
    "",
    `Условия: ${stars(setup.score)} ${setup.score}/100`,
    ...setup.reasons.map(r => "• " + escape(r)),
    "",
    `Свеча закрылась ${when}`,
    "<i>Это найденное условие, а не совет. Решение и размер позиции — ваши.</i>"
  ];
  return lines.filter(l => l !== null).join("\n");
}

/** The same thing without markup, for the terminal and the log. */
function plain(setup, options) {
  return format(setup, options).replace(/<[^>]+>/g, "");
}

function escape(text) {
  return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------------- sinks ---------------- */

function consoleSink() {
  return {
    name: "консоль",
    ready: true,
    async send(setup, options) { console.log("\n" + plain(setup, options) + "\n"); return true; }
  };
}

function fileSink(file) {
  return {
    name: "файл " + file,
    ready: true,
    async send(setup) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), setup }) + "\n");
      return true;
    }
  };
}

function telegramSink(token, chatId) {
  const ready = Boolean(token && chatId);
  return {
    name: "Telegram",
    ready,
    why: ready ? null : "нет TELEGRAM_TOKEN или TELEGRAM_CHAT_ID",
    async send(setup, options) { return telegram(token, chatId, format(setup, options)); },
    async text(message) { return telegram(token, chatId, message); }
  };
}

async function telegram(token, chatId, text) {
  const res = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    signal: AbortSignal.timeout(12000)
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.ok === false) {
    throw new Error("Telegram: " + (body.description || res.status + " " + res.statusText));
  }
  return true;
}

/**
 * Sends to every sink that is ready. One sink failing never stops
 * another — if Telegram is down the finding still reaches the log.
 */
function notifier(config) {
  const sinks = [];
  if (config.console !== false) sinks.push(consoleSink());
  if (config.logFile) sinks.push(fileSink(config.logFile));
  const tg = telegramSink(config.telegramToken, config.telegramChatId);
  sinks.push(tg);

  return {
    sinks,
    telegram: tg,
    ready: sinks.filter(s => s.ready).map(s => s.name),
    missing: sinks.filter(s => !s.ready).map(s => s.name + " — " + s.why),
    async send(setup) {
      const results = [];
      for (const sink of sinks) {
        if (!sink.ready) continue;
        try { await sink.send(setup, config); results.push({ sink: sink.name, ok: true }); }
        catch (e) { results.push({ sink: sink.name, ok: false, error: e.message }); }
      }
      return results;
    }
  };
}

module.exports = { notifier, format, plain, price, stars, dec, consoleSink, fileSink, telegramSink };
