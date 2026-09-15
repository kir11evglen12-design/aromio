/**
 * The local service: a page to look at and an ear for TradingView.
 *
 * Bound to 127.0.0.1 by default, because the moment it listens on a
 * public address the webhook is reachable by anyone who guesses the path.
 * It is still protected by the secret, but there is no reason to expose
 * the dashboard along with it.
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const tv = require("./tv.js");
const configLib = require("./config.js");

const PUBLIC = path.join(__dirname, "..", "public");
const MAX_BODY = 64 * 1024;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

function send(res, status, body, type) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": type || "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    "x-content-type-options": "nosniff"
  });
  res.end(payload);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error("тело запроса слишком большое")); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** Static files, and only the ones that are really inside public/. */
function serveStatic(res, urlPath) {
  const wanted = urlPath === "/" ? "/index.html" : urlPath;
  const file = path.join(PUBLIC, path.normalize(wanted).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(PUBLIC + path.sep) && file !== path.join(PUBLIC, "index.html")) {
    return send(res, 403, { error: "нельзя" });
  }
  fs.readFile(file, (err, data) => {
    if (err) return send(res, 404, { error: "нет такой страницы" });
    send(res, 200, data, TYPES[path.extname(file)] || "application/octet-stream");
  });
}

function create(options) {
  const { config, store, scan, log } = options;
  const say = log || console.log;

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://" + (req.headers.host || "localhost"));
    const route = url.pathname.replace(/\/+$/, "") || "/";

    try {
      /* ---- the TradingView webhook ---- */
      if (route === "/tv" && req.method === "POST") {
        if (!config.webhookSecret) {
          say("Вебхук отклонён: не задан секрет (SCOUT_SECRET).");
          return send(res, 503, { error: "вебхук выключен: не задан секрет" });
        }
        const body = await readBody(req);
        const parsed = tv.parse(body);
        if (!parsed.ok) {
          say("Вебхук не разобран: " + parsed.error);
          return send(res, 400, { error: parsed.error });
        }
        if (!tv.secretMatches(parsed.secret, config.webhookSecret)) {
          say("Вебхук с неверным секретом: " + parsed.alert.symbol + " " + parsed.alert.tf);
          return send(res, 401, { error: "неверный секрет" });
        }

        store.addAlert(parsed.alert);
        say("Алерт TradingView: " + parsed.alert.symbol + " " + parsed.alert.tf +
            (parsed.alert.note ? " — " + parsed.alert.note : ""));

        /* Answer TradingView immediately; it retries on a slow reply. */
        send(res, 200, { ok: true, symbol: parsed.alert.symbol, tf: parsed.alert.tf });
        scan(parsed.alert).catch(e => say("Не удалось проверить алерт: " + e.message));
        return;
      }

      if (route === "/health") return send(res, 200, { ok: true, now: Date.now() });

      if (route === "/api/state" && req.method === "GET") {
        return send(res, 200, {
          now: Date.now(),
          config: configLib.publicView(config),
          setups: store.recent(60),
          alerts: store.alerts(20),
          scans: store.data.scans,
          updated: store.data.updated
        });
      }

      if (route === "/api/setups" && req.method === "GET") {
        const limit = Math.min(parseInt(url.searchParams.get("limit"), 10) || 50, 200);
        return send(res, 200, { setups: store.recent(limit) });
      }

      if (route === "/api/scan" && req.method === "POST") {
        const report = await options.scanAll();
        return send(res, 200, {
          found: report.found, sent: report.sent, errors: report.errors,
          setups: report.delivered.map(d => d.setup)
        });
      }

      if (req.method === "GET") return serveStatic(res, route);
      send(res, 405, { error: "метод не поддерживается" });
    } catch (e) {
      say("Ошибка запроса " + route + ": " + e.message);
      if (!res.headersSent) send(res, 500, { error: "внутренняя ошибка" });
    }
  });

  return server;
}

module.exports = { create, PUBLIC, MAX_BODY };
