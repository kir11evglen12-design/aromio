/* ==========================================================================
   AROMIO — shared bootstrap: page loader, header chrome, panel plumbing,
   global add-to-cart / favorite delegation, newsletter.
   Runs on every page (index.html and product.html).
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;

  function hideLoader() {
    const loader = document.getElementById("pageLoader");
    if (!loader) return;
    loader.classList.add("is-hidden");
    setTimeout(() => loader.remove(), 700);
  }

  function initHeaderScrollShadow() {
    const header = document.querySelector(".site-header");
    if (!header) return;
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileNav() {
    const toggle = document.getElementById("navToggle");
    const panel = document.getElementById("mobileNav");
    if (!toggle || !panel) return;

    function setOpen(isOpen) {
      if (isOpen) {
        utils.openPanel(panel);
      } else {
        utils.closePanels();
      }
      toggle.classList.toggle("is-active", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
    }

    toggle.addEventListener("click", () => setOpen(!panel.classList.contains("open")));
    utils.$$("a, button", panel).forEach((el) => el.addEventListener("click", () => setOpen(false)));
  }

  function initPanelPlumbing() {
    document.addEventListener("click", (e) => {
      const opener = e.target.closest("[data-open]");
      if (opener) {
        const target = document.getElementById(opener.dataset.open);
        if (target) {
          e.preventDefault();
          utils.openPanel(target);
          const input = target.querySelector("[data-autofocus]");
          if (input) setTimeout(() => input.focus(), 320);
        }
        return;
      }
      if (e.target.closest("[data-close]") || e.target.classList.contains("backdrop")) {
        utils.closePanels();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") utils.closePanels();
    });
  }

  function syncFavButtons() {
    utils.$$("[data-fav]").forEach((btn) => {
      const id = Number(btn.dataset.fav);
      const active = Aromio.Store.isFavorite(id);
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
  }

  function syncCounts() {
    const cartCount = Aromio.Store.getCartCount();
    const favCount = Aromio.Store.getFavoritesCount();
    utils.$$("[data-cart-count]").forEach((el) => {
      el.textContent = cartCount;
      el.classList.toggle("is-empty", cartCount === 0);
    });
    utils.$$("[data-fav-count]").forEach((el) => {
      el.textContent = favCount;
      el.classList.toggle("is-empty", favCount === 0);
    });
  }

  function initAddAndFavoriteDelegation() {
    document.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add]");
      if (addBtn) {
        e.preventDefault();
        e.stopPropagation();
        if (addBtn.disabled) return;
        const id = Number(addBtn.dataset.add);
        const ml = Number(addBtn.dataset.ml) || undefined;
        const qty = Number(addBtn.dataset.qty) || 1;
        Aromio.Store.addToCart(id, ml, qty);
        utils.bump(addBtn, "is-bumping");
        utils.bump(document.querySelector('[data-open="cartDrawer"]'), "is-bumping");
        return;
      }

      const favBtn = e.target.closest("[data-fav]");
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();
        Aromio.Store.toggleFavorite(Number(favBtn.dataset.fav));
        utils.bump(favBtn, "is-popping");
      }
    });

    Aromio.Store.subscribe(syncFavButtons);
    Aromio.Store.subscribe(syncCounts);
    syncFavButtons();
    syncCounts();
  }

  function initNewsletter() {
    const form = document.getElementById("newsletterForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[type='email']");
      if (!input || !input.checkValidity()) {
        input && input.reportValidity();
        return;
      }
      const btn = form.querySelector("button");
      btn.classList.add("is-loading");
      btn.disabled = true;

      setTimeout(() => {
        btn.classList.remove("is-loading");
        btn.disabled = false;
        form.reset();
        if (!Aromio.Store.hasNewsletterCode()) {
          Aromio.Store.grantNewsletterCode();
          Aromio.Toast.show({
            type: "success",
            title: "Добро пожаловать!",
            message: "Ваш промокод на скидку 500 ₽ — WELCOME500",
            duration: 5000,
          });
        } else {
          Aromio.Toast.show({ type: "success", title: "Вы уже подписаны", message: "Промокод WELCOME500 уже ваш" });
        }
      }, 700);
    });
  }

  function initSmoothAnchors() {
    utils.$$('a[href^="#"]').forEach((a) => {
      const id = a.getAttribute("href").slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        target.scrollIntoView({ behavior: utils.prefersReducedMotion ? "auto" : "smooth" });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHeaderScrollShadow();
    initMobileNav();
    initPanelPlumbing();
    initAddAndFavoriteDelegation();
    initNewsletter();
    initSmoothAnchors();
    utils.initScrollReveal(".reveal, .usp-item, .testimonial-card");
  });

  window.addEventListener("load", () => {
    setTimeout(hideLoader, 260);
  });
})(window.Aromio);
