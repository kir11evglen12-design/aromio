/* ==========================================================================
   AROMIO — shared product card renderers
   Every list of products (catalog, home rails, recommendations, search,
   favorites, cart upsell, quiz results) renders through these two
   functions so markup and behaviour stay in exactly one place.
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;

  function badgesHtml(product) {
    return product.badges
      .map((b) => {
        if (b === "sale" && product.discount) {
          return '<span class="badge badge--sale">−' + product.discount + "%</span>";
        }
        return '<span class="badge badge--' + b + '">' + Aromio.BADGE_LABELS[b] + "</span>";
      })
      .join("");
  }

  function favButtonHtml(product) {
    const active = Aromio.Store.isFavorite(product.id);
    return (
      '<button type="button" class="fav-btn' + (active ? " is-active" : "") + '" ' +
      'data-fav="' + product.id + '" aria-label="В избранное" aria-pressed="' + active + '">' +
      '<svg viewBox="0 0 24 24"><path d="M12 21.3s-7.6-4.6-10.1-9.4C.4 8 1.9 4.3 5.6 3.8c2.3-.3 4.4 1 6.4 3.3 2-2.3 4.1-3.6 6.4-3.3 3.7.5 5.2 4.2 3.7 8.1-2.5 4.8-10.1 9.4-10.1 9.4z"/></svg>' +
      "</button>"
    );
  }

  function renderGrid(product) {
    return (
      '<article class="product-card reveal" data-product-id="' + product.id + '">' +
      '<a class="product-link" href="product.html?id=' + product.id + '">' +
      '<div class="product-image" style="--accent:' + product.color + '">' +
      '<div class="product-badges">' + badgesHtml(product) + "</div>" +
      favButtonHtml(product) +
      utils.bottleSVG(product.color, "card" + product.id) +
      "</div>" +
      '<div class="product-info">' +
      '<div class="product-top">' +
      '<span class="product-brand">' + product.brand + "</span>" +
      '<span class="product-rating">' + utils.starsHtml(product.rating) +
      '<b>' + product.rating.toFixed(1) + "</b></span>" +
      "</div>" +
      '<h3 class="product-name">' + product.name + "</h3>" +
      '<p class="product-family">' + Aromio.FAMILY_LABELS[product.family] + " · " + Aromio.CATEGORY_LABELS[product.category] + "</p>" +
      '<div class="product-bottom">' +
      '<div class="price-block">' +
      '<span class="price">' + utils.formatPrice(product.price) + "</span>" +
      (product.oldPrice ? '<span class="price-old">' + utils.formatPrice(product.oldPrice) + "</span>" : "") +
      "</div>" +
      '<button type="button" class="add" data-add="' + product.id + '" data-ml="' + product.volumes[2].ml + '" aria-label="Добавить в корзину">+</button>' +
      "</div>" +
      "</div>" +
      "</a>" +
      "</article>"
    );
  }

  function renderRow(product) {
    return (
      '<div class="row-card" data-product-id="' + product.id + '">' +
      '<a class="row-card-visual" href="product.html?id=' + product.id + '" style="--accent:' + product.color + '">' +
      utils.bottleSVG(product.color, "row" + product.id) +
      "</a>" +
      '<a class="row-card-info" href="product.html?id=' + product.id + '">' +
      '<span class="row-card-name">' + product.name + "</span>" +
      '<span class="row-card-meta">' + utils.formatPrice(product.price) + "</span>" +
      "</a>" +
      '<button type="button" class="add add--sm" data-add="' + product.id + '" data-ml="' + product.volumes[2].ml + '" aria-label="Добавить в корзину">+</button>' +
      "</div>"
    );
  }

  function renderSkeletonGrid(count) {
    let html = "";
    for (let i = 0; i < count; i++) {
      html +=
        '<div class="product-card product-card--skeleton" aria-hidden="true">' +
        '<div class="skeleton skeleton-image"></div>' +
        '<div class="product-info">' +
        '<div class="skeleton skeleton-line" style="width:40%"></div>' +
        '<div class="skeleton skeleton-line" style="width:75%;height:18px"></div>' +
        '<div class="skeleton skeleton-line" style="width:55%"></div>' +
        "</div>" +
        "</div>";
    }
    return html;
  }

  Aromio.Card = {
    renderGrid,
    renderRow,
    renderSkeletonGrid,
    badgesHtml,
    favButtonHtml,
  };
})((window.Aromio = window.Aromio || {}));
