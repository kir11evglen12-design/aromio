/* ==========================================================================
   AROMIO — toast notifications
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const ICONS = {
    success: "✓",
    info: "ℹ",
    error: "✕",
    heart: "♥",
  };

  const MAX_VISIBLE = 3;
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.getElementById("toastContainer");
      if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        document.body.appendChild(container);
      }
      container.className = "toast-container";
      container.setAttribute("aria-live", "polite");
    }
    return container;
  }

  function show(opts) {
    const options = typeof opts === "string" ? { message: opts } : opts || {};
    const type = options.type || "success";
    const duration = options.duration || 3200;
    const root = getContainer();

    while (root.children.length >= MAX_VISIBLE) {
      root.removeChild(root.firstElementChild);
    }

    const el = document.createElement("div");
    el.className = "toast toast--" + type;
    el.setAttribute("role", "status");
    el.innerHTML =
      '<span class="toast-icon">' + (ICONS[type] || ICONS.info) + "</span>" +
      '<div class="toast-body">' +
      (options.title ? '<strong class="toast-title">' + Aromio.utils.escapeHtml(options.title) + "</strong>" : "") +
      '<span class="toast-message">' + Aromio.utils.escapeHtml(options.message || "") + "</span>" +
      "</div>" +
      '<button class="toast-close" aria-label="Закрыть">×</button>' +
      '<span class="toast-progress" style="--duration:' + duration + 'ms"></span>';

    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("is-visible"));

    let remaining = duration;
    let startedAt = Date.now();
    let timer = setTimeout(dismiss, remaining);

    function dismiss() {
      if (!el.parentNode) return;
      el.classList.remove("is-visible");
      el.classList.add("is-leaving");
      setTimeout(() => el.remove(), 260);
    }

    el.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      remaining -= Date.now() - startedAt;
      el.style.setProperty("--play-state", "paused");
      el.classList.add("is-paused");
    });

    el.addEventListener("mouseleave", () => {
      startedAt = Date.now();
      timer = setTimeout(dismiss, Math.max(remaining, 600));
      el.classList.remove("is-paused");
    });

    el.querySelector(".toast-close").addEventListener("click", () => {
      clearTimeout(timer);
      dismiss();
    });

    return dismiss;
  }

  Aromio.Toast = { show };
})((window.Aromio = window.Aromio || {}));
