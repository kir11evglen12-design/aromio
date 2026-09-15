/**
 * The service around the engine: storage, the webhook, the HTTP surface.
 *
 * None of this touches an exchange. What can be checked without a network
 * is checked here and runs anywhere; what genuinely needs one lives in
 * `node scout.js selftest`, which says out loud what it could not reach.
 */
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const { Store } = require("../lib/store.js");
const tv = require("../lib/tv.js");
const market = require("../lib/market.js");
const server = require("../lib/server.js");
const notifyLib = require("../lib/notify.js");
const { scanner } = require("../lib/scanner.js");
const setupsLib = require("../lib/setups.js");
const F = require("./fixtures.js");

let fails = 0;
const ok = (name, cond, extra) => {
  if (!cond) { fails++; console.log("FAIL " + name + (extra == null ? "" : " — " + extra)); }
  else console.log("ok   " + name);
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "scout-test-"));
const dataFile = path.join(tmp, "nested", "scout.json");

/* A real setup to push through the pipes. */
const fixture = F.breakRetestLong();
const SETUP = setupsLib.detect(fixture.symbol, fixture.tf, fixture.candles)[0];

/* ---------------- store ---------------- */

{
  const store = new Store(dataFile);
  ok("a missing file is just an empty store", store.data.setups.length === 0);
  ok("the first setup is new", store.add(SETUP) === true);
  ok("the same setup is not new twice", store.add(SETUP) === false);
  ok("it can be found by id", store.has(SETUP.id));
  store.addAlert({ symbol: "BTCUSDT", tf: "1h", note: "тест" });
  store.noteScan("BTCUSDT", "1h", { source: "binance", bars: 400, found: 0 });
  store.save();

  ok("the file lands where it was asked to", fs.existsSync(dataFile));
  const again = new Store(dataFile);
  ok("everything survives a reload",
     again.data.setups.length === 1 && again.data.alerts.length === 1 &&
     Object.keys(again.data.scans).length === 1);
  ok("the reloaded setup is the same one", again.data.setups[0].id === SETUP.id);
  ok("nothing is left half-written", !fs.existsSync(dataFile + ".tmp"));

  again.data.setups[0].found = Date.now() - 40 * 86400e3;
  ok("pruning drops what is too old to matter", again.prune(30) === 1 && again.data.setups.length === 0);

  fs.writeFileSync(dataFile, "{ это не json");
  const broken = new Store(dataFile);
  ok("a corrupt file does not take the program down", broken.data.setups.length === 0);
  ok("and it is kept rather than overwritten",
     fs.readdirSync(path.dirname(dataFile)).some(f => f.includes(".broken-")));
}

/* ---------------- the webhook payload ---------------- */

{
  const secret = tv.makeSecret();
  ok("a generated secret is long enough to be one", secret.length >= 24);

  const template = tv.templateFor(secret);
  const filled = template.json
    .replace("{{ticker}}", "BINANCE:ETHUSDT").replace("{{interval}}", "240").replace("{{close}}", "3210.5");
  const parsed = tv.parse(filled);
  ok("the template we tell people to paste parses",
     parsed.ok && parsed.alert.symbol === "ETHUSDT" && parsed.alert.tf === "4h" && parsed.alert.price === 3210.5,
     JSON.stringify(parsed));
  ok("and the secret in it matches", tv.secretMatches(parsed.secret, secret));
  ok("a different secret does not", !tv.secretMatches("что-то другое", secret));
  ok("an empty configured secret never matches", !tv.secretMatches("", ""));

  const text = tv.parse("SCOUT|" + secret + "|BYBIT:BTCUSDT.P|60|sell|64000|слом");
  ok("the pipe form works too",
     text.ok && text.alert.symbol === "BTCUSDT" && text.alert.tf === "1h" && text.alert.side === "short");

  ok("a body that is not an alert is refused", tv.parse("привет").ok === false);
  ok("an alert without a ticker is refused", tv.parse('{"secret":"x","interval":"60"}').ok === false);
  ok("an interval we do not know is refused", tv.parse('{"secret":"x","ticker":"BTCUSDT","interval":"7"}').ok === false);
  ok("a huge note is cut down", tv.parse(JSON.stringify({
    secret: "x", ticker: "BTCUSDT", interval: "60", note: "a".repeat(5000)
  })).alert.raw.length <= 2001);
}

/* ---------------- candles ---------------- */

{
  const step = market.msOf("1h");
  const bars = [0, 1, 2].map(i => ({ t: i * step, o: 1, h: 1, l: 1, c: 1, v: 1 }));
  ok("the bar still forming is dropped", market.dropUnclosed(bars, "1h", 2 * step + 60e3).length === 2);
  ok("a closed last bar is kept", market.dropUnclosed(bars, "1h", 3 * step).length === 3);
  ok("the exchange prefix goes", market.normaliseSymbol("BINANCE:BTCUSDT") === "BTCUSDT");
  ok("so does the perpetual suffix", market.normaliseSymbol("bybit:ethusdt.p") === "ETHUSDT");
  ok("a malformed candle is thrown away", market.candle(1, 10, 5, 12, 8, 1) === null);
  ok("a sane candle is kept", market.candle(1, 10, 12, 9, 11, 3).h === 12);
  ok("the higher timeframe of 1h is 4h", market.higherOf("1h") === "4h");
  ok("nextClose lands on the next boundary",
     market.nextClose("1h", Date.UTC(2026, 0, 1, 10, 5)) === Date.UTC(2026, 0, 1, 11, 0));
}

