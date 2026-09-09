/* ==========================================================================
   AROMIO — cart drawer
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;
  let itemsEl, summaryEl;
  let checkoutDone = false;

  function bestUpsell(cartIds) {
    return Aromio.PRODUCTS.filter((p) => cartIds.indexOf(p.id) === -1 && p.badges.indexOf("bestseller") > -1).slice(0, 2);
  }

  function emptyStateHtml() {
    return (
      '<div class="empty-state">' +
      '<div class="empty-state-icon">🛍</div>' +
      "<p>Ваша корзина пока пуста</p>" +
      '<button type="button" class="btn btn--outline" data-close>Смотреть каталог</button>' +
      "</div>"
    );
  }

  function itemRowHtml(item) {
    return (
      '<div class="cart-item" data-key="' + item.id + ":" + item.ml + '" data-qty="' + item.qty + '">' +
      '<div class="cart-item-visual" style="--accent:' + item.product.color + '">' +
      utils.bottleSVG(item.product.color, "cart" + item.key) +
      "</div>" +
      '<div class="cart-item-info">' +
      '<a class="cart-item-name" href="product.html?id=' + item.id + '">' + item.product.name + "</a>" +
      '<span class="cart-item-meta">' + item.ml + " мл</span>" +
      '<div class="cart-item-row">' +
      '<div class="qty-stepper">' +
      '<button type="button" data-qty-dec aria-label="Уменьшить количество">−</button>' +
      '<span>' + item.qty + "</span>" +
      '<button type="button" data-qty-inc aria-label="Увеличить количество">+</button>' +
      "</div>" +
      '<button type="button" class="cart-item-remove" data-remove aria-label="Удалить">Удалить</button>' +
      "</div>" +
      "</div>" +
      '<div class="cart-item-price">' + utils.formatPrice(item.lineTotal) + "</div>" +
      "</div>"
    );
  }

  function renderItems(totals) {
    if (!totals.items.length) {
      itemsEl.innerHTML = emptyStateHtml();
      return;
    }

    let html = '<div class="cart-item-list">' + totals.items.map(itemRowHtml).join("") + "</div>";

    const upsell = bestUpsell(totals.items.map((i) => i.id));
    if (upsell.length) {
      html +=
        '<div class="cart-upsell">' +
        "<h4>Вам может понравиться</h4>" +
        '<div class="row-card-list">' + upsell.map(Aromio.Card.renderRow).join("") + "</div>" +
        "</div>";
    }

    itemsEl.innerHTML = html;
  }

  function renderSummary(totals) {
    if (!totals.items.length) {
      summaryEl.innerHTML = "";
      summaryEl.hidden = true;
      return;
    }
    summaryEl.hidden = false;

    const preservedValue = document.getElementById("promoInput") ? document.getElementById("promoInput").value : "";

    let html = '<div class="promo-box">';
    if (totals.promo.code) {
      html +=
        '<div class="promo-applied">' +
        '<span>' + totals.promo.code + " — " + (totals.promo.meta ? totals.promo.meta.description : "") + "</span>" +
        '<button type="button" data-promo-remove aria-label="Убрать промокод">×</button>' +
        "</div>";
      if (!totals.promo.active && totals.promo.meta) {
        html +=
          '<p class="promo-hint">Добавьте товаров ещё на ' +
          utils.formatPrice(totals.promo.meta.minTotal - totals.subtotal) +
          ", чтобы активировать скидку</p>";
      }
    } else {
      html +=
        '<form class="promo-input-row" id="promoForm">' +
        '<input id="promoInput" placeholder="Промокод" autocomplete="off" value="' + utils.escapeHtml(preservedValue) + '">' +
        '<button type="submit" class="btn btn--dark">Применить</button>' +
        "</form>";
    }
    html += "</div>";

    html += '<div class="cart-totals">';
    html += '<div class="row"><span>Подытог</span><span>' + utils.formatPrice(totals.subtotal) + "</span></div>";
    if (totals.promo.active && totals.promo.discount > 0) {
      html += '<div class="row row--discount"><span>Скидка</span><span>−' + utils.formatPrice(totals.promo.discount) + "</span></div>";
    }
    html += '<div class="row row--total"><span>Итого</span><span>' + utils.formatPrice(totals.total) + "</span></div>";
    html += "</div>";

    html += '<button type="button" class="checkout" id="checkoutBtn"><span>Оформить заказ</span></button>';

    summaryEl.innerHTML = html;
  }

  function renderSuccess(orderNumber) {
    itemsEl.innerHTML =
      '<div class="empty-state empty-state--success">' +
      '<div class="empty-state-icon success-pop">✓</div>' +
      "<p>Заказ оформлен!</p>" +
      '<p class="order-number">№ ' + orderNumber + "</p>" +
      '<button type="button" class="btn btn--outline" data-close>Продолжить покупки</button>' +
      "</div>";
    summaryEl.innerHTML = "";
    summaryEl.hidden = true;
  }

  function render() {
    if (checkoutDone) return;
    const totals = Aromio.Store.getCartTotals();
    renderItems(totals);
    renderSummary(totals);
  }

  function handleCheckout(btn) {
    if (btn.classList.contains("is-loading")) return;
    btn.classList.add("is-loading");
    btn.disabled = true;

    const totals = Aromio.Store.getCartTotals();

    setTimeout(() => {
      checkoutDone = true;
      const orderNumber = "ARO-" + Math.floor(10000 + Math.random() * 90000);

      Aromio.Store.addOrder({
        number: orderNumber,
        date: new Date().toISOString(),
        items: totals.items.map((i) => ({ name: i.product.name, ml: i.ml, qty: i.qty, lineTotal: i.lineTotal })),
        total: totals.total,
      });

      renderSuccess(orderNumber);
      Aromio.Store.clearCart();
      if (Aromio.Effects) Aromio.Effects.confetti();
    }, 900);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const drawer = document.getElementById("cartDrawer");
    if (!drawer) return;
    itemsEl = document.getElementById("cartItemsScroll");
    summaryEl = document.getElementById("cartSummary");

    itemsEl.addEventListener("click", (e) => {
      const row = e.target.closest("[data-key]");
      if (!row) return;
      const [id, ml] = row.dataset.key.split(":").map(Number);

      if (e.target.closest("[data-qty-inc]")) {
        Aromio.Store.updateQty(id, ml, Number(row.dataset.qty) + 1);
      } else if (e.target.closest("[data-qty-dec]")) {
        Aromio.Store.updateQty(id, ml, Number(row.dataset.qty) - 1);
      } else if (e.target.closest("[data-remove]")) {
        row.classList.add("is-removing");
        setTimeout(() => Aromio.Store.removeFromCart(id, ml), 180);
      }
    });

    summaryEl.addEventListener("submit", (e) => {
      if (e.target.id === "promoForm") {
        e.preventDefault();
        const input = document.getElementById("promoInput");
        Aromio.Store.applyPromo(input.value);
      }
    });

    summaryEl.addEventListener("click", (e) => {
      if (e.target.closest("[data-promo-remove]")) {
        Aromio.Store.removePromo();
      } else if (e.target.closest("#checkoutBtn")) {
        handleCheckout(e.target.closest("#checkoutBtn"));
      }
    });

    drawer.addEventListener("transitionend", (e) => {
      if (e.target === drawer && !drawer.classList.contains("open") && checkoutDone) {
        checkoutDone = false;
        render();
      }
    });

    Aromio.Store.subscribe(render);
    render();
  });
})(window.Aromio);
