/**
 * Drawing a setup. Shared by both front ends.
 *
 * There are two: the page served by `scout.js serve`, which reads findings
 * from the service, and the standalone page, which scans in the browser
 * itself. They must show a setup identically — same numbers, same wording
 * — so the drawing lives here and each of them only supplies the data.
 */
(function (global) {
  "use strict";

  var TF = { "1m": "1 мин", "5m": "5 мин", "15m": "15 мин", "30m": "30 мин",
             "1h": "1 час", "2h": "2 часа", "4h": "4 часа", "1d": "1 день" };
  var TV_TF = { "1m": "1", "5m": "5", "15m": "15", "30m": "30", "1h": "60", "2h": "120", "4h": "240", "1d": "D" };

  /** Enough digits to tell two prices apart, and no more. */
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

  /** One finding, exactly as both pages show it. */
  function card(setup, options) {
    options = options || {};
    return node("div", {
      class: "setup" + (options.active ? " setup--active" : ""),
      onclick: options.onPick || function () {}
    }, [
      node("div", { class: "setup__top" }, [
        node("span", { class: "tag tag--pair", text: setup.symbol }),
        node("span", { class: "tag", text: TF[setup.tf] || setup.tf }),
        node("span", { class: "tag tag--" + setup.side, text: setup.side === "long" ? "ЛОНГ" : "ШОРТ" }),
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
  }

  /**
   * TradingView's own embed — the only legitimate way to show their chart.
   * It needs the network; offline the panel keeps the hint behind it.
   */
  function chart(host, symbol, tf, title) {
    host.textContent = "";
    if (title) title.textContent = symbol + " · " + (TF[tf] || tf);

    host.appendChild(node("div", {
      class: "chart__hint",
      text: "График рисует TradingView — для него нужен интернет"
    }));

    var holder = node("div", { class: "tradingview-widget-container" }, [node("div", {})]);
    host.appendChild(holder);

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

  global.ScoutUI = { TF: TF, TV_TF: TV_TF, price: price, dec: dec, stars: stars, when: when, node: node, card: card, chart: chart };
})(typeof window !== "undefined" ? window : globalThis);
