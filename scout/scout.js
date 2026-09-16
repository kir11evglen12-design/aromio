#!/usr/bin/env node
/**
 * Meridian Scout — command line.
 *
 *   node scout.js scan        один проход по списку и выход
 *   node scout.js watch       проход на каждом закрытии свечи
 *   node scout.js serve       то же плюс страница и приём алертов TradingView
 *   node scout.js selftest    проверить арифметику, настройки и связь
 *   node scout.js secret      сгенерировать секрет для вебхука
 *   node scout.js alert       показать, что вставить в алерт TradingView
 *
 * Флаги: --symbols BTCUSDT,ETHUSDT --tf 15m,1h,4h --min-score 50
 *        --port 8787 --host 127.0.0.1 --dry --quiet --once
 */
"use strict";

const path = require("path");
const { execFileSync } = require("child_process");

const configLib = require("./lib/config.js");
const market = require("./lib/market.js");
const setupsLib = require("./lib/setups.js");
const notifyLib = require("./lib/notify.js");
const { Store } = require("./lib/store.js");
const { scanner } = require("./lib/scanner.js");
const server = require("./lib/server.js");
const tv = require("./lib/tv.js");

const argv = process.argv.slice(2);
const command = (argv[0] && !argv[0].startsWith("--") ? argv[0] : "scan").toLowerCase();
const config = configLib.load(argv);

const stamp = () => new Date().toLocaleTimeString("ru-RU", { timeZone: config.tz });
const say = (...parts) => console.log(stamp() + "  " + parts.join(" "));

/* ---------------- wiring ---------------- */

function build() {
  const store = new Store(config.dataFile);
  const notify = notifyLib.notifier(config);
  const engine = scanner({ config, store, notify });
  return { store, notify, engine };
}

function watchlist() {
  return config.symbols.length * config.timeframes.length;
}

function shortestTimeframe() {
  const known = config.timeframes.filter(market.known);
  if (!known.length) return "1h";
  return known.reduce((a, b) => (market.msOf(a) <= market.msOf(b) ? a : b));
}

/** Addresses of this machine on the local network, for a phone to use. */
function lanAddresses() {
  const nets = require("os").networkInterfaces();
  const found = [];
  Object.keys(nets).forEach(name => {
    (nets[name] || []).forEach(net => {
      if (net.family === "IPv4" && !net.internal) found.push(net.address);
    });
  });
  return found;
}

function reportLine(report) {
  return "проверено " + report.results.length + ", найдено " + report.found +
    ", отправлено " + report.sent +
    (report.errors.length ? ", ошибок " + report.errors.length : "");
}

/* ---------------- commands ---------------- */

async function cmdScan() {
  const { store, notify, engine } = build();
  say("Слежу за " + config.symbols.join(", ") + " на " + config.timeframes.join(", ") +
      " · порог " + config.minScore + " · выход в " + notify.ready.join(", "));
  notify.missing.forEach(m => say("Не настроено: " + m));
  if (config.dry) say("Холостой прогон: ничего не отправляю.");

  const report = await engine.scanAll();
  report.errors.forEach(e => say("Ошибка: " + e));
  report.delivered.forEach(d => {
    if (!d.sent) say("Пропущено (" + d.why + "): " + d.setup.symbol + " " + d.setup.tf + " " + d.setup.kind);
  });
  say(reportLine(report));
  if (!report.found) say("Сейчас ничего не подходит под условия. Это нормальный результат.");
  return report;
}

async function cmdWatch() {
  const { notify, engine } = build();
  const tf = shortestTimeframe();
  say("Наблюдение: " + watchlist() + " пар·таймфреймов, шаг по закрытию " + tf +
      " · выход в " + notify.ready.join(", "));
  notify.missing.forEach(m => say("Не настроено: " + m));

  const loop = async () => {
    try {
      const report = await engine.scanAll();
      report.errors.forEach(e => say("Ошибка: " + e));
      say(reportLine(report));
    } catch (e) {
      say("Проход не удался: " + e.message);
    }
    schedule();
  };

  const schedule = () => {
    const custom = config.intervalMinutes > 0 ? config.intervalMinutes * 60e3 : 0;
    /* A few seconds after the bar closes: exchanges need a moment to
       publish the finished candle. */
    const wait = custom
      ? custom
      : Math.max(5e3, market.nextClose(tf) - Date.now() + 8e3);
    say("Следующий проход через " + Math.round(wait / 1000) + " с");
    timer = setTimeout(loop, wait);
  };

  let timer = null;
  await loop();
  process.on("SIGINT", () => { clearTimeout(timer); say("Остановлено."); process.exit(0); });
  return new Promise(() => {});
}

async function cmdServe() {
  const { store, notify, engine } = build();
  const instance = server.create({
    config, store, log: say,
    scan: alert => engine.scanAlert(alert).then(r => {
      if (!r.result.setups.length) {
        say("По алерту " + alert.symbol + " " + alert.tf + " ничего не нашлось.");
      }
      return r;
    }),
    scanAll: () => engine.scanAll()
  });

  await new Promise(resolve => instance.listen(config.port, config.host, resolve));
  const open = config.host === "0.0.0.0" || config.host === "::";
  const base = "http://" + (open ? "127.0.0.1" : config.host) + ":" + config.port;
  say("Страница: " + base);

  /* Bound to every interface means the phone on the same Wi-Fi can open
     it — but only if it knows which address to type. */
  if (open) {
    lanAddresses().forEach(address => say("  с телефона в этой же сети: http://" + address + ":" + config.port));
    say("  страница открыта всем в этой сети — в чужом Wi-Fi так лучше не запускать");
  }

  say("Вебхук TradingView: " + base + "/tv" +
      (config.webhookSecret ? "" : "  — секрет не задан, приём выключен"));
  say("Выход в: " + notify.ready.join(", "));
  notify.missing.forEach(m => say("Не настроено: " + m));

  if (!config.once) {
    const tf = shortestTimeframe();
    const tick = async () => {
      try {
        const report = await engine.scanAll();
        report.errors.forEach(e => say("Ошибка: " + e));
        say(reportLine(report));
      } catch (e) { say("Проход не удался: " + e.message); }
      const wait = config.intervalMinutes > 0
        ? config.intervalMinutes * 60e3
        : Math.max(5e3, market.nextClose(tf) - Date.now() + 8e3);
      setTimeout(tick, wait);
    };
    tick();
  }
  return new Promise(() => {});
}

