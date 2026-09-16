/**
 * The standalone page: the scanner with no service behind it.
 *
 * Binance and Bybit answer public kline requests from a browser, so the
 * same `market.js` and the same detectors that the service runs can run
 * here, in the tab, on real candles. That makes this page an honest
 * showcase rather than a screenshot with made-up numbers.
 *
 * What it cannot be is a watchman. A page only works while it is open, it
 * cannot write to Telegram and TradingView cannot reach it with a
 * webhook. Those need `scout.js` running somewhere that stays on, and the
 * page says so rather than pretending otherwise.
 */
(function () {
  "use strict";

  var UI = window.ScoutUI;
  var market = window.Market;
  var setups = window.Setups;
  var node = UI.node;

  var STORE = "scout.web.v1";
  var TIMEFRAMES = ["15m", "1h", "4h", "1d"];

  var prefs = load() || { symbols: ["BTCUSDT", "ETHUSDT", "SOLUSDT"], timeframes: ["1h", "4h"], minScore: 45 };
  var found = [];
  var scans = [];
  var chosen = null;
  var chartFor = null;
  var running = false;
  var demoMode = false;
  var series = {};                        // symbol|tf -> candles, for drawing what was analysed

  /* Only the demo build carries these: series with a known pattern inside,
     so the page can still show what a setup looks like where no exchange
     is reachable. */
  var demoSets = (window.SCOUT_DEMO || []).map(function (set) {
    return {
      symbol: set.symbol, tf: set.tf, htfTrend: set.htfTrend || null,
      candles: set.candles.map(function (row) {
        return { t: row[0], o: row[1], h: row[2], l: row[3], c: row[4], v: row[5] };
      })
    };
  });

  var el = {
    symbols: document.getElementById("symbols"),
    tfs: document.getElementById("tfs"),
    score: document.getElementById("score"),
    scan: document.getElementById("scan"),
    setups: document.getElementById("setups"),
    count: document.getElementById("count"),
    scans: document.getElementById("scans"),
    chart: document.getElementById("chart"),
    chartTitle: document.getElementById("chartTitle"),
    status: document.getElementById("status"),
    banner: document.getElementById("banner"),
    chartSource: document.getElementById("chartSource"),
    chartNote: document.getElementById("chartNote")
  };

  var CHART_NOTE = el.chartNote ? el.chartNote.textContent : "";

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE)); } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(prefs)); } catch (e) { /* private mode */ }
  }

  /* ---------- controls ---------- */

  function drawControls() {
    el.symbols.value = prefs.symbols.join(", ");

    el.tfs.textContent = "";
    TIMEFRAMES.forEach(function (tf) {
      var on = prefs.timeframes.indexOf(tf) >= 0;
      el.tfs.appendChild(node("button", {
        class: "toggle" + (on ? " toggle--on" : ""),
        type: "button",
        text: UI.TF[tf] || tf,
        onclick: function () {
          var i = prefs.timeframes.indexOf(tf);
          if (i >= 0) { if (prefs.timeframes.length > 1) prefs.timeframes.splice(i, 1); }
          else prefs.timeframes.push(tf);
          prefs.timeframes.sort(function (a, b) { return market.msOf(a) - market.msOf(b); });
          save();
          drawControls();
        }
      }));
    });

    el.score.value = String(prefs.minScore);
  }

  function readSymbols() {
    var raw = el.symbols.value.split(/[,\s]+/).map(market.normaliseSymbol).filter(Boolean);
    prefs.symbols = raw.length ? raw.slice(0, 8) : ["BTCUSDT"];
    save();
    drawControls();
  }

  /* ---------- scanning ---------- */

  function status(text, kind) {
    el.status.textContent = text || "";
    el.status.className = "status" + (kind ? " status--" + kind : "");
  }

  async function scanAll() {
    if (running) return;
    running = true;
    el.scan.disabled = true;
    found = [];
    scans = [];
    var trends = {};
    var total = prefs.symbols.length * prefs.timeframes.length;
    var done = 0;

    for (var s = 0; s < prefs.symbols.length; s++) {
      for (var t = 0; t < prefs.timeframes.length; t++) {
        var symbol = prefs.symbols[s], tf = prefs.timeframes[t];
        status("Считаю " + symbol + " " + (UI.TF[tf] || tf) + "… (" + (done + 1) + " из " + total + ")");
        try {
          var data = await market.klines(symbol, tf, 400);

          /* the higher timeframe, once per pair */
          var htf = market.higherOf(tf);
          if (htf !== tf && trends[symbol + htf] === undefined) {
            try {
              var above = await market.klines(symbol, htf, 260);
              trends[symbol + htf] = setups.trendOf(above.candles);
            } catch (e) { trends[symbol + htf] = null; }
          }

          var list = setups.detect(symbol, tf, data.candles, {
            htfTrend: trends[symbol + htf] || null,
            minScore: prefs.minScore
          });
          var last = data.candles[data.candles.length - 1];
          series[symbol + "|" + tf] = data.candles;
          scans.push({
            symbol: symbol, tf: tf, source: data.source, price: last.c,
            at: last.t, found: list.length
          });
          list.forEach(function (setup) { found.push(setup); });
        } catch (e) {
          scans.push({ symbol: symbol, tf: tf, error: shortError(e) });
        }
        done++;
        draw();
      }
    }

    found.sort(function (a, b) { return b.score - a.score; });
    var broke = scans.filter(function (scan) { return scan.error; });
    if (broke.length === scans.length) {
      status("Ни одна биржа не ответила. Обычно это блокировка сети или расширение в браузере — " +
             "попробуйте другую сеть или откройте страницу в другом браузере.", "bad");
    } else {
      status("Обновлено " + UI.when(Date.now()) + " · " +
             (found.length ? "найдено " + found.length : "сейчас ничего не подходит") +
             (broke.length ? " · не ответили: " + broke.length : ""));
    }
    draw();
    running = false;
    el.scan.disabled = false;
  }

  function shortError(e) {
    var text = e && e.message ? e.message : String(e);
    return text.length > 120 ? text.slice(0, 120) + "…" : text;
  }

  /* ---------- drawing ---------- */

  function draw() {
    el.setups.textContent = "";
    el.count.textContent = found.length ? found.length + " найдено" : "";

    if (!found.length) {
      el.setups.appendChild(node("div", {
        class: "empty",
        text: running
          ? "Считаю…"
          : "Сейчас ничего не подходит под условия. Это нормальный результат — сетапы редки. " +
            "Можно снизить порог или добавить пары."
      }));
    } else {
      found.forEach(function (setup) {
        el.setups.appendChild(UI.card(setup, {
          active: chosen && chosen.id === setup.id,
          onPick: function () { choose(setup); }
        }));
      });
      if (!chosen) choose(found[0]);
    }

    el.scans.textContent = "";
    if (!scans.length) {
      el.scans.appendChild(node("div", { class: "empty", text: "Ещё не проверял" }));
    }
    scans.forEach(function (scan) {
      el.scans.appendChild(node("div", { class: "scan" + (scan.error ? " scan--bad" : "") }, [
        node("b", { text: scan.symbol }),
        node("span", { text: UI.TF[scan.tf] || scan.tf }),
        node("em", {
          text: scan.error
            ? scan.error
            : (scan.found ? scan.found + " найдено · " : "") + UI.price(scan.price) + " · " + scan.source
        })
      ]));
    });
  }

  function choose(setup) {
    chosen = setup;
    var key = setup.symbol + "|" + setup.tf;
    if (chartFor !== key) {
      chartFor = key;
      showChart(setup);
    }
    draw();
  }

  /** Our own candles for a made-up series, TradingView for a real pair. */
  function showChart(setup) {
    var bars = series[setup.symbol + "|" + setup.tf];
    var own = function () {
      el.chartTitle.textContent = setup.symbol + " · " + (UI.TF[setup.tf] || setup.tf);
      el.chart.textContent = "";
      UI.candles(el.chart, bars, setup, UI.price);
    };
    if (demoMode) return own();
    UI.chart(el.chart, setup.symbol, setup.tf, el.chartTitle, bars ? own : null);
  }

  /* ---------- demo ---------- */

  /** One quick question: is any exchange reachable from here at all? */
  async function reachable() {
    try { await market.klines("BTCUSDT", "1h", 60, { timeout: 4000 }); return true; }
    catch (e) { return false; }
  }

  function runDemo() {
    demoMode = true;
    chosen = null;
    chartFor = null;
    found = [];
    scans = [];
    if (el.banner) el.banner.hidden = false;
    setChartLabels(true);
    setControls(false);

    demoSets.forEach(function (set) {
      series[set.symbol + "|" + set.tf] = set.candles;
      var list = setups.detect(set.symbol, set.tf, set.candles, { htfTrend: set.htfTrend, minScore: 0 });
      list.forEach(function (setup) { found.push(setup); });
      scans.push({
        symbol: set.symbol, tf: set.tf, source: "встроенный ряд",
        price: set.candles[set.candles.length - 1].c, found: list.length
      });
    });
    found.sort(function (a, b) { return b.score - a.score; });
    status("Здесь нет доступа к бирже — показан разбор встроенных рядов, это не живые цены.", "bad");
    draw();
  }

  async function start() {
    if (running) return;
    /* Some windows have no way out to an exchange at all — a sandboxed
       frame, for one. Asking anyway would only spend a second failing. */
    if (window.SCOUT_OFFLINE && demoSets.length) return runDemo();
    if (demoSets.length) {
      status("Проверяю, отвечает ли биржа…");
      el.scan.disabled = true;
      var live = await reachable();
      el.scan.disabled = false;
      if (!live) return runDemo();
      demoMode = false;
      if (el.banner) el.banner.hidden = true;
      setChartLabels(false);
      setControls(true);
    }
    return scanAll();
  }

  /** The chart panel has to say who actually drew what is in it. */
  function setChartLabels(demo) {
    if (el.chartSource) el.chartSource.textContent = demo ? "рисует Scout" : "TradingView";
    if (el.chartNote) {
      el.chartNote.textContent = demo
        ? "Свечи нарисованы этой страницей — это ровно тот ряд, по которому найден сетап, с уровнями входа, стопа и целей. На живых парах здесь стоит график TradingView."
        : CHART_NOTE;
    }
  }

  /** In demo mode the watchlist controls have nothing to act on. */
  function setControls(on) {
    [el.symbols, el.score].forEach(function (node) { if (node) node.disabled = !on; });
    Array.prototype.forEach.call(el.tfs.querySelectorAll("button"), function (node) { node.disabled = !on; });
    el.tfs.style.opacity = el.symbols.style.opacity = el.score.style.opacity = on ? "" : ".5";
  }

  /* ---------- go ---------- */

  el.scan.addEventListener("click", start);
  el.symbols.addEventListener("change", readSymbols);
  el.symbols.addEventListener("blur", readSymbols);
  el.score.addEventListener("change", function () {
    prefs.minScore = parseInt(el.score.value, 10) || 0;
    save();
  });

  drawControls();
  draw();
  if (!demoSets.length) UI.chart(el.chart, prefs.symbols[0], prefs.timeframes[0], el.chartTitle);
  start();
})();
