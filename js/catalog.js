/* ==========================================================================
   AROMIO — catalog: category/family filters, sort, price range, rendering
   All data is local, so filtering is effectively instant; instead of faking
   a network delay, new cards get a short staggered fade/slide entrance
   (see .product-card animation in styles.css) — that reads as "alive"
   without costing real latency.
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;
  const prices = Aromio.PRODUCTS.map((p) => p.price);
  const PRICE_MIN = Math.floor(Math.min.apply(null, prices) / 100) * 100;
  const PRICE_MAX = Math.ceil(Math.max.apply(null, prices) / 100) * 100;

  const state = {
    category: "all",
    family: "all",
    onlyNew: false,
    onlySale: false,
    maxPrice: PRICE_MAX,
    sort: "popularity",
  };

  let gridEl, countEl, priceRangeEl, priceLabelEl, sortEl;

  function popularityScore(p) {
    return p.rating * Math.log(p.reviews + 1);
  }

  function getFiltered() {
    return Aromio.PRODUCTS.filter((p) => {
      if (state.category !== "all" && p.category !== state.category) return false;
      if (state.family !== "all" && p.family !== state.family) return false;
      if (state.onlyNew && p.badges.indexOf("new") === -1) return false;
      if (state.onlySale && p.badges.indexOf("sale") === -1) return false;
      if (p.price > state.maxPrice) return false;
      return true;
    });
  }

  function getSorted(list) {
    const sorted = list.slice();
    if (state.sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (state.sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else if (state.sort === "rating") sorted.sort((a, b) => b.rating - a.rating);
    else if (state.sort === "new") sorted.sort((a, b) => (b.badges.indexOf("new") > -1) - (a.badges.indexOf("new") > -1));
    else sorted.sort((a, b) => popularityScore(b) - popularityScore(a));
    return sorted;
  }

  function emptyStateHtml() {
    return (
      '<div class="empty-state empty-state--catalog">' +
      '<div class="empty-state-icon">◐</div>' +
      "<p>По вашим фильтрам ничего не найдено</p>" +
      '<button type="button" class="btn btn--outline" id="resetFilters">Сбросить фильтры</button>' +
      "</div>"
    );
  }

  function render() {
    const list = getSorted(getFiltered());

    gridEl.classList.remove("product-grid--empty");
    if (!list.length) {
      gridEl.classList.add("product-grid--empty");
      gridEl.innerHTML = emptyStateHtml();
    } else {
      gridEl.innerHTML = list.map(Aromio.Card.renderGrid).join("");
    }

    if (countEl) {
      countEl.textContent = list.length + (list.length % 10 === 1 && list.length % 100 !== 11 ? " аромат" : " ароматов");
    }
  }

  function setCategory(category) {
    state.category = category;
    utils.$$(".filter[data-category]").forEach((btn) => btn.classList.toggle("active", btn.dataset.category === category));
    render();
  }

  function initToolbar() {
    const toolbar = document.querySelector(".catalog-toolbar");
    if (!toolbar) return;

    toolbar.addEventListener("click", (e) => {
      const categoryBtn = e.target.closest("[data-category]");
      if (categoryBtn) {
        setCategory(categoryBtn.dataset.category);
        return;
      }

      const familyBtn = e.target.closest("[data-family-filter]");
      if (familyBtn) {
        state.family = familyBtn.dataset.familyFilter;
        utils.$$("[data-family-filter]").forEach((b) => b.classList.toggle("active", b === familyBtn));
        render();
        return;
      }

      const toggleBtn = e.target.closest("[data-toggle]");
      if (toggleBtn) {
        const key = toggleBtn.dataset.toggle;
        state[key] = !state[key];
        toggleBtn.classList.toggle("active", state[key]);
        render();
      }
    });

    sortEl = document.getElementById("sortSelect");
    if (sortEl) {
      sortEl.addEventListener("change", () => {
        state.sort = sortEl.value;
        render();
      });
    }

    priceRangeEl = document.getElementById("priceRange");
    priceLabelEl = document.getElementById("priceRangeLabel");
    if (priceRangeEl) {
      priceRangeEl.min = PRICE_MIN;
      priceRangeEl.max = PRICE_MAX;
      priceRangeEl.step = 100;
      priceRangeEl.value = PRICE_MAX;
      const onRange = utils.debounce(() => {
        state.maxPrice = Number(priceRangeEl.value);
        render();
      }, 80);
      priceRangeEl.addEventListener("input", () => {
        priceLabelEl.textContent = "до " + utils.formatPrice(Number(priceRangeEl.value));
        onRange();
      });
      priceLabelEl.textContent = "до " + utils.formatPrice(PRICE_MAX);
    }

    gridEl.addEventListener("click", (e) => {
      if (e.target.closest("#resetFilters")) {
        state.category = "all";
        state.family = "all";
        state.onlyNew = false;
        state.onlySale = false;
        state.maxPrice = PRICE_MAX;
        state.sort = "popularity";
        utils.$$(".filter[data-category]").forEach((b) => b.classList.toggle("active", b.dataset.category === "all"));
        utils.$$("[data-family-filter]").forEach((b) => b.classList.toggle("active", b.dataset.familyFilter === "all"));
        utils.$$("[data-toggle]").forEach((b) => b.classList.remove("active"));
        if (priceRangeEl) priceRangeEl.value = PRICE_MAX;
        if (priceLabelEl) priceLabelEl.textContent = "до " + utils.formatPrice(PRICE_MAX);
        if (sortEl) sortEl.value = "popularity";
        render();
      }
    });
  }

  function initHeaderNavLinks() {
    document.addEventListener("click", (e) => {
      const navBtn = e.target.closest("[data-nav-category]");
      if (!navBtn) return;
      setCategory(navBtn.dataset.navCategory);
      document.getElementById("catalog").scrollIntoView({ behavior: utils.prefersReducedMotion ? "auto" : "smooth" });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    gridEl = document.getElementById("products");
    if (!gridEl) return;
    countEl = document.getElementById("catalogCount");

    initToolbar();
    initHeaderNavLinks();

    const initialCategory = utils.getQueryParam("category");
    if (initialCategory && Aromio.CATEGORY_LABELS[initialCategory]) {
      setCategory(initialCategory);
    } else {
      render();
    }
  });

  Aromio.Catalog = { setCategory };
})(window.Aromio);
