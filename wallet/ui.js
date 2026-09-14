/**
 * The small toolkit the screens are built from: DOM helpers, the icon set,
 * charts, sheets and toasts. No framework — the app is a handful of screens
 * that re-render from state, and that stays legible at this size.
 */
(function (global) {
  "use strict";

  var Vault = global.Vault;

  /* ---------- DOM ---------- */

  function h(tag, props, children) {
    var node = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (key) {
      var value = props[key];
      if (value == null || value === false) return;
      if (key === "class") node.className = value;
      else if (key === "html") node.innerHTML = value;
      else if (key === "text") node.textContent = value;
      else if (key.slice(0, 2) === "on") node.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key === "dataset") Object.assign(node.dataset, value);
      else node.setAttribute(key, value === true ? "" : value);
    });
    [].concat(children == null ? [] : children).forEach(function (child) {
      if (child == null || child === false) return;
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function frag(html) {
    var t = document.createElement("template");
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function esc(text) {
    return String(text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- icons (lucide-shaped, 24px grid, stroked) ---------- */

  var PATHS = {
    "arrow-down":      "M12 5v14M19 12l-7 7-7-7",
    "arrow-up":        "M12 19V5M5 12l7-7 7 7",
    "arrow-up-right":  "M7 17 17 7M7 7h10v10",
    "arrow-down-left": "M17 7 7 17M17 17H7V7",
    "arrow-left":      "M19 12H5M12 19l-7-7 7-7",
    "plus":            "M5 12h14M12 5v14",
    "x":               "M18 6 6 18M6 6l12 12",
    "check":           "M20 6 9 17l-5-5",
    "chevron-right":   "M9 18l6-6-6-6",
    "chevron-down":    "M6 9l6 6 6-6",
    "swap":            "M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3",
    "settings":        "M20 7h-9M14 17H5",
    "eye":             "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z",
    "eye-off":         "M9.9 4.24A9.1 9.1 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.16 3.19M6.6 6.6A18 18 0 0 0 2 12s3.5 7 10 7a9 9 0 0 0 5.4-1.6M2 2l20 20",
    "copy":            "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
    "alert":           "M21.73 18 13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3zM12 9v4M12 17h.01",
    "info":            "M12 16v-4M12 8h.01",
    "lock":            "M7 11V7a5 5 0 0 1 10 0v4",
    "key":             "M21 2l-9.6 9.6M15.5 7.5l3 3L22 7l-3-3",
    "shield":          "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    "card":            "M2 10h20",
    "image":           "M21 15l-3.09-3.09a2 2 0 0 0-2.82 0L6 21",
    "clock":           "M12 6v6l4 2",
    "trash":           "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
    "globe":           "M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
    "backspace":       "M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zM12 9l6 6M18 9l-6 6",
    "users":           "M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2M16 3.13a4 4 0 0 1 0 7.75M22 21v-2a4 4 0 0 0-3-3.87",
    "wallet":          "M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5M18 12h.01",
    "qr":              "M3 3h6v6H3zM15 3h6v6h-6zM3 15h6v6H3zM15 15h2v2h-2zM19 15h2v2h-2zM15 19h2v2h-2zM19 19h2v2h-2z",
    "zap":             "M13 2 4.1 12.6a1 1 0 0 0 .8 1.6H11l-1 7.8 8.9-10.6a1 1 0 0 0-.8-1.6H13z",
    "logout":          "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
    "refresh":         "M21 12a9 9 0 1 1-3-6.7M21 3v6h-6",
    "bell":            "M10.3 21a1.9 1.9 0 0 0 3.4 0M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9",
    "stake":           "M12 2 3 7l9 5 9-5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
    "search":          "m21 21-4.3-4.3",
    "calc":            "M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h4M16 18h.01"
  };

  /* icons that need a circle or rect alongside the path */
  var EXTRA = {
    "eye":      '<circle cx="12" cy="12" r="3"/>',
    "info":     '<circle cx="12" cy="12" r="10"/>',
    "clock":    '<circle cx="12" cy="12" r="10"/>',
    "globe":    '<circle cx="12" cy="12" r="10"/>',
    "lock":     '<rect x="3" y="11" width="18" height="11" rx="2"/>',
    "card":     '<rect x="2" y="5" width="20" height="14" rx="2"/>',
    "image":    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="1.6"/>',
    "copy":     '<rect x="9" y="9" width="13" height="13" rx="2"/>',
    "settings": '<circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>',
    "key":      '<circle cx="7.5" cy="15.5" r="5.5"/>',
    "users":    '<circle cx="9" cy="7" r="4"/>',
    "search":   '<circle cx="11" cy="11" r="8"/>',
    "calc":     '<rect x="4" y="2" width="16" height="20" rx="2"/>'
  };

  function icon(name, size) {
    var d = PATHS[name];
    if (!d) return "";
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' +
      (size ? ' width="' + size + '" height="' + size + '"' : "") + ">" +
      (EXTRA[name] || "") + '<path d="' + d + '"/></svg>';
  }

  /* ---------- identity colours ---------- */

  /** A coin badge in the token's own hue — one flat colour, dark type. */
  function coinBadge(token, size) {
    var style = "background:hsl(" + token.hue + " 72% 62%)" +
      (size ? ";width:" + size + "px;height:" + size + "px;font-size:" + Math.round(size * 0.31) + "px" : "");
    return '<span class="coin" style="' + style + '">' + esc(token.sym.slice(0, 3)) + "</span>";
  }

  /** Account avatar: two deterministic hues from the address. */
  function avatarStyle(seed) {
    var rnd = Vault.seedRandom("avatar/" + seed);
    /* One flat hue per account, kept inside cobalt-through-cyan so an
       avatar never reads as a different product's colour. */
    var hue = 194 + Math.floor(rnd() * 44);
    return "background:hsl(" + hue + " 76% 64%)";
  }

  function shortAddress(address, head, tail) {
    if (!address) return "";
    return address.slice(0, head || 4) + "…" + address.slice(-(tail || 4));
  }

  /* ---------- charts ---------- */

  function extent(values) {
    var lo = Infinity, hi = -Infinity;
    values.forEach(function (v) { if (v < lo) lo = v; if (v > hi) hi = v; });
    if (lo === hi) { lo -= 1; hi += 1; }
    return [lo, hi];
  }

  /** A tiny inline trend line for list rows. */
  function sparkline(values, up) {
    var w = 54, hgt = 22, pad = 2;
    var range = extent(values);
    var stepX = w / (values.length - 1);
    var pts = values.map(function (v, i) {
      var y = pad + (hgt - pad * 2) * (1 - (v - range[0]) / (range[1] - range[0]));
      return (i * stepX).toFixed(1) + " " + y.toFixed(1);
    });
    return '<svg class="spark" viewBox="0 0 ' + w + " " + hgt + '" fill="none" aria-hidden="true">' +
      '<polyline points="' + pts.join(" ") + '" stroke="' + (up ? "#24d6a0" : "#ff5c7c") +
      '" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  var chartSeq = 0;

  /**
   * The detail chart: filled area, live end point, and a crosshair that
   * reports the value under the pointer through `onHover`.
   */
  function areaChart(container, values, opts) {
    opts = opts || {};
    var up = values[values.length - 1] >= values[0];
    var stroke = up ? "#24d6a0" : "#ff5c7c";
    var w = 320, hgt = 168, pad = 14;
    var range = extent(values);
    var id = "cg" + (++chartSeq);

    var x = function (i) { return (i / (values.length - 1)) * w; };
    var y = function (v) { return pad + (hgt - pad * 2) * (1 - (v - range[0]) / (range[1] - range[0])); };

    var line = values.map(function (v, i) { return (i ? "L" : "M") + x(i).toFixed(2) + " " + y(v).toFixed(2); }).join("");
    var area = line + "L" + w + " " + hgt + "L0 " + hgt + "Z";

    container.innerHTML =
      '<svg class="chart" viewBox="0 0 ' + w + " " + hgt + '" preserveAspectRatio="none" fill="none">' +
        '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + stroke + '" stop-opacity=".26"/>' +
          '<stop offset="1" stop-color="' + stroke + '" stop-opacity="0"/>' +
        "</linearGradient></defs>" +
        '<path d="' + area + '" fill="url(#' + id + ')"/>' +
        '<path d="' + line + '" stroke="' + stroke + '" stroke-width="2" ' +
          'stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>' +
        '<line class="cross" x1="0" y1="0" x2="0" y2="' + hgt + '" stroke="' + stroke +
          '" stroke-opacity=".45" stroke-width="1" vector-effect="non-scaling-stroke" style="display:none"/>' +
        '<circle class="dot" r="4" fill="' + stroke + '" stroke="#0c111b" stroke-width="2" ' +
          'cx="' + x(values.length - 1) + '" cy="' + y(values[values.length - 1]) + '"/>' +
      "</svg>";

    if (!opts.onHover) return;
    var svg = container.firstChild;
    var cross = svg.querySelector(".cross");
    var dot = svg.querySelector(".dot");

    var move = function (event) {
      var box = svg.getBoundingClientRect();
      var px = (event.touches ? event.touches[0].clientX : event.clientX) - box.left;
      var i = Math.round((px / box.width) * (values.length - 1));
      i = Math.max(0, Math.min(values.length - 1, i));
      cross.style.display = "";
      cross.setAttribute("x1", x(i)); cross.setAttribute("x2", x(i));
      dot.setAttribute("cx", x(i)); dot.setAttribute("cy", y(values[i]));
      opts.onHover(values[i], i);
    };
    var leave = function () {
      cross.style.display = "none";
      dot.setAttribute("cx", x(values.length - 1));
      dot.setAttribute("cy", y(values[values.length - 1]));
      opts.onHover(null, null);
    };
    svg.addEventListener("pointermove", move);
    svg.addEventListener("pointerleave", leave);
    svg.addEventListener("touchmove", move, { passive: true });
    svg.addEventListener("touchend", leave);
  }

  /** Deterministic collectible art, so a token id always looks the same. */
  function nftArt(seed) {
    var rnd = Vault.seedRandom("art/" + seed);
    var hue = 200 + Math.floor(rnd() * 60);
    var hue2 = (hue + 30 + Math.floor(rnd() * 90)) % 360;
    var id = "a" + Math.floor(rnd() * 1e6);
    var shapes = "";
    var count = 3 + Math.floor(rnd() * 4);
    for (var i = 0; i < count; i++) {
      var cx = 20 + rnd() * 120, cy = 20 + rnd() * 120, r = 12 + rnd() * 52;
      shapes += rnd() > 0.45
        ? '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + r.toFixed(1) +
          '" fill="none" stroke="hsl(' + hue2 + ' 90% 70%)" stroke-opacity="' + (0.25 + rnd() * 0.5).toFixed(2) + '" stroke-width="' + (1 + rnd() * 3).toFixed(1) + '"/>'
        : '<rect x="' + (cx - r / 2).toFixed(1) + '" y="' + (cy - r / 2).toFixed(1) + '" width="' + r.toFixed(1) +
          '" height="' + r.toFixed(1) + '" rx="' + (r / 6).toFixed(1) + '" fill="hsl(' + hue + ' 90% 62% / ' +
          (0.12 + rnd() * 0.3).toFixed(2) + ')" transform="rotate(' + (rnd() * 90).toFixed(0) + " " + cx.toFixed(1) + " " + cy.toFixed(1) + ')"/>';
    }
    return '<svg viewBox="0 0 160 160" role="img" aria-label="Изображение коллекции">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + hue + ' 70% 22%)"/>' +
      '<stop offset="1" stop-color="hsl(' + hue2 + ' 60% 10%)"/></linearGradient></defs>' +
      '<rect width="160" height="160" fill="url(#' + id + ')"/>' + shapes + "</svg>";
  }

  /* ---------- toast ---------- */

  function toast(text, iconName) {
    var host = $("#toasts");
    if (!host) return;
    var node = h("div", { class: "toast", html: icon(iconName || "check") + "<span></span>" });
    node.lastChild.textContent = text;
    host.appendChild(node);
    setTimeout(function () {
      node.classList.add("toast--out");
      setTimeout(function () { node.remove(); }, 240);
    }, 2300);
  }

  function copy(text, message) {
    var done = function () { toast(message || "Скопировано", "copy"); };
    if (global.navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
    } else fallbackCopy(text, done);
  }

  function fallbackCopy(text, done) {
    var area = h("textarea", { style: "position:fixed;opacity:0" });
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand("copy"); done(); } catch (e) { toast("Не удалось скопировать", "alert"); }
    area.remove();
  }

  /* ---------- bottom sheet ---------- */

  var sheetHost = null;
  var onSheetClose = null;

  function openSheet(title, body, foot, opts) {
    opts = opts || {};
    closeSheet(true);
    sheetHost = h("div", { class: "sheet" }, [
      h("div", { class: "sheet__veil", onclick: function () { if (!opts.sticky) closeSheet(); } }),
      h("div", { class: "sheet__panel" }, [
        h("div", { class: "grabber" }),
        h("div", { class: "sheet__head" }, [
          h("div", { class: "sheet__title", text: title }),
          h("div", { class: "spacer" }),
          h("button", {
            class: "iconbtn", "aria-label": "Закрыть", html: icon("x"),
            onclick: function () { closeSheet(); }
          })
        ]),
        h("div", { class: "sheet__body" }, body),
        foot ? h("div", { class: "sheet__foot" }, foot) : null
      ])
    ]);
    $("#device").appendChild(sheetHost);
    onSheetClose = opts.onClose || null;
    return sheetHost;
  }

  function closeSheet(immediate) {
    if (!sheetHost) return;
    var node = sheetHost;
    var cb = onSheetClose;
    sheetHost = null;
    onSheetClose = null;
    node.dispatchEvent(new CustomEvent("sheet-teardown"));
    if (immediate) node.remove();
    else {
      node.classList.add("sheet--out");
      setTimeout(function () { node.remove(); }, 240);
    }
    if (cb) cb();
  }

  function sheetIsOpen() { return !!sheetHost; }

  /* ---------- press and hold ---------- */

  /** Money moves on a deliberate gesture, not a stray tap. */
  function holdToConfirm(button, ms, done) {
    var fill = button.querySelector(".hold__fill");
    var start = 0, raf = 0, running = false;

    var frame = function (now) {
      if (!running) return;
      var p = Math.min(1, (now - start) / ms);
      fill.style.width = (p * 100) + "%";
      if (p >= 1) { stop(); done(); return; }
      raf = requestAnimationFrame(frame);
    };
    var begin = function (event) {
      if (event.button != null && event.button !== 0) return;
      if (button.disabled) return;
      running = true;
      start = performance.now();
      raf = requestAnimationFrame(frame);
    };
    var stop = function () {
      running = false;
      cancelAnimationFrame(raf);
      fill.style.width = "0%";
    };
    button.addEventListener("pointerdown", begin);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointerleave", stop);
    button.addEventListener("pointercancel", stop);
    /* keyboard: Enter or Space commits without the hold */
    button.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!button.disabled) done(); }
    });
  }

  /* ---------- dates ---------- */

  var MONTHS = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

  function dayLabel(ts) {
    var d = new Date(ts), now = new Date();
    var sameDay = function (a, b) {
      return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    };
    if (sameDay(d, now)) return "Сегодня";
    var yesterday = new Date(now.getTime() - 86400000);
    if (sameDay(d, yesterday)) return "Вчера";
    return d.getDate() + " " + MONTHS[d.getMonth()] + (d.getFullYear() !== now.getFullYear() ? " " + d.getFullYear() : "");
  }

  function timeLabel(ts) {
    var d = new Date(ts);
    return ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2);
  }

  /** Russian counts: 1 контакт, 2 контакта, 5 контактов. */
  function plural(n, one, few, many) {
    var mod10 = Math.abs(n) % 10, mod100 = Math.abs(n) % 100;
    if (mod10 === 1 && mod100 !== 11) return n + " " + one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return n + " " + few;
    return n + " " + many;
  }

  var api = {
    h: h, frag: frag, esc: esc, $: $, $$: $$, icon: icon, plural: plural,
    coinBadge: coinBadge, avatarStyle: avatarStyle, shortAddress: shortAddress,
    sparkline: sparkline, areaChart: areaChart, nftArt: nftArt,
    toast: toast, copy: copy,
    openSheet: openSheet, closeSheet: closeSheet, sheetIsOpen: sheetIsOpen,
    holdToConfirm: holdToConfirm, dayLabel: dayLabel, timeLabel: timeLabel
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.UI = api;
})(typeof window !== "undefined" ? window : globalThis);
