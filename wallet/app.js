/**
 * Router and boot.
 *
 * Five routes, one mount point. Which one opens first is decided by the
 * stored state: no wallet -> welcome, wallet but locked -> lock screen,
 * unlocked -> home.
 */
(function (global) {
  "use strict";

  var UI = global.UI, Store = global.WalletStore, Market = global.Market, Screens = global.Screens;

  var TICK_MS = 2600;
  var route = "welcome";
  var param = null;
  var current = null;
  var timer = null;

  var ROUTES = {
    welcome:  function () { return Screens.welcome(); },
    create:   function () { return Screens.createFlow(); },
    import:   function () { return Screens.importFlow(); },
    lock:     function () { return Screens.lockScreen(); },
    home:     function () { return Screens.home(); },
    token:    function () { return Screens.tokenScreen(param); },
    staking:  function () { return Screens.stakingScreen(); },
    settings: function () { return Screens.settingsScreen(); }
  };

  var NEEDS_WALLET = { home: 1, token: 1, staking: 1, settings: 1 };

  function mount(node) {
    var host = UI.$("#app");
    host.innerHTML = "";
    host.appendChild(node);
    current = node;
  }

  function render() {
    if (NEEDS_WALLET[route] && !Store.isUnlocked()) route = Store.exists() ? "lock" : "welcome";
    mount((ROUTES[route] || ROUTES.welcome)());
  }

  function go(name, value) {
    route = name;
    param = value == null ? null : value;
    UI.closeSheet(true);
    render();
    var scroll = UI.$(".scroll", current);
    if (scroll) scroll.scrollTop = 0;
  }

  function refresh() { render(); }

  /** One market step: prices move, alerts fire, the screen catches up. */
  function tick() {
    Market.tick();

    if (Store.isUnlocked()) {
      var fired = Store.checkAlerts();
      if (fired.length) {
        var first = Market.byId(fired[0].tokenId);
        UI.toast(first.sym + " " + (fired[0].direction === "above" ? "выше" : "ниже") + " " +
          Market.money(fired[0].price, Store.settings().currency), "bell");
        if (!UI.sheetIsOpen()) render();       // the bell badge has to change
        return;
      }
    }

    if (current && current.__tick && !UI.sheetIsOpen()) {
      try { current.__tick(); } catch (e) { /* a half-rendered screen is not worth crashing over */ }
    }
  }

  function start() {
    route = !Store.exists() ? "welcome" : Store.isUnlocked() ? "home" : "lock";
    render();
    clearInterval(timer);
    timer = setInterval(tick, TICK_MS);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && UI.sheetIsOpen()) UI.closeSheet();
    });

    /* Pause the market while the tab is in the background: a wallet that
       churns numbers nobody is looking at only burns battery. */
    document.addEventListener("visibilitychange", function () {
      clearInterval(timer);
      if (!document.hidden) timer = setInterval(tick, TICK_MS);
    });
  }

  global.App = { go: go, refresh: refresh, start: start, route: function () { return route; } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof window !== "undefined" ? window : globalThis);
