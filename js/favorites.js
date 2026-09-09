/* ==========================================================================
   AROMIO — favorites drawer
   Add/remove and add-to-cart are handled by the global delegation in
   app.js ([data-fav] / [data-add]); this module only keeps the list in sync.
   ========================================================================== */

(function (Aromio) {
  "use strict";

  function emptyStateHtml() {
    return (
      '<div class="empty-state">' +
      '<div class="empty-state-icon">♥</div>' +
      "<p>Список избранного пуст</p>" +
      '<button type="button" class="btn btn--outline" data-close>Смотреть каталог</button>' +
      "</div>"
    );
  }

  function render() {
    const el = document.getElementById("favoritesScroll");
    if (!el) return;
    const favorites = Aromio.Store.getFavorites();
    el.innerHTML = favorites.length
      ? '<div class="product-grid product-grid--compact">' + favorites.map(Aromio.Card.renderGrid).join("") + "</div>"
      : emptyStateHtml();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!document.getElementById("favoritesDrawer")) return;
    Aromio.Store.subscribe(render);
    render();
  });
})(window.Aromio);
