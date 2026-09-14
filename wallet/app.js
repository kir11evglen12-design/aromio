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
  var trail = [];        // where the back arrow goes, in order

  var ROUTES = {
    welcome:  function () { return Screens.welcome(); },
    create:   function () { return Screens.createFlow(); },
    import:   function () { return Screens.importFlow(); },
    lock:     function () { return Screens.lockScreen(); },
    home:     function () { return Screens.home(); },
    token:    function () { return Screens.tokenScreen(param); },
    staking:  function () { return Screens.stakingScreen(); },
    calc:     function () { return Screens.calcScreen(); },
    addresses: function () { return Screens.addressesScreen(); },
    market:   function () { return Screens.marketScreen(); },
    settings: function () { return Screens.settingsScreen(); }
  };

  var NEEDS_WALLET = { home: 1, token: 1, staking: 1, calc: 1, addresses: 1, market: 1, settings: 1 };

  function mount(node) {
    var host = UI.$("#app");
    /* Screens can register document-level listeners (the keypad does).
       Same teardown signal a closing sheet gets, so nothing outlives it. */
    if (current) current.dispatchEvent(new CustomEvent("sheet-teardown"));
    host.innerHTML = "";
    host.appendChild(node);
    current = node;
  }

  function render() {
    if (NEEDS_WALLET[route] && !Store.isUnlocked()) route = Store.exists() ? "lock" : "welcome";
    mount((ROUTES[route] || ROUTES.welcome)());
  }

  function go(name, value) {
    if (route !== name || param !== value) trail.push({ route: route, param: param });
    if (trail.length > 12) trail.shift();
    route = name;
    param = value == null ? null : value;
    UI.closeSheet(true);
    render();
    var scroll = UI.$(".scroll", current);
    if (scroll) scroll.scrollTop = 0;
  }

  /** One step back through the trail; home when there is nothing behind. */
  function back() {
    var previous = trail.pop();
    while (previous && (previous.route === route || previous.route === "welcome" ||
                        previous.route === "create" || previous.route === "import" ||
                        previous.route === "lock")) {
      previous = trail.pop();
    }
    route = previous ? previous.route : "home";
    param = previous ? previous.param : null;
    UI.closeSheet(true);
    render();
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
    trail = [];
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

  global.App = { go: go, back: back, refresh: refresh, start: start, route: function () { return route; } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})(typeof window !== "undefined" ? window : globalThis);
