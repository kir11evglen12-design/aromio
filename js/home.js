/* ==========================================================================
   AROMIO — homepage rails (bestsellers / new / sale)
   ========================================================================== */

(function (Aromio) {
  "use strict";

  function renderRail(containerId, predicate, limit) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const items = Aromio.PRODUCTS.filter(predicate).slice(0, limit || 4);
    el.innerHTML = items.map(Aromio.Card.renderGrid).join("");
    Aromio.utils.initScrollReveal(".reveal", el);
  }

  function initRailLinks() {
    Aromio.utils.$$("[data-catalog-toggle]").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const key = link.dataset.catalogToggle;
        const toggleBtn = document.querySelector('[data-toggle="' + key + '"]');
        if (toggleBtn && !toggleBtn.classList.contains("active")) toggleBtn.click();
        document.getElementById("catalog").scrollIntoView({ behavior: Aromio.utils.prefersReducedMotion ? "auto" : "smooth" });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("bestsellersRail")) return;
    renderRail("bestsellersRail", (p) => p.badges.indexOf("bestseller") > -1);
    renderRail("newArrivalsRail", (p) => p.badges.indexOf("new") > -1);
    renderRail("saleRail", (p) => p.badges.indexOf("sale") > -1);
    initRailLinks();

    const heroBottle = document.getElementById("heroBottle");
    if (heroBottle) heroBottle.innerHTML = Aromio.utils.bottleSVG("#b33a4b", "hero");
  });
})(window.Aromio);
