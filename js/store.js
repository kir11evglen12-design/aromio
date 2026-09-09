/* ==========================================================================
   AROMIO — application state: cart, favorites, promo code
   Single source of truth backed by localStorage, with a tiny pub/sub so
   independent UI modules (header, cart drawer, favorites, product page)
   stay in sync without knowing about each other.
   ========================================================================== */

(function (Aromio) {
  "use strict";

  const utils = Aromio.utils;
  const KEYS = {
    cart: "aromio.cart.v1",
    favorites: "aromio.favorites.v1",
    promo: "aromio.promo.v1",
    newsletter: "aromio.newsletter.v1",
    orders: "aromio.orders.v1",
    profileName: "aromio.profileName.v1",
  };

  let cart = utils.getJSON(KEYS.cart, []); // [{id, ml, qty}]
  let favorites = utils.getJSON(KEYS.favorites, []); // [id, ...]
  let promoCode = utils.getJSON(KEYS.promo, null); // "AROMIO10" | null
  let orders = utils.getJSON(KEYS.orders, []); // [{number, date, items, total}]
  let profileName = utils.getJSON(KEYS.profileName, "");

  const listeners = [];
  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const i = listeners.indexOf(fn);
      if (i > -1) listeners.splice(i, 1);
    };
  }
  function notify() {
    listeners.forEach((fn) => fn());
  }

  function findProduct(id) {
    return Aromio.PRODUCTS.find((p) => p.id === id);
  }

  function cartKey(id, ml) {
    return id + ":" + ml;
  }

  // ---------------------------------------------------------------- cart --
  function getCart() {
    return cart
      .map((item) => {
        const product = findProduct(item.id);
        if (!product) return null;
        const volume = product.volumes.find((v) => v.ml === item.ml) || product.volumes[2];
        return {
          key: cartKey(item.id, item.ml),
          id: item.id,
          ml: volume.ml,
          qty: item.qty,
          product: product,
          unitPrice: volume.price,
          lineTotal: volume.price * item.qty,
        };
      })
      .filter(Boolean);
  }

  function getCartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
  }

  function addToCart(id, ml, qty) {
    qty = qty || 1;
    const product = findProduct(id);
    if (!product) return;
    const volume = product.volumes.find((v) => v.ml === ml) || product.volumes[2];

    const existing = cart.find((c) => c.id === id && c.ml === volume.ml);
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({ id: id, ml: volume.ml, qty: qty });
    }

    utils.setJSON(KEYS.cart, cart);
    notify();
    Aromio.Toast.show({
      type: "success",
      title: "Добавлено в корзину",
      message: product.name + " · " + volume.ml + " мл",
    });
  }

  function updateQty(id, ml, qty) {
    if (qty <= 0) {
      removeFromCart(id, ml, { silent: true });
      return;
    }
    const item = cart.find((c) => c.id === id && c.ml === ml);
    if (item) {
      item.qty = qty;
      utils.setJSON(KEYS.cart, cart);
      notify();
    }
  }

  function removeFromCart(id, ml, opts) {
    const product = findProduct(id);
    cart = cart.filter((c) => !(c.id === id && c.ml === ml));
    utils.setJSON(KEYS.cart, cart);
    notify();
    if (!opts || !opts.silent) {
      Aromio.Toast.show({
        type: "info",
        title: "Товар удалён",
        message: product ? product.name : "",
      });
    }
  }

  function clearCart() {
    cart = [];
    promoCode = null;
    utils.setJSON(KEYS.cart, cart);
    utils.setJSON(KEYS.promo, promoCode);
    notify();
  }

  // --------------------------------------------------------------- promo --
  function getPromoState(subtotal) {
    if (!promoCode) return { code: null, active: false, discount: 0 };
    const meta = Aromio.PROMO_CODES[promoCode];
    if (!meta) return { code: null, active: false, discount: 0 };

    const eligible = subtotal >= meta.minTotal;
    const discount = eligible
      ? meta.type === "percent"
        ? Math.round((subtotal * meta.value) / 100)
        : Math.min(meta.value, subtotal)
      : 0;

    return { code: promoCode, meta: meta, active: eligible, discount: discount };
  }

  function getCartTotals() {
    const items = getCart();
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const promo = getPromoState(subtotal);
    const total = Math.max(subtotal - promo.discount, 0);
    return { items: items, subtotal: subtotal, promo: promo, total: total };
  }

  function applyPromo(rawCode) {
    const code = String(rawCode || "").trim().toUpperCase();
    if (!code) return false;

    const meta = Aromio.PROMO_CODES[code];
    if (!meta) {
      Aromio.Toast.show({ type: "error", title: "Промокод не найден", message: "Проверьте правильность ввода" });
      return false;
    }

    const subtotal = getCart().reduce((sum, i) => sum + i.lineTotal, 0);
    if (subtotal < meta.minTotal) {
      Aromio.Toast.show({
        type: "error",
        title: "Промокод пока недоступен",
        message: "Минимальная сумма заказа — " + utils.formatPrice(meta.minTotal),
      });
      return false;
    }

    promoCode = code;
    utils.setJSON(KEYS.promo, promoCode);
    notify();
    Aromio.Toast.show({ type: "success", title: "Промокод применён", message: meta.description });
    return true;
  }

  function removePromo() {
    promoCode = null;
    utils.setJSON(KEYS.promo, promoCode);
    notify();
  }

  // ----------------------------------------------------------- favorites --
  function isFavorite(id) {
    return favorites.indexOf(id) > -1;
  }

  function getFavorites() {
    return favorites.map(findProduct).filter(Boolean);
  }

  function getFavoritesCount() {
    return favorites.length;
  }

  function toggleFavorite(id) {
    const product = findProduct(id);
    if (!product) return;
    const idx = favorites.indexOf(id);
    const added = idx === -1;

    if (added) {
      favorites.push(id);
    } else {
      favorites.splice(idx, 1);
    }

    utils.setJSON(KEYS.favorites, favorites);
    notify();
    Aromio.Toast.show({
      type: added ? "heart" : "info",
      title: added ? "Добавлено в избранное" : "Удалено из избранного",
      message: product.name,
    });
  }

  // -------------------------------------------------------------- orders --
  function getOrders() {
    return orders.slice().reverse(); // newest first
  }

  function addOrder(order) {
    orders.push(order);
    utils.setJSON(KEYS.orders, orders);
    notify();
  }

  function getProfileName() {
    return profileName;
  }

  function setProfileName(name) {
    profileName = String(name || "").trim();
    utils.setJSON(KEYS.profileName, profileName);
    notify();
  }

  // ---------------------------------------------------------- newsletter --
  function hasNewsletterCode() {
    return !!utils.getJSON(KEYS.newsletter, false);
  }

  function grantNewsletterCode() {
    utils.setJSON(KEYS.newsletter, true);
  }

  Aromio.Store = {
    subscribe,
    getCart,
    getCartCount,
    getCartTotals,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    applyPromo,
    removePromo,
    isFavorite,
    getFavorites,
    getFavoritesCount,
    toggleFavorite,
    getOrders,
    addOrder,
    getProfileName,
    setProfileName,
    hasNewsletterCode,
    grantNewsletterCode,
  };
})((window.Aromio = window.Aromio || {}));
