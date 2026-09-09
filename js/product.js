/* ==========================================================================
   AROMIO — product detail page
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;
  const HEART_SVG =
    '<svg viewBox="0 0 24 24"><path d="M12 21.3s-7.6-4.6-10.1-9.4C.4 8 1.9 4.3 5.6 3.8c2.3-.3 4.4 1 6.4 3.3 2-2.3 4.1-3.6 6.4-3.3 3.7.5 5.2 4.2 3.7 8.1-2.5 4.8-10.1 9.4-10.1 9.4z"/></svg>';

  function oldPriceForVolume(product, volume) {
    if (!product.discount) return null;
    if (volume.price === product.price) return product.oldPrice; // reference tier: exact authored value
    return Math.round((volume.price / (1 - product.discount / 100)) / 10) * 10;
  }

  function getRecommendations(product) {
    let pool = Aromio.PRODUCTS.filter((p) => p.id !== product.id && p.family === product.family);
    if (pool.length < 4) {
      const extra = Aromio.PRODUCTS.filter(
        (p) => p.id !== product.id && p.category === product.category && pool.indexOf(p) === -1
      );
      pool = pool.concat(extra);
    }
    return pool.slice(0, 4);
  }

  function notFoundHtml() {
    return (
      '<div class="empty-state">' +
      '<div class="empty-state-icon">◐</div>' +
      "<p>Такой аромат не найден</p>" +
      '<a class="btn btn--outline" href="index.html#catalog">Вернуться в каталог</a>' +
      "</div>"
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    const detailEl = document.getElementById("productDetail");
    if (!detailEl) return;

    const breadcrumbsEl = document.getElementById("breadcrumbs");
    const recommendationsSection = document.getElementById("recommendationsSection");
    const recommendationsGrid = document.getElementById("recommendationsGrid");
    const accordionSection = document.getElementById("productAccordion");

    const id = Number(utils.getQueryParam("id"));
    const product = Aromio.PRODUCTS.find((p) => p.id === id);

    if (!product) {
      detailEl.innerHTML = notFoundHtml();
      if (recommendationsSection) recommendationsSection.hidden = true;
      if (accordionSection) accordionSection.hidden = true;
      if (breadcrumbsEl) breadcrumbsEl.innerHTML = '<a href="index.html">Каталог</a> <span>/</span> <span>Не найдено</span>';
      return;
    }

    document.title = product.name + " — AROMIO";

    const state = { ml: product.volumes[2].ml, qty: 1 };

    function renderDetail() {
      const volume = product.volumes.find((v) => v.ml === state.ml) || product.volumes[2];
      const oldPrice = oldPriceForVolume(product, volume);
      const fav = Aromio.Store.isFavorite(product.id);

      detailEl.innerHTML =
        '<div class="product-detail-visual" style="--accent:' + product.color + '">' +
        '<div class="product-badges">' + Aromio.Card.badgesHtml(product) + "</div>" +
        utils.bottleSVG(product.color, "detail" + product.id) +
        "</div>" +
        '<div class="product-detail-info">' +
        '<span class="product-brand">' + product.brand + "</span>" +
        "<h1>" + product.name + "</h1>" +
        '<div class="product-rating product-rating--lg">' + utils.starsHtml(product.rating) +
        "<b>" + product.rating.toFixed(1) + "</b><span>(" + product.reviews + " отзывов)</span></div>" +
        '<p class="product-description">' + product.description + "</p>" +
        '<div class="volume-picker" role="group" aria-label="Объём">' +
        product.volumes
          .map(
            (v) =>
              '<button type="button" class="volume-chip' + (v.ml === state.ml ? " active" : "") + '" data-ml="' + v.ml + '">' +
              v.ml + " мл" + (v.sample ? " · пробник" : "") + "</button>"
          )
          .join("") +
        "</div>" +
        '<div class="product-detail-price">' +
        '<span class="price">' + utils.formatPrice(volume.price) + "</span>" +
        (oldPrice
          ? '<span class="price-old">' + utils.formatPrice(oldPrice) + '</span><span class="badge badge--sale">−' + product.discount + "%</span>"
          : "") +
        "</div>" +
        '<div class="product-detail-actions">' +
        '<div class="qty-stepper qty-stepper--lg">' +
        '<button type="button" data-qty-dec aria-label="Уменьшить количество">−</button>' +
        "<span>" + state.qty + "</span>" +
        '<button type="button" data-qty-inc aria-label="Увеличить количество">+</button>' +
        "</div>" +
        '<button type="button" class="btn btn--primary btn--lg" data-add="' + product.id + '" data-ml="' + state.ml + '" data-qty="' + state.qty + '">' +
        "В корзину — " + utils.formatPrice(volume.price * state.qty) +
        "</button>" +
        '<button type="button" class="fav-btn fav-btn--lg' + (fav ? " is-active" : "") + '" data-fav="' + product.id + '" aria-pressed="' + fav + '" aria-label="В избранное">' +
        HEART_SVG +
        "</button>" +
        "</div>" +
        '<div class="notes-pyramid">' +
        '<div class="notes-row"><span class="notes-label">Верхние</span><span class="notes-values">' + product.notes.top.join(", ") + "</span></div>" +
        '<div class="notes-row"><span class="notes-label">Средние</span><span class="notes-values">' + product.notes.heart.join(", ") + "</span></div>" +
        '<div class="notes-row"><span class="notes-label">Базовые</span><span class="notes-values">' + product.notes.base.join(", ") + "</span></div>" +
        "</div>" +
        "</div>";
    }

    detailEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-qty-inc]")) {
        state.qty = utils.clamp(state.qty + 1, 1, 9);
        renderDetail();
      } else if (e.target.closest("[data-qty-dec]")) {
        state.qty = utils.clamp(state.qty - 1, 1, 9);
        renderDetail();
      } else if (e.target.closest(".volume-chip")) {
        state.ml = Number(e.target.closest(".volume-chip").dataset.ml);
        renderDetail();
      }
    });

    if (breadcrumbsEl) {
      breadcrumbsEl.innerHTML =
        '<a href="index.html">Каталог</a><span>/</span>' +
        '<a href="index.html#catalog">' + Aromio.CATEGORY_LABELS[product.category] + "</a><span>/</span>" +
        "<span>" + product.name + "</span>";
    }

    if (recommendationsGrid) {
      const recs = getRecommendations(product);
      recommendationsGrid.innerHTML = recs.map(Aromio.Card.renderGrid).join("");
    }

    if (accordionSection) {
      accordionSection.addEventListener("click", (e) => {
        const trigger = e.target.closest("[data-accordion-trigger]");
        if (!trigger) return;
        const item = trigger.closest(".accordion-item");
        const panel = item.querySelector("[data-accordion-panel]");
        const isOpen = item.classList.contains("open");

        utils.$$(".accordion-item.open", accordionSection).forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove("open");
            openItem.querySelector("[data-accordion-panel]").style.maxHeight = "";
          }
        });

        if (isOpen) {
          item.classList.remove("open");
          panel.style.maxHeight = "";
        } else {
          item.classList.add("open");
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    }

    renderDetail();
    utils.initScrollReveal(".reveal");
  });
})(window.Aromio);
