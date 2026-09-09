/* ==========================================================================
   AROMIO — shared utilities (DOM helpers, formatting, SVG art, perf helpers)
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  function debounce(fn, wait) {
    let t;
    return function debounced(...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function formatPrice(n) {
    return n.toLocaleString("ru-RU") + " ₽";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function getJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function setJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      /* storage unavailable (private mode / quota) — fail silently, state stays in memory */
    }
  }

  // ---- scroll locking for drawers / modals ------------------------------
  let scrollY = 0;
  function lockScroll() {
    scrollY = window.scrollY;
    document.body.style.top = -scrollY + "px";
    document.body.classList.add("scroll-locked");
  }
  function unlockScroll() {
    document.body.classList.remove("scroll-locked");
    document.body.style.top = "";
    window.scrollTo(0, scrollY);
  }

  // ---- shared drawer / overlay / modal handling --------------------------
  function openPanel(el) {
    if (!el) return;
    closePanels();
    el.classList.add("open");
    const backdrop = document.getElementById("backdrop");
    if (backdrop) backdrop.classList.add("open");
    lockScroll();
  }

  function closePanels() {
    $$(".drawer.open, .overlay.open, .modal.open, .mobile-nav.open").forEach((p) => p.classList.remove("open"));
    const backdrop = document.getElementById("backdrop");
    if (backdrop) backdrop.classList.remove("open");
    unlockScroll();
  }

  // ---- restart a CSS animation reliably (bump / pop effects) ------------
  function bump(el, className) {
    if (!el || prefersReducedMotion) return;
    el.classList.remove(className);
    void el.offsetWidth; // force reflow so the animation restarts
    el.classList.add(className);
    el.addEventListener(
      "animationend",
      () => el.classList.remove(className),
      { once: true }
    );
  }

  // ---- scroll-reveal via IntersectionObserver ----------------------------
  function initScrollReveal(selector, root) {
    const items = $$(selector, root);
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    items.forEach((el) => io.observe(el));
  }

  // ---- memoized star-rating markup --------------------------------------
  const starsCache = new Map();
  function starsHtml(rating) {
    const key = Math.round(rating * 2) / 2; // nearest 0.5
    if (starsCache.has(key)) return starsCache.get(key);

    let html = "";
    for (let i = 1; i <= 5; i++) {
      const fill = clamp(key - (i - 1), 0, 1) * 100;
      html += `<span class="star" style="--fill:${fill}%">★</span>`;
    }
    starsCache.set(key, html);
    return html;
  }

  // ---- color shading for gradients ---------------------------------------
  function shadeColor(hex, percent) {
    const num = parseInt(hex.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const r = clamp((num >> 16) + amt, 0, 255);
    const g = clamp(((num >> 8) & 0x00ff) + amt, 0, 255);
    const b = clamp((num & 0x0000ff) + amt, 0, 255);
    return "#" + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  // ---- memoized perfume-bottle illustration (inline SVG, no assets) -----
  const bottleCache = new Map();
  function bottleSVG(hex, uid) {
    const cacheKey = hex;
    let inner = bottleCache.get(cacheKey);

    if (!inner) {
      const light = shadeColor(hex, 28);
      const dark = shadeColor(hex, -35);
      inner = {
        light,
        dark,
        body:
          '<rect x="26" y="42" width="108" height="192" rx="16" fill="url(#GRAD)"/>' +
          '<rect x="34" y="118" width="92" height="44" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1"/>' +
          '<text x="80" y="144" text-anchor="middle" font-size="9" letter-spacing="2.5" fill="#fff" font-family="Georgia, serif">AROMIO</text>' +
          '<rect x="35" y="48" width="16" height="178" rx="8" fill="#fff" opacity=".14"/>' +
          '<rect x="53" y="8" width="54" height="36" rx="7" fill="#1c1414"/>' +
          '<rect x="53" y="8" width="54" height="10" rx="5" fill="#000" opacity=".25"/>',
      };
      bottleCache.set(cacheKey, inner);
    }

    const gid = "bg-" + uid;
    return (
      '<svg viewBox="0 0 160 258" class="bottle-svg" aria-hidden="true">' +
      "<defs>" +
      `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="1">` +
      `<stop offset="0" stop-color="${inner.light}"/>` +
      `<stop offset=".55" stop-color="${hex}"/>` +
      `<stop offset="1" stop-color="${inner.dark}"/>` +
      "</linearGradient>" +
      "</defs>" +
      `<ellipse cx="80" cy="246" rx="44" ry="9" fill="#000" opacity=".22"/>` +
      inner.body.replace("url(#GRAD)", `url(#${gid})`) +
      "</svg>"
    );
  }

  Aromio.utils = {
    prefersReducedMotion,
    $,
    $$,
    debounce,
    formatPrice,
    escapeHtml,
    escapeRegExp,
    clamp,
    getQueryParam,
    getJSON,
    setJSON,
    lockScroll,
    unlockScroll,
    openPanel,
    closePanels,
    bump,
    initScrollReveal,
    starsHtml,
    shadeColor,
    bottleSVG,
  };
})((window.Aromio = window.Aromio || {}));
