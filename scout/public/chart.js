/**
 * A candlestick chart drawn from the same candles the detectors read.
 *
 * The TradingView widget is the right thing to show for a live pair, but
 * it needs their servers, and it cannot draw a series that only exists in
 * this page. This draws exactly what was analysed, with the entry, the
 * stop and the targets on it — so the levels can be checked against the
 * bars they were derived from.
 */
(function (global) {
  "use strict";

  var W = 640, H = 300, PAD_R = 62, PAD_T = 12, PAD_B = 18, PAD_L = 6;

  function svgEl(name, attrs) {
    var node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attrs || {}).forEach(function (key) { node.setAttribute(key, attrs[key]); });
    return node;
  }

  /**
   * `setup` is optional; when given, its levels are drawn as lines and the
   * scale is widened so none of them fall off the top or the bottom.
   */
  function candles(host, series, setup, priceOf) {
    host.textContent = "";
    if (!series || series.length < 2) return;

    var bars = series.slice(-90);
    var lo = Infinity, hi = -Infinity;
    bars.forEach(function (bar) { lo = Math.min(lo, bar.l); hi = Math.max(hi, bar.h); });

    var lines = [];
    if (setup) {
      lines.push({ value: setup.entry, cls: "entry", name: "вход" });
      lines.push({ value: setup.stop, cls: "stop", name: "стоп" });
      setup.targets.forEach(function (target, i) {
        lines.push({ value: target, cls: "target", name: "цель " + (i + 1) });
      });
      lines.forEach(function (line) { lo = Math.min(lo, line.value); hi = Math.max(hi, line.value); });
    }

    var span = hi - lo || 1;
    lo -= span * 0.06;
    hi += span * 0.06;

    var plot = W - PAD_R - PAD_L;
    var height = H - PAD_T - PAD_B;
    var step = plot / bars.length;
    var body = Math.max(1.4, Math.min(step * 0.62, 9));
    var y = function (price) { return PAD_T + (hi - price) / (hi - lo) * height; };
    var x = function (i) { return PAD_L + step * (i + 0.5); };

    var svg = svgEl("svg", {
      class: "candles", viewBox: "0 0 " + W + " " + H,
      preserveAspectRatio: "none", role: "img",
      "aria-label": "Свечной график ряда, по которому найден сетап"
    });

    bars.forEach(function (bar, i) {
      var up = bar.c >= bar.o;
      var cls = "candle " + (up ? "candle--up" : "candle--down");
      svg.appendChild(svgEl("line", {
        class: cls, x1: x(i), x2: x(i), y1: y(bar.h), y2: y(bar.l), "stroke-width": 1
      }));
      var top = y(Math.max(bar.o, bar.c));
      var bottom = y(Math.min(bar.o, bar.c));
      svg.appendChild(svgEl("rect", {
        class: cls, x: x(i) - body / 2, y: top,
        width: body, height: Math.max(1, bottom - top)
      }));
    });

    lines.forEach(function (line) {
      var at = y(line.value);
      svg.appendChild(svgEl("line", {
        class: "mark mark--" + line.cls,
        x1: 0, x2: W - PAD_R + 2, y1: at, y2: at
      }));
      var label = svgEl("text", {
        class: "mark__text mark--" + line.cls, x: W - PAD_R + 7,
        y: at + 3.5
      });
      label.textContent = (priceOf ? priceOf(line.value) : line.value.toFixed(2));
      svg.appendChild(label);
      var name = svgEl("text", { class: "mark__name", x: 4, y: at - 4 });
      name.textContent = line.name;
      svg.appendChild(name);
    });

    host.appendChild(svg);
  }

  global.ScoutUI = global.ScoutUI || {};
  global.ScoutUI.candles = candles;
})(typeof window !== "undefined" ? window : globalThis);
