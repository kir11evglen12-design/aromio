/* ==========================================================================
   AROMIO — motion layer: 3D card tilt, fly-to-cart, confetti, count-up,
   cursor glow. All transform/opacity based, all reduced-motion aware.
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;
  const canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const allowMotion = !utils.prefersReducedMotion && canHover;

  // ---- 3D tilt on product cards (delegated, rAF-throttled) --------------
  function initTilt() {
    if (!allowMotion) return;
    let rafId = null;
    let pending = null;

    document.addEventListener("mousemove", (e) => {
      const card = e.target.closest(".product-card, .product-detail-visual");
      if (!card) return;
      pending = { card, x: e.clientX, y: e.clientY };
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!pending) return;
        const { card: c, x, y } = pending;
        const rect = c.getBoundingClientRect();
        const px = (x - rect.left) / rect.width - 0.5;
        const py = (y - rect.top) / rect.height - 0.5;
        c.style.transform =
          "perspective(900px) rotateX(" + (-py * 7).toFixed(2) + "deg) rotateY(" + (px * 9).toFixed(2) + "deg) translateY(-6px)";
      });
    });

    document.addEventListener(
      "mouseout",
      (e) => {
        const card = e.target.closest(".product-card, .product-detail-visual");
        if (card && !card.contains(e.relatedTarget)) card.style.transform = "";
      },
      true
    );
  }

  // ---- cursor glow (decorative, desktop only) ----------------------------
  function initCursorGlow() {
    if (!allowMotion) return;
    const dot = document.createElement("div");
    dot.className = "cursor-glow";
    document.body.appendChild(dot);

    document.addEventListener("mousemove", (e) => {
      dot.style.left = e.clientX + "px";
      dot.style.top = e.clientY + "px";
      dot.classList.add("is-active");
      dot.classList.toggle("is-hover", !!e.target.closest("a, button, .product-card"));
    });
    document.addEventListener("mouseleave", () => dot.classList.remove("is-active"));
  }

  // ---- fly-to-cart: cloned dot arcs from the add button to the cart icon --
  function flyToCart(sourceEl, color) {
    const cartIcon = document.querySelector('[data-open="cartDrawer"]');
    if (!allowMotion || !cartIcon || !sourceEl) {
      if (cartIcon) utils.bump(cartIcon, "is-bumping");
      return;
    }

    const startRect = sourceEl.getBoundingClientRect();
    const endRect = cartIcon.getBoundingClientRect();
    const size = 16;

    const clone = document.createElement("div");
    clone.className = "fly-clone";
    clone.style.left = startRect.left + startRect.width / 2 - size / 2 + "px";
    clone.style.top = startRect.top + startRect.height / 2 - size / 2 + "px";
    clone.style.width = size + "px";
    clone.style.height = size + "px";
    clone.style.background = color || "var(--accent)";
    document.body.appendChild(clone);

    requestAnimationFrame(() => {
      const dx = endRect.left + endRect.width / 2 - (startRect.left + startRect.width / 2);
      const dy = endRect.top + endRect.height / 2 - (startRect.top + startRect.height / 2);
      clone.style.transform = "translate(" + dx + "px, " + dy + "px) scale(0.15)";
      clone.style.opacity = "0.3";
    });

    setTimeout(() => {
      clone.remove();
      utils.bump(cartIcon, "is-bumping");
    }, 720);
  }

  // ---- confetti burst (checkout success) ---------------------------------
  function confetti() {
    if (utils.prefersReducedMotion) return;
    const colors = ["#8a1f2d", "#b8935b", "#ff4d5e", "#2e7d5b"];
    for (let i = 0; i < 34; i++) {
      const el = document.createElement("div");
      el.className = "confetti-piece";
      el.style.left = Math.random() * 100 + "vw";
      el.style.background = colors[i % colors.length];
      el.style.animationDuration = (2.2 + Math.random() * 1.4).toFixed(2) + "s";
      el.style.animationDelay = (Math.random() * 0.35).toFixed(2) + "s";
      el.style.transform = "rotate(" + Math.round(Math.random() * 360) + "deg)";
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4200);
    }
  }

  // ---- count-up numbers on scroll into view ------------------------------
  function initCountUp() {
    const els = utils.$$("[data-count-to]");
    if (!els.length || !("IntersectionObserver" in window)) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          io.unobserve(entry.target);
          const el = entry.target;
          const target = Number(el.dataset.countTo);
          const suffix = el.dataset.countSuffix || "";

          if (utils.prefersReducedMotion) {
            el.textContent = target.toLocaleString("ru-RU") + suffix;
            return;
          }

          const start = performance.now();
          const duration = 1100;
          function tick(now) {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased).toLocaleString("ru-RU") + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.5 }
    );

    els.forEach((el) => io.observe(el));
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTilt();
    initCursorGlow();
    initCountUp();
  });

  Aromio.Effects = { flyToCart, confetti };
})(window.Aromio);
