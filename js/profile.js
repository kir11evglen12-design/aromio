/* ==========================================================================
   AROMIO — profile drawer: display name + real order history
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "long", year: "numeric" });
  }

  function orderCardHtml(order) {
    const itemsText = order.items.map((i) => i.name + " · " + i.ml + " мл × " + i.qty).join("<br>");
    return (
      '<div class="order-card">' +
      '<div class="order-card-head"><span>№ <b>' + order.number + "</b></span><span>" + formatDate(order.date) + "</span></div>" +
      '<div class="order-card-items">' + itemsText + "</div>" +
      '<div class="order-card-total">' + utils.formatPrice(order.total) + "</div>" +
      "</div>"
    );
  }

  function ordersHtml() {
    const orders = Aromio.Store.getOrders();
    if (!orders.length) {
      return '<p style="color:var(--muted);font-size:13.5px;">Пока нет оформленных заказов — самое время выбрать первый аромат.</p>';
    }
    return orders.map(orderCardHtml).join("");
  }

  function render() {
    const el = document.getElementById("profileScroll");
    if (!el) return;

    const preservedValue = document.getElementById("profileNameInput")
      ? document.getElementById("profileNameInput").value
      : Aromio.Store.getProfileName();

    const name = Aromio.Store.getProfileName();

    el.innerHTML =
      '<div class="profile-block">' +
      "<h4>" + (name ? "Здравствуйте, " + utils.escapeHtml(name) + "!" : "Как к вам обращаться?") + "</h4>" +
      '<form class="profile-name-row" id="profileNameForm">' +
      '<input id="profileNameInput" placeholder="Ваше имя" autocomplete="off" value="' + utils.escapeHtml(preservedValue) + '">' +
      '<button type="submit" class="btn btn--dark">Сохранить</button>' +
      "</form>" +
      "</div>" +
      '<div class="profile-block">' +
      "<h4>Мои заказы</h4>" +
      ordersHtml() +
      "</div>" +
      '<div class="profile-block">' +
      "<h4>Быстрые ссылки</h4>" +
      '<div class="chip-row">' +
      '<button type="button" class="chip" data-open="favoritesDrawer">Избранное · ' + Aromio.Store.getFavoritesCount() + "</button>" +
      '<button type="button" class="chip" data-open="cartDrawer">Корзина · ' + Aromio.Store.getCartCount() + "</button>" +
      "</div>" +
      "</div>";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const drawer = document.getElementById("profileDrawer");
    if (!drawer) return;
    const scroll = document.getElementById("profileScroll");

    scroll.addEventListener("submit", (e) => {
      if (e.target.id === "profileNameForm") {
        e.preventDefault();
        const input = document.getElementById("profileNameInput");
        Aromio.Store.setProfileName(input.value);
        Aromio.Toast.show({ type: "success", title: "Сохранено", message: "Имя обновлено" });
      }
    });

    Aromio.Store.subscribe(render);
    render();
  });
})(window.Aromio);