/* ---------------- one message per pattern ---------------- */

{
  const store = new Store(path.join(tmp, "mute.json"));
  const sent = [];
  const notify = { send: async setup => { sent.push(setup.id); return [{ sink: "тест", ok: true }]; } };
  const config = { symbols: [], timeframes: [], cooldownBars: 6, sources: [] };
  const engine = scanner({ config, store, notify });

  const first = Object.assign({}, SETUP);
  const nextBar = Object.assign({}, SETUP, {
    id: SETUP.id + "+1", at: SETUP.at + market.msOf("1h")
  });
  const muchLater = Object.assign({}, SETUP, {
    id: SETUP.id + "+9", at: SETUP.at + 9 * market.msOf("1h")
  });

  (async () => {
    const a = await engine.deliver(first);
    const b = await engine.deliver(nextBar);
    const c = await engine.deliver(muchLater);
    const again = await engine.deliver(first);

    ok("the first finding is sent", a.sent === true);
    ok("the same pattern on the next bar is not", b.sent === false, b.why);
    ok("but it is still written down", store.has(nextBar.id));
    ok("after the cooldown it is sent again", c.sent === true, c.why);
    ok("a setup already recorded is never re-sent", again.sent === false && again.why === "уже было");
    ok("exactly two messages went out", sent.length === 2, sent.join(", "));
    await http();
  })();
}

/* ---------------- the HTTP surface ---------------- */

async function http() {
  const store = new Store(path.join(tmp, "http.json"));
  store.add(SETUP);
  store.save();

  const config = {
    symbols: ["BTCUSDT"], timeframes: ["1h"], minScore: 45, sources: ["binance"],
    tz: "Europe/Moscow", telegramToken: "", telegramChatId: "", webhookSecret: "",
    dataFile: store.file
  };

  const scanned = [];
  const instance = server.create({
    config, store, log: () => {},
    scan: async alert => { scanned.push(alert); return { result: { setups: [] }, delivered: [] }; },
    scanAll: async () => ({ found: 0, sent: 0, errors: [], delivered: [] })
  });

  await new Promise(resolve => instance.listen(0, "127.0.0.1", resolve));
  const base = "http://127.0.0.1:" + instance.address().port;
  const get = (url, init) => fetch(base + url, init);

  const health = await get("/health");
  ok("/health answers", health.status === 200 && (await health.json()).ok === true);

  const page = await get("/");
  ok("/ serves the dashboard",
     page.status === 200 && (await page.text()).includes("Meridian Scout"), page.status);
  const css = await get("/styles.css");
  ok("the stylesheet is served as css",
     css.status === 200 && css.headers.get("content-type").startsWith("text/css"));

  const missing = await get("/нет-такого");
  ok("an unknown path is a 404, not a crash", missing.status === 404);

  const escape = await get("/../lib/config.js");
  ok("a path trying to leave public/ gets nothing",
     escape.status === 404 || escape.status === 403, escape.status);

  const state = await get("/api/state");
  const body = await state.json();
  ok("/api/state carries the setups", body.setups.length === 1 && body.setups[0].id === SETUP.id);
  ok("/api/state never shows a secret",
     !JSON.stringify(body).includes("webhookSecret") && body.config.webhook === false);

  /* the webhook, before a secret is configured */
  let hook = await get("/tv", { method: "POST", body: "{}" });
  ok("without a configured secret the webhook is closed", hook.status === 503, hook.status);

  config.webhookSecret = "верный-секрет";
  hook = await get("/tv", {
    method: "POST",
    body: JSON.stringify({ secret: "чужой", ticker: "BTCUSDT", interval: "60" })
  });
  ok("a wrong secret is refused", hook.status === 401);
  ok("and nothing was scanned because of it", scanned.length === 0);

  hook = await get("/tv", {
    method: "POST",
    body: JSON.stringify({ secret: "верный-секрет", ticker: "BINANCE:ETHUSDT", interval: "240", note: "пробой" })
  });
  ok("the right secret is accepted", hook.status === 200);
  await new Promise(r => setTimeout(r, 50));
  ok("and the alert is scanned right away",
     scanned.length === 1 && scanned[0].symbol === "ETHUSDT" && scanned[0].tf === "4h",
     JSON.stringify(scanned));
  ok("the alert is written down", store.data.alerts.length === 1);

  hook = await get("/tv", { method: "POST", body: "не алерт" });
  ok("a body that is not an alert is a 400", hook.status === 400);

  const big = await get("/tv", { method: "POST", body: "x".repeat(server.MAX_BODY + 1000) })
    .catch(() => ({ status: 0 }));
  ok("an oversized body does not get through", big.status !== 200, String(big.status));

  const scanAll = await get("/api/scan", { method: "POST" });
  ok("/api/scan runs a pass", scanAll.status === 200 && (await scanAll.json()).found === 0);

  const wrongMethod = await get("/api/state", { method: "DELETE" });
  ok("an unsupported method is refused", wrongMethod.status === 405);

  instance.close();
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log(fails ? "\n" + fails + " FAILURES" : "\nall service checks passed");
  process.exit(fails ? 1 : 0);
}
