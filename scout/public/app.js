/**
 * The dashboard.
 *
 * Reads /api/state and draws it. No framework and no build step — the
 * page is served from the same process that does the scanning, and it
 * should stay something you can open and read.
 */
(function () {
  "use strict";

  var TF = { "1m": "1 мин", "5m": "5 мин", "15m": "15 мин", "30m": "30 мин",
             "1h": "1 час", "2h": "2 часа", "4h": "4 часа", "1d": "1 день" };
  var TV_TF = { "1m": "1", "5m": "5", "15m": "15", "30m": "30", "1h": "60", "2h": "120", "4h": "240", "1d": "D" };

  var state = { setups: [], alerts: [], scans: {}, config: null };
  var chosen = null;
  var chartFor = null;

  var el = {
    chips: document.getElementById("chips"),
    setups: document.getElementById("setups"),
    count: document.getElementById("count"),
    alerts: document.getElementById("alerts"),
    scans: document.getElementById("scans"),
    chart: document.getElementById("chart"),
    chartTitle: document.getElementById("chartTitle"),
    scan: document.getElementById("scan")
  };

  /* ---------- formatting ---------- */

  function price(value) {
    var v = Math.abs(value);
    var digits = v >= 1000 ? 2 : v >= 10 ? 3 : v >= 1 ? 4 : v >= 0.01 ? 6 : 8;
    return Number(value.toFixed(digits)).toLocaleString("ru-RU", { maximumFractionDigits: digits });
  }

  function dec(value) { return String(value).replace(".", ","); }

  function stars(score) {
    var filled = Math.max(1, Math.min(5, Math.round(score / 20)));
    return "★".repeat(filled) + "☆".repeat(5 - filled);
  }

  function when(ms) {
    var d = new Date(ms), now = new Date();
    var sameDay = d.toDateString() === now.toDateString();
    return d.toLocaleString("ru-RU", sameDay
      ? { hour: "2-digit", minute: "2-digit" }
      : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  }

  function node(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      if (key === "text") n.textContent = attrs[key];
      else if (key === "html") n.innerHTML = attrs[key];
      else if (key === "onclick") n.addEventListener("click", attrs[key]);
      else n.setAttribute(key, attrs[key]);
    });
    (children || []).forEach(function (child) { if (child) n.appendChild(child); });
    return n;
  }

  /* ---------- pieces ---------- */

  function chips(config) {
    el.chips.textContent = "";
    if (!config) return;
    [
      { label: "пары", value: config.symbols.length },
      { label: "таймфреймы", value: config.timeframes.join(" · ") },
      { label: "порог", value: config.minScore },
      { label: "данные", value: config.sources.join(" → ") }
    ].forEach(function (item) {
      el.chips.appendChild(node("span", { class: "chip", html: item.label + " <b>" + item.value + "</b>" }));
    });
    el.chips.appendChild(node("span", {
      class: "chip " + (config.telegram ? "chip--on" : "chip--off"),
      html: '<i class="dot"></i>Telegram ' + (config.telegram ? "включён" : "не настроен")
    }));
    el.chips.appendChild(node("span", {
      class: "chip " + (config.webhook ? "chip--on" : "chip--off"),
      html: '<i class="dot"></i>TradingView ' + (config.webhook ? "принимает алерты" : "секрет не задан")
    }));
  }

  function levels(setup) {
    var rows = [
      { name: "вход", value: price(setup.entry), cls: "" },
      { name: "стоп", value: price(setup.stop), cls: "level--stop" },
      { name: "цель 1", value: price(setup.targets[0]), cls: "level--target" },
      { name: "цель 2", value: setup.targets[1] == null ? "—" : price(setup.targets[1]), cls: "level--target" }
    ];
    return node("div", { class: "levels" }, rows.map(function (row) {
      return node("div", { class: "level " + row.cls }, [
        node("div", { class: "level__name", text: row.name }),
        node("div", { class: "level__value", text: row.value })
      ]);
    }));
  }

  function card(setup) {
    var active = chosen && chosen.id === setup.id;
    var box = node("div", {
      class: "setup" + (active ? " setup--active" : ""),
      onclick: function () { choose(setup); }
    }, [
      node("div", { class: "setup__top" }, [
        node("span", { class: "tag tag--pair", text: setup.symbol }),
        node("span", { class: "tag", text: TF[setup.tf] || setup.tf }),
        node("span", {
          class: "tag tag--" + setup.side,
          text: setup.side === "long" ? "ЛОНГ" : "ШОРТ"
        }),
        node("span", { class: "setup__score" }, [
          node("span", { class: "stars", text: stars(setup.score) }),
          node("span", { text: setup.score + "/100" })
        ])
      ]),
      node("div", { class: "setup__title", text: setup.title }),
      levels(setup),
      node("ul", { class: "reasons" }, setup.reasons.map(function (reason) {
        return node("li", { text: reason });
      })),
      node("div", { class: "setup__foot" }, [
        node("span", { text: "R:R " + dec(setup.rr1) + " → " + dec(setup.rr) }),
        node("span", { text: "риск " + dec(setup.riskPct) + " %" }),
        node("span", { text: "свеча " + when(setup.at) })
      ])
    ]);
    return box;
  }

  function drawSetups() {
    el.setups.textContent = "";
    el.count.textContent = state.setups.length ? state.setups.length + " за последнее время" : "";
    if (!state.setups.length) {
      el.setups.appendChild(node("div", {
        class: "empty",
        text: "Пока ничего не подошло под условия. Это нормальный результат — сетапы редки."
      }));
      return;
    }
    state.setups.forEach(function (setup) { el.setups.appendChild(card(setup)); });
  }

  function drawAlerts() {
    el.alerts.textContent = "";
    if (!state.alerts.length) {
      el.alerts.appendChild(node("div", { class: "empty", text: "Пока ни одного" }));
      return;
    }
    state.alerts.forEach(function (alert) {
      el.alerts.appendChild(node("div", { class: "alert" }, [
        node("b", { text: alert.symbol }),
        node("span", { text: TF[alert.tf] || alert.tf }),
        node("span", { text: alert.note || "" }),
        node("time", { text: when(alert.received) })
      ]));
    });
  }

  function drawScans() {
    el.scans.textContent = "";
    var keys = Object.keys(state.scans || {});
    if (!keys.length) {
      el.scans.appendChild(node("div", { class: "empty", text: "Ещё не проверял" }));
      return;
    }
    keys.sort().forEach(function (key) {
      var scan = state.scans[key];
      var parts = key.split("|");
      el.scans.appendChild(node("div", { class: "scan" + (scan.error ? " scan--bad" : "") }, [
        node("b", { text: parts[0] }),
        node("span", { text: TF[parts[1]] || parts[1] }),
        node("em", {
          text: scan.error
            ? scan.error
            : (scan.found ? scan.found + " найдено · " : "") + when(scan.at) + " · " + scan.source
        })
      ]));
    });
  }

  /* ---------- the chart ---------- */

  function choose(setup) {
    chosen = setup;
    drawSetups();
    drawChart(setup.symbol, setup.tf);
  }

  /**
   * TradingView's own embed. It is the only legitimate way to show their
   * chart, and it needs the network — offline the panel simply stays empty.
   */
  function drawChart(symbol, tf) {
    var key = symbol + "|" + tf;
    if (chartFor === key) return;
    chartFor = key;
    el.chartTitle.textContent = symbol + " · " + (TF[tf] || tf);
    el.chart.textContent = "";

    el.chart.appendChild(node("div", {
      class: "chart__hint",
      text: "График рисует TradingView — для него нужен интернет"
    }));

    var holder = node("div", { class: "tradingview-widget-container" });
    var slot = node("div", {});
    holder.appendChild(slot);
    el.chart.appendChild(holder);

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.text = JSON.stringify({
      symbol: "BINANCE:" + symbol,
      interval: TV_TF[tf] || "60",
      theme: "dark",
      style: "1",
      locale: "ru",
      autosize: true,
      hide_side_toolbar: true,
      allow_symbol_change: false,
      backgroundColor: "#08111f",
      gridColor: "rgba(156, 187, 255, 0.06)"
    });
    holder.appendChild(script);
  }

  /* ---------- talking to the service ---------- */

  function refresh() {
    return fetch("/api/state")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        state = data;
        chips(data.config);
        drawSetups();
        drawAlerts();
        drawScans();
        if (!chosen && data.setups.length) choose(data.setups[0]);
        else if (!chosen && data.config && data.config.symbols.length) {
          drawChart(data.config.symbols[0], data.config.timeframes[0] || "1h");
        }
      })
      .catch(function () {
        el.setups.textContent = "";
        el.setups.appendChild(node("div", { class: "empty", text: "Сервис не отвечает. Запущен ли node scout.js serve?" }));
      });
  }

  el.scan.addEventListener("click", function () {
    el.scan.disabled = true;
    el.scan.querySelector(".btn__label").textContent = "Проверяю…";
    fetch("/api/scan", { method: "POST" })
      .then(function (res) { return res.json(); })
      .then(function (report) {
        el.scan.querySelector(".btn__label").textContent =
          report.found ? "Найдено: " + report.found : "Пока ничего";
        return refresh();
      })
      .catch(function () { el.scan.querySelector(".btn__label").textContent = "Не вышло"; })
      .then(function () {
        setTimeout(function () {
          el.scan.disabled = false;
          el.scan.querySelector(".btn__label").textContent = "Проверить сейчас";
        }, 2200);
      });
  });

  refresh();
  setInterval(refresh, 30000);
})();
