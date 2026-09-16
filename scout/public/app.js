/**
 * The page served by `scout.js serve`.
 *
 * Reads /api/state and draws it. No framework and no build step — the
 * page comes from the same process that does the scanning, and it should
 * stay something you can open and read.
 */
(function () {
  "use strict";

  var UI = window.ScoutUI;
  var node = UI.node;

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
    state.setups.forEach(function (setup) {
      el.setups.appendChild(UI.card(setup, {
        active: chosen && chosen.id === setup.id,
        onPick: function () { choose(setup); }
      }));
    });
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
        node("span", { text: UI.TF[alert.tf] || alert.tf }),
        node("span", { text: alert.note || "" }),
        node("time", { text: UI.when(alert.received) })
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
        node("span", { text: UI.TF[parts[1]] || parts[1] }),
        node("em", {
          text: scan.error
            ? scan.error
            : (scan.found ? scan.found + " найдено · " : "") + UI.when(scan.at) + " · " + scan.source
        })
      ]));
    });
  }

  function choose(setup) {
    chosen = setup;
    drawSetups();
    show(setup.symbol, setup.tf);
  }

  function show(symbol, tf) {
    var key = symbol + "|" + tf;
    if (chartFor === key) return;
    chartFor = key;
    UI.chart(el.chart, symbol, tf, el.chartTitle);
  }

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
          show(data.config.symbols[0], data.config.timeframes[0] || "1h");
        }
      })
      .catch(function () {
        el.setups.textContent = "";
        el.setups.appendChild(node("div", {
          class: "empty",
          text: "Сервис не отвечает. Запущен ли node scout.js serve?"
        }));
      });
  }

  el.scan.addEventListener("click", function () {
    var label = el.scan.querySelector(".btn__label");
    el.scan.disabled = true;
    label.textContent = "Проверяю…";
    fetch("/api/scan", { method: "POST" })
      .then(function (res) { return res.json(); })
      .then(function (report) {
        label.textContent = report.found ? "Найдено: " + report.found : "Пока ничего";
        return refresh();
      })
      .catch(function () { label.textContent = "Не вышло"; })
      .then(function () {
        setTimeout(function () {
          el.scan.disabled = false;
          label.textContent = "Проверить сейчас";
        }, 2200);
      });
  });

  refresh();
  setInterval(refresh, 30000);
})();