async function cmdSelftest() {
  let bad = 0;
  const check = (name, ok, note) => {
    console.log((ok ? "  ок    " : "  СБОЙ  ") + name + (note ? " — " + note : ""));
    if (!ok) bad++;
  };

  console.log("\n1. Арифметика (работает без интернета)");
  try {
    execFileSync(process.execPath, [path.join(__dirname, "tests", "run.cjs")], { stdio: "pipe" });
    check("индикаторы и детекторы на заранее известных паттернах", true);
  } catch (e) {
    check("индикаторы и детекторы", false, "npm test падает");
  }

  console.log("\n2. Настройки");
  check("список пар не пуст", config.symbols.length > 0);
  check("таймфреймы известны", config.timeframes.every(market.known),
        config.timeframes.filter(t => !market.known(t)).join(", "));
  check("порог осмысленный", config.minScore >= 0 && config.minScore <= 100);
  check("файл настроек", true, config.hasConfigFile ? config.configFile : "нет, взяты значения по умолчанию");
  check("секрет вебхука задан", Boolean(config.webhookSecret),
        config.webhookSecret ? null : "без него /tv не принимает алерты (node scout.js secret)");
  check("Telegram настроен", Boolean(config.telegramToken && config.telegramChatId),
        config.telegramToken && config.telegramChatId ? null : "нет TELEGRAM_TOKEN / TELEGRAM_CHAT_ID");

  console.log("\n3. Биржа");
  const symbol = config.symbols[0], tf = config.timeframes[0];
  try {
    const data = await market.klines(symbol, tf, 240, { sources: config.sources });
    const last = data.candles[data.candles.length - 1];
    check("свечи " + symbol + " " + tf, data.candles.length >= 200,
          data.source + ", " + data.candles.length + " шт, последняя закрыта " +
          new Date(last.t).toLocaleString("ru-RU", { timeZone: config.tz }) + ", цена " + last.c);
    const found = setupsLib.detect(symbol, tf, data.candles, { minScore: 0 });
    check("детекторы отработали на живых данных", true,
          found.length ? found.map(s => s.kind + " " + s.score).join(", ") : "сейчас ничего нет");
  } catch (e) {
    check("свечи " + symbol + " " + tf, false, e.message);
  }

  console.log("\n4. Telegram");
  const notify = notifyLib.notifier(config);
  if (!notify.telegram.ready) {
    check("отправка сообщения", false, notify.telegram.why);
  } else {
    try {
      await notify.telegram.text("Meridian Scout на связи. Это проверка: сканер настроен и может писать сюда.");
      check("отправка сообщения", true, "проверьте чат");
    } catch (e) {
      check("отправка сообщения", false, e.message);
    }
  }

  console.log(bad ? "\n" + bad + " пункт(ов) не прошли.\n" : "\nВсё на месте.\n");
  process.exitCode = bad ? 1 : 0;
}

function cmdSecret() {
  const secret = tv.makeSecret();
  console.log("\nСекрет для вебхука:\n\n  " + secret + "\n");
  console.log("Передайте его сканеру одним из способов:\n");
  console.log("  export SCOUT_SECRET=" + secret);
  console.log("  или добавьте \"webhookSecret\": \"" + secret + "\" в scout.config.json\n");
  console.log("Дальше: node scout.js alert — покажет, что вставить в TradingView.\n");
}

function cmdAlert() {
  const template = tv.templateFor(config.webhookSecret, "{{strategy.order.alert_message}}");
  console.log("\nВ TradingView: «Создать оповещение» → вкладка «Уведомления» →");
  console.log("Webhook URL:\n\n  http://<адрес этого компьютера>:" + config.port + "/tv\n");
  console.log("Сообщение (вкладка «Настройки», поле «Сообщение»):\n");
  console.log("  " + template.json + "\n");
  console.log("Или то же самое строкой, если не хочется скобок:\n");
  console.log("  " + template.text + "\n");
  if (!config.webhookSecret) console.log("Секрет ещё не задан — сначала node scout.js secret\n");
  console.log("Вебхуки в TradingView доступны на платных тарифах — это их ограничение.\n");
}

function cmdHelp() {
  /* The comment at the top of this file is the help text — one place to
     keep it right. */
  const head = require("fs").readFileSync(__filename, "utf8").split("*/")[0];
  console.log(head.slice(head.indexOf("/**") + 3).replace(/^ \* ?/gm, "").trim() + "\n");
}

const COMMANDS = {
  scan: cmdScan, watch: cmdWatch, serve: cmdServe, selftest: cmdSelftest,
  secret: cmdSecret, alert: cmdAlert, help: cmdHelp
};

(async function main() {
  const run = COMMANDS[command];
  if (!run) {
    console.log("Неизвестная команда: " + command);
    cmdHelp();
    process.exit(1);
  }
  try {
    await run();
  } catch (e) {
    console.error("\nНе получилось: " + (e && e.message ? e.message : e));
    process.exit(1);
  }
})();
