/**
 * Settings, from three places at once.
 *
 * Defaults, then scout.config.json if it exists, then environment
 * variables, then command line flags — each layer only overriding what it
 * actually sets. Secrets belong in the environment; the config file is
 * for the watchlist and is safe to read out loud.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

const DEFAULTS = {
  symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"],
  timeframes: ["15m", "1h", "4h"],
  minScore: 45,
  lookback: 400,
  cooldownBars: 6,          // one pattern, one message, until this many bars have passed
  sources: ["binance", "bybit"],
  intervalMinutes: 0,       // 0 = follow the shortest timeframe being watched
  host: "127.0.0.1",
  port: 8787,
  tz: "Europe/Moscow",
  dataFile: path.join(ROOT, "data", "scout.json"),
  logFile: path.join(ROOT, "data", "setups.jsonl"),
  telegramToken: "",
  telegramChatId: "",
  webhookSecret: "",
  console: true
};

const CONFIG_FILE = path.join(ROOT, "scout.config.json");

const list = value => String(value).split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
const int = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

function fromFile(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return {};
    throw new Error("не читается " + file + ": " + e.message);
  }
}

function fromEnv(env) {
  const out = {};
  if (env.SCOUT_SYMBOLS) out.symbols = list(env.SCOUT_SYMBOLS).map(s => s.toUpperCase());
  if (env.SCOUT_TIMEFRAMES) out.timeframes = list(env.SCOUT_TIMEFRAMES);
  if (env.SCOUT_SOURCES) out.sources = list(env.SCOUT_SOURCES);
  if (env.SCOUT_MIN_SCORE) out.minScore = int(env.SCOUT_MIN_SCORE, DEFAULTS.minScore);
  if (env.SCOUT_INTERVAL) out.intervalMinutes = int(env.SCOUT_INTERVAL, 0);
  if (env.SCOUT_HOST) out.host = env.SCOUT_HOST;
  if (env.SCOUT_PORT) out.port = int(env.SCOUT_PORT, DEFAULTS.port);
  if (env.SCOUT_TZ) out.tz = env.SCOUT_TZ;
  if (env.SCOUT_DATA) out.dataFile = env.SCOUT_DATA;
  if (env.SCOUT_SECRET) out.webhookSecret = env.SCOUT_SECRET;
  if (env.TELEGRAM_TOKEN) out.telegramToken = env.TELEGRAM_TOKEN;
  if (env.TELEGRAM_CHAT_ID) out.telegramChatId = String(env.TELEGRAM_CHAT_ID);
  return out;
}

/** `--port 9000 --symbols BTCUSDT,ETHUSDT --quiet` */
function fromArgv(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const eq = arg.indexOf("=");
    const name = (eq > 0 ? arg.slice(2, eq) : arg.slice(2)).toLowerCase();
    const value = eq > 0 ? arg.slice(eq + 1) : (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true");
    switch (name) {
      case "symbols": out.symbols = list(value).map(s => s.toUpperCase()); break;
      case "tf": case "timeframes": out.timeframes = list(value); break;
      case "sources": out.sources = list(value); break;
      case "min-score": out.minScore = int(value, DEFAULTS.minScore); break;
      case "interval": out.intervalMinutes = int(value, 0); break;
      case "host": out.host = value; break;
      case "port": out.port = int(value, DEFAULTS.port); break;
      case "tz": out.tz = value; break;
      case "data": out.dataFile = value; break;
      case "secret": out.webhookSecret = value; break;
      case "quiet": out.console = false; break;
      case "once": out.once = true; break;
      case "dry": out.dry = true; break;
      default: break;
    }
  }
  return out;
}

function load(argv, env) {
  const config = Object.assign({}, DEFAULTS, fromFile(CONFIG_FILE), fromEnv(env || process.env), fromArgv(argv || []));
  config.symbols = [...new Set(config.symbols.map(s => String(s).toUpperCase()))];
  config.timeframes = [...new Set(config.timeframes.map(String))];
  config.configFile = CONFIG_FILE;
  config.hasConfigFile = fs.existsSync(CONFIG_FILE);
  return config;
}

/** What may be shown on a page or printed — never the token or the secret. */
function publicView(config) {
  return {
    symbols: config.symbols,
    timeframes: config.timeframes,
    minScore: config.minScore,
    sources: config.sources,
    tz: config.tz,
    telegram: Boolean(config.telegramToken && config.telegramChatId),
    webhook: Boolean(config.webhookSecret)
  };
}

module.exports = { load, publicView, DEFAULTS, CONFIG_FILE, ROOT, fromArgv, fromEnv };
