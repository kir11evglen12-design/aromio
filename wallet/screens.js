/**
 * Every screen and sheet in the wallet.
 *
 * Each function returns a detached DOM node; the router in app.js decides
 * what is on screen. Rendering is plain re-creation — at this size it is
 * cheaper to read than any diffing scheme would be.
 */
(function (global) {
  "use strict";

  var UI = global.UI, Market = global.Market, Store = global.WalletStore, Vault = global.Vault;
  var h = UI.h, icon = UI.icon, esc = UI.esc;

  var BRAND = "Cobalt";

  var MARK =
    '<svg class="hero__mark" viewBox="0 0 64 64" aria-hidden="true">' +
    '<defs><linearGradient id="mk" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0" stop-color="#5b93ff"/><stop offset="1" stop-color="#12b6ff"/></linearGradient></defs>' +
    '<path d="M32 3 57 17v30L32 61 7 47V17z" fill="url(#mk)"/>' +
    '<path d="M32 3 57 17 32 31 7 17z" fill="#fff" opacity=".24"/>' +
    '<path d="M32 31v30L7 47V17z" fill="#000" opacity=".2"/>' +
    "</svg>";

  function app() { return global.App; }
  function currency() { return Store.settings().currency; }
  function money(usd, opts) { return Market.money(usd, currency(), opts); }

  /* ============================================================
     onboarding
     ============================================================ */

  function welcome() {
    return h("div", { class: "screen screen--enter" }, [
      h("div", { class: "topbar" }, [
        h("div", { class: "spacer" }),
        h("span", { class: "pill", html: '<span class="pill__dot"></span>демо' })
      ]),
      h("div", { class: "hero", html: MARK }),
      h("div", { class: "hero", style: "flex:0" }, [
        h("div", { class: "hero__title", text: BRAND }),
        h("div", { class: "hero__sub", text: "Кошелёк с большими кнопками «Купить» и «Продать». Симулятор: настоящих денег и настоящей сети здесь нет." })
      ]),
      h("div", { class: "foot" }, [
        h("button", {
          class: "btn btn--primary", html: icon("plus") + "<span>Создать кошелёк</span>",
          onclick: function () { app().go("create"); }
        }),
        h("button", {
          class: "btn btn--ghost", html: icon("key") + "<span>У меня уже есть фраза</span>",
          onclick: function () { app().go("import"); }
        })
      ])
    ]);
  }

  /** Password + confirmation, shared by the create and import flows. */
  function passwordFields(onValid) {
    var pass = h("input", { class: "input", type: "password", placeholder: "Не короче 8 символов", autocomplete: "new-password" });
    var again = h("input", { class: "input", type: "password", placeholder: "Ещё раз", autocomplete: "new-password" });
    var hint = h("div", { class: "hint" });

    var check = function () {
      var a = pass.value, b = again.value;
      var problem = a.length < 8 ? "Пароль короче восьми символов"
        : (b && a !== b) ? "Пароли не совпадают" : "";
      hint.textContent = problem || "Пароль хранится только у вас — восстановить его нельзя.";
      hint.className = "hint" + (problem && b ? " hint--bad" : "");
      onValid(!problem && a === b && b.length > 0, a);
    };
    pass.addEventListener("input", check);
    again.addEventListener("input", check);
    check();

    return {
      node: h("div", {}, [
        h("label", { class: "field" }, [h("span", { class: "field__label", text: "Пароль" }), pass]),
        h("label", { class: "field" }, [h("span", { class: "field__label", text: "Повторите" }), again]),
        hint
      ]),
      focus: function () { pass.focus(); }
    };
  }

  function createFlow() {
    var step = 0;
    var password = "";
    var recovery = Vault.newPhrase();
    var revealed = false;

    var body = h("div", { class: "scroll" });
    var foot = h("div", { class: "foot" });
    var dots = h("div", { class: "steps" });

    var screen = h("div", { class: "screen screen--enter" }, [
      h("div", { class: "topbar" }, [
        h("button", {
          class: "iconbtn", "aria-label": "Назад", html: icon("arrow-left"),
          onclick: function () { step ? (step--, render()) : app().go("welcome"); }
        }),
        h("div", { class: "spacer" }),
        h("span", { class: "pill", html: '<span class="pill__dot"></span>демо' })
      ]),
      dots, body, foot
    ]);

    function render() {
      dots.innerHTML = "";
      [0, 1, 2].forEach(function (i) { dots.appendChild(h("div", { class: "step" + (i <= step ? " step--on" : "") })); });
      body.innerHTML = "";
      foot.innerHTML = "";
      if (step === 0) stepPassword();
      else if (step === 1) stepPhrase();
      else stepVerify();
    }

    function heading(title, sub) {
      body.appendChild(h("div", { style: "padding:14px 4px 6px" }, [
        h("div", { style: "font-size:24px;font-weight:740;letter-spacing:-.03em", text: title }),
        h("div", { class: "muted", style: "font-size:13.5px;margin-top:6px;line-height:1.5", text: sub })
      ]));
    }

    function stepPassword() {
      heading("Придумайте пароль", "Им шифруется секретная фраза в этом браузере. Пароль не уходит никуда.");
      var next = h("button", { class: "btn btn--primary", text: "Дальше", disabled: true, onclick: function () { step = 1; render(); } });
      var fields = passwordFields(function (ok, value) {
        password = value;
        next.disabled = !ok;
      });
      body.appendChild(fields.node);
      foot.appendChild(next);
      fields.focus();
    }

    function stepPhrase() {
      heading("Секретная фраза", "Двенадцать слов восстанавливают доступ. Запишите их по порядку и держите офлайн.");
      var grid = h("div", { class: "seedgrid" });
      recovery.split(" ").forEach(function (word, i) {
        grid.appendChild(h("div", { class: "seedword" }, [
          h("span", { class: "seedword__i", text: String(i + 1) }),
          h("span", { text: word })
        ]));
      });

      var wrap = h("div", { class: revealed ? "" : "blurred" }, [grid]);
      if (!revealed) {
        wrap.appendChild(h("button", {
          class: "blurred__cta", html: icon("eye") + "<span>Показать фразу</span>",
          onclick: function () { revealed = true; render(); }
        }));
      }
      body.appendChild(wrap);
      body.appendChild(h("div", { style: "height:10px" }));
      body.appendChild(h("div", { class: "warn" }, [
        h("span", { html: icon("alert") }),
        h("span", { text: "Кто знает фразу — распоряжается счётом. Настоящий кошелёк никогда не попросит её у вас в переписке." })
      ]));
      foot.appendChild(h("button", {
        class: "btn btn--ghost", html: icon("copy") + "<span>Скопировать</span>",
        onclick: function () { UI.copy(recovery, "Фраза скопирована"); }
      }));
      foot.appendChild(h("button", {
        class: "btn btn--primary", text: "Я записал", disabled: !revealed,
        onclick: function () { step = 2; render(); }
      }));
    }

    function stepVerify() {
      var words = recovery.split(" ");
      var asked = [];
      var rnd = Market.mulberry(Market.hashSeed(recovery));
      while (asked.length < 3) {
        var i = Math.floor(rnd() * 12);
        if (asked.indexOf(i) === -1) asked.push(i);
      }
      asked.sort(function (a, b) { return a - b; });
      var answers = {};

      heading("Проверим фразу", "Выберите слова, которые стоят на этих местах.");

      asked.forEach(function (index) {
        var options = [words[index]];
        while (options.length < 4) {
          var w = global.Wordlist.WORDS[Math.floor(Math.random() * 256)];
          if (options.indexOf(w) === -1) options.push(w);
        }
        options.sort(function () { return Math.random() - 0.5; });

        var row = h("div", { class: "chips", style: "flex-wrap:wrap" });
        options.forEach(function (word) {
          row.appendChild(h("button", {
            class: "chip", text: word, style: "flex:1 1 40%",
            onclick: function () {
              answers[index] = word;
              UI.$$(".chip", row).forEach(function (c) { c.style.background = ""; c.style.color = ""; });
              this.style.background = word === words[index] ? "rgb(36 214 160 / .22)" : "rgb(255 92 124 / .2)";
              this.style.color = word === words[index] ? "#24d6a0" : "#ff5c7c";
              check();
            }
          }));
        });
        body.appendChild(h("div", { class: "h", text: "Слово № " + (index + 1) }));
        body.appendChild(row);
      });

      var done = h("button", {
        class: "btn btn--primary", text: "Готово", disabled: true,
        onclick: function () {
          Store.create(password, recovery);
          app().go("home");
          UI.toast("Кошелёк создан. Демо-портфель начислен.", "check");
        }
      });
      function check() {
        done.disabled = !asked.every(function (i) { return answers[i] === words[i]; });
      }
      foot.appendChild(h("button", { class: "btn btn--ghost", text: "Показать фразу ещё раз", onclick: function () { step = 1; render(); } }));
      foot.appendChild(done);
    }

    render();
    return screen;
  }

  function importFlow() {
    var password = "";
    var passOk = false;
    var area = h("textarea", {
      class: "input input--mono", rows: 3, placeholder: "двенадцать слов через пробел",
      style: "resize:none", spellcheck: "false", autocapitalize: "off"
    });
    var hint = h("div", { class: "hint" });
    var submit = h("button", { class: "btn btn--primary", text: "Восстановить", disabled: true });

    function check() {
      var text = area.value.trim();
      var count = text ? Vault.normalizePhrase(text).split(" ").length : 0;
      var valid = Vault.phraseIsValid(text);
      area.className = "input input--mono" + (count >= 12 && !valid ? " input--bad" : "");
      hint.className = "hint" + (count >= 12 && !valid ? " hint--bad" : "");
      hint.textContent = !text ? "Слов: 0 из 12"
        : valid ? "Фраза распознана"
        : count < 12 ? "Слов: " + count + " из 12"
        : "Такие слова не из демо-словаря. Настоящую seed-фразу сюда вводить нельзя.";
      submit.disabled = !(valid && passOk);
    }
    area.addEventListener("input", check);

    var fields = passwordFields(function (ok, value) { passOk = ok; password = value; check(); });

    submit.addEventListener("click", function () {
      var recovery = Vault.normalizePhrase(area.value);
      Store.create(password, recovery);
      app().go("home");
      UI.toast("Кошелёк восстановлен", "check");
    });

    return h("div", { class: "screen screen--enter" }, [
      h("div", { class: "topbar" }, [
        h("button", { class: "iconbtn", "aria-label": "Назад", html: icon("arrow-left"), onclick: function () { app().go("welcome"); } }),
        h("div", { class: "spacer" }),
        h("span", { class: "pill", html: '<span class="pill__dot"></span>демо' })
      ]),
      h("div", { class: "scroll" }, [
        h("div", { style: "padding:14px 4px 10px" }, [
          h("div", { style: "font-size:24px;font-weight:740;letter-spacing:-.03em", text: "Восстановить кошелёк" })
        ]),
        h("div", { class: "warn" }, [
          h("span", { html: icon("alert") }),
          h("span", { text: "Это симулятор. Он принимает только фразы из своего словаря — настоящую seed-фразу от реального кошелька не вводите ни здесь, ни на любом сайте." })
        ]),
        h("label", { class: "field" }, [h("span", { class: "field__label", text: "Секретная фраза" }), area]),
        hint,
        h("button", {
          class: "btn btn--ghost btn--sm", style: "margin-top:10px",
          html: icon("zap") + "<span>Подставить демо-фразу</span>",
          onclick: function () { area.value = Vault.newPhrase(); check(); }
        }),
        fields.node
      ]),
      h("div", { class: "foot" }, [submit])
    ]);
  }

  function lockScreen() {
    var pass = h("input", { class: "input", type: "password", placeholder: "Пароль", autocomplete: "current-password" });
    var hint = h("div", { class: "hint" });
    var open = function () {
      if (Store.unlock(pass.value)) { app().go("home"); return; }
      hint.className = "hint hint--bad";
      hint.textContent = "Неверный пароль";
      pass.value = "";
      pass.focus();
    };
    pass.addEventListener("keydown", function (e) { if (e.key === "Enter") open(); });

    var screen = h("div", { class: "screen screen--enter" }, [
      h("div", { class: "hero" }, [
        UI.frag(MARK),
        h("div", { class: "hero__title", text: BRAND }),
        h("div", { class: "hero__sub", text: "Кошелёк заблокирован" }),
        h("div", { style: "width:100%;max-width:300px;margin-top:6px" }, [pass, hint])
      ]),
      h("div", { class: "foot" }, [
        h("button", { class: "btn btn--primary", html: icon("lock") + "<span>Разблокировать</span>", onclick: open }),
        h("button", {
          class: "btn btn--ghost btn--sm", text: "Сбросить кошелёк",
          onclick: function () { confirmReset(); }
        })
      ])
    ]);
    setTimeout(function () { pass.focus(); }, 60);
    return screen;
  }

  function confirmReset() {
    UI.openSheet("Сбросить кошелёк?", [
      h("div", { class: "warn" }, [
        h("span", { html: icon("alert") }),
        h("span", { text: "Счета, история и секретная фраза будут удалены из этого браузера. Восстановить можно только по записанной фразе." })
      ])
    ], [
      h("button", { class: "btn btn--ghost", text: "Отмена", onclick: function () { UI.closeSheet(); } }),
      h("button", {
        class: "btn btn--danger", html: icon("trash") + "<span>Удалить всё</span>",
        onclick: function () { Store.reset(); UI.closeSheet(); app().go("welcome"); UI.toast("Кошелёк сброшен", "trash"); }
      })
    ]);
  }

  /* ============================================================
     home
     ============================================================ */

  var homeTab = "tokens";

  function topBar() {
    var acc = Store.account();
    return h("div", { class: "topbar" }, [
      h("button", {
        class: "acct", onclick: accountsSheet,
        html: '<span class="avatar" style="' + UI.avatarStyle(acc.address) + '">' + esc(acc.name.slice(0, 1).toUpperCase()) + "</span>" +
              '<span style="text-align:left"><span class="acct__name">' + esc(acc.name) + "</span><br>" +
              '<span class="acct__addr mono">' + esc(UI.shortAddress(acc.address, 4, 4)) + "</span></span>" +
              '<span style="color:var(--dim);display:flex">' + icon("chevron-down") + "</span>"
      }),
      h("div", { class: "spacer" }),
      h("button", {
        class: "iconbtn", "aria-label": Store.settings().hidden ? "Показать суммы" : "Скрыть суммы",
        html: icon(Store.settings().hidden ? "eye-off" : "eye"),
        onclick: function () { Store.setSetting("hidden", !Store.settings().hidden); app().refresh(); }
      }),
      h("button", { class: "iconbtn", "aria-label": "Настройки", html: icon("settings"), onclick: function () { app().go("settings"); } })
    ]);
  }

  function hidden() { return Store.settings().hidden; }
  function maybe(text) { return hidden() ? "••••••" : text; }

  function deltaPill(value) {
    var down = value < 0;
    return h("span", {
      class: "delta" + (down ? " delta--down" : ""),
      html: icon(down ? "arrow-down" : "arrow-up") +
        "<span>" + esc(Market.percent(value)) + "</span>" +
        '<span style="opacity:.7">за сутки</span>'
    });
  }

  function home() {
    var scroll = h("div", { class: "scroll" });
    var screen = h("div", { class: "screen screen--enter" }, [topBar(), scroll]);

    var change = Store.totalChange();
    scroll.appendChild(h("div", { class: "balance" }, [
      h("div", { class: "balance__label", text: "Общий баланс" }),
      h("div", { class: "balance__value num" + (hidden() ? " balance__value--hidden" : ""), id: "total", text: maybe(money(Store.total(), { dp: 2 })) }),
      deltaPill(change)
    ]));

    scroll.appendChild(h("div", { class: "bigrow" }, [
      h("button", {
        class: "bigbtn bigbtn--buy",
        html: icon("arrow-down") + "<span>КУПИТЬ</span><span class='bigbtn__hint'>с карты •• " + esc(Store.card().last4) + "</span>",
        onclick: function () { buySheet(); }
      }),
      h("button", {
        class: "bigbtn bigbtn--sell",
        html: icon("arrow-up") + "<span>ПРОДАТЬ</span><span class='bigbtn__hint'>вывод на карту</span>",
        onclick: function () { sellSheet(); }
      })
    ]));

    scroll.appendChild(h("div", { class: "quickrow" }, [
      quick("arrow-up-right", "Отправить", function () { sendSheet(); }),
      quick("qr", "Получить", receiveSheet),
      quick("swap", "Обмен", function () { swapSheet(); }),
      quick("clock", "История", function () { homeTab = "history"; app().refresh(); })
    ]));

    var tabs = h("div", { class: "tabs", role: "tablist" });
    [["tokens", "Токены"], ["nfts", "Коллекции"], ["history", "История"]].forEach(function (pair) {
      tabs.appendChild(h("button", {
        class: "tab", role: "tab", "aria-selected": String(homeTab === pair[0]), text: pair[1],
        onclick: function () { homeTab = pair[0]; app().refresh(); }
      }));
    });
    scroll.appendChild(tabs);

    var tabHost = h("div");
    function renderTab() {
      tabHost.innerHTML = "";
      tabHost.appendChild(homeTab === "tokens" ? tokenList()
        : homeTab === "nfts" ? collectibles() : activityList());
    }
    renderTab();
    scroll.appendChild(tabHost);

    /* A market tick repaints the numbers only — replacing the whole screen
       here would throw away the scroll position every couple of seconds. */
    screen.__tick = function () {
      var totalEl = UI.$("#total", scroll);
      if (totalEl) totalEl.textContent = maybe(money(Store.total(), { dp: 2 }));
      if (homeTab === "tokens") renderTab();
    };

    return screen;
  }

  function quick(name, label, onclick) {
    return h("button", { class: "quick", html: icon(name) + "<span>" + esc(label) + "</span>", onclick: onclick });
  }

  function tokenList() {
    var list = h("div", { class: "list" });
    var owned = Market.TOKENS.slice().sort(function (a, b) {
      return Store.balanceOf(b.id) * b.price - Store.balanceOf(a.id) * a.price;
    });
    owned.forEach(function (token) {
      var change = Market.change(token.id, "1d");
      var value = Store.balanceOf(token.id) * token.price;
      list.appendChild(h("button", {
        class: "row", dataset: { token: token.id },
        onclick: function () { app().go("token", token.id); },
        html:
          UI.coinBadge(token) +
          '<span style="min-width:0"><span class="row__name">' + esc(token.name) + "</span>" +
          '<span class="row__sub num">' + esc(maybe(Market.amount(Store.balanceOf(token.id), token.id) + " " + token.sym)) +
          "</span></span>" +
          UI.sparkline(Market.series(token.id, "1d"), change >= 0) +
          '<span class="row__right"><span class="row__val num">' + esc(maybe(Market.money(value, currency(), { dp: 2 }))) + "</span><br>" +
          '<span class="row__delta' + (change < 0 ? " row__delta--down" : "") + ' num">' +
          esc(Market.percent(change)) + "</span></span>"
      }));
    });
    return list;
  }

  /* ============================================================
     token detail
     ============================================================ */

  var frame = "1d";

  function tokenScreen(tokenId) {
    var token = Market.byId(tokenId);
    var scroll = h("div", { class: "scroll" });
    var priceEl = h("div", { class: "balance__value num", text: Market.money(token.price, currency(), { dp: token.price < 10 ? 4 : 2 }) });
    var subEl = h("div", { class: "balance__label", text: "Курс " + token.sym });
    var deltaHost = h("div");
    var chartHost = h("div", { class: "chartwrap" });

    function paint() {
      var values = Market.series(tokenId, frame);
      var change = Market.change(tokenId, frame);
      deltaHost.innerHTML = "";
      var down = change < 0;
      deltaHost.appendChild(h("span", {
        class: "delta" + (down ? " delta--down" : ""),
        html: icon(down ? "arrow-down" : "arrow-up") + "<span>" + esc(Market.percent(change)) + "</span>"
      }));
      UI.areaChart(chartHost, values, {
        onHover: function (value) {
          priceEl.textContent = Market.money(value == null ? token.price : value, currency(), { dp: token.price < 10 ? 4 : 2 });
          subEl.textContent = value == null ? "Курс " + token.sym : "На выбранной точке";
        }
      });
    }

    var seg = h("div", { class: "seg" });
    Market.FRAMES.forEach(function (f) {
      seg.appendChild(h("button", {
        class: "segbtn", "aria-pressed": String(frame === f.id), text: f.label,
        onclick: function () {
          frame = f.id;
          UI.$$(".segbtn", seg).forEach(function (b) { b.setAttribute("aria-pressed", String(b.textContent === f.label)); });
          paint();
        }
      }));
    });

    var hovering = false;
    chartHost.addEventListener("pointerenter", function () { hovering = true; });
    chartHost.addEventListener("pointerleave", function () { hovering = false; });

    scroll.appendChild(h("div", { class: "balance" }, [subEl, priceEl, deltaHost]));
    scroll.appendChild(chartHost);
    scroll.appendChild(seg);

    scroll.appendChild(h("div", { class: "bigrow" }, [
      h("button", {
        class: "bigbtn bigbtn--buy", html: icon("arrow-down") + "<span>КУПИТЬ</span><span class='bigbtn__hint'>" + esc(token.sym) + "</span>",
        onclick: function () { buySheet(tokenId); }
      }),
      h("button", {
        class: "bigbtn bigbtn--sell", html: icon("arrow-up") + "<span>ПРОДАТЬ</span><span class='bigbtn__hint'>" + esc(token.sym) + "</span>",
        onclick: function () { sellSheet(tokenId); }
      })
    ]));

    scroll.appendChild(h("div", { class: "quickrow", style: "grid-template-columns:repeat(3,1fr)" }, [
      quick("arrow-up-right", "Отправить", function () { sendSheet(tokenId); }),
      quick("qr", "Получить", receiveSheet),
      quick("swap", "Обмен", function () { swapSheet(tokenId); })
    ]));

    var balance = Store.balanceOf(tokenId);
    var share = Store.total() > 0 ? (balance * token.price) / Store.total() * 100 : 0;
    scroll.appendChild(h("div", { class: "h", text: "Ваш баланс" }));
    scroll.appendChild(h("div", { class: "card" }, [
      kv("В кошельке", maybe(Market.amount(balance, tokenId) + " " + token.sym)),
      kv("Стоимость", maybe(money(balance * token.price, { dp: 2 }))),
      kv("Доля портфеля", share.toFixed(1).replace(".", ",") + " %"),
      kv("Сеть", token.chain),
      kv("Комиссия сети", Market.amount(Store.networkFee(tokenId), tokenId) + " " + token.sym)
    ]));

    scroll.appendChild(h("div", { class: "h", text: "О токене" }));
    scroll.appendChild(h("div", { class: "card muted", style: "font-size:13.5px;line-height:1.5", text: token.note + ". Котировки в этом приложении сгенерированы и не связаны с биржами." }));

    var screen = h("div", { class: "screen screen--enter" }, [
      h("div", { class: "topbar" }, [
        h("button", { class: "iconbtn", "aria-label": "Назад", html: icon("arrow-left"), onclick: function () { app().go("home"); } }),
        h("div", { style: "display:flex;align-items:center;gap:9px" , html: UI.coinBadge(token, 26) + '<b style="font-size:16px;letter-spacing:-.02em">' + esc(token.name) + "</b>" }),
        h("div", { class: "spacer" }),
        h("button", { class: "iconbtn", "aria-label": "Настройки", html: icon("settings"), onclick: function () { app().go("settings"); } })
      ]),
      scroll
    ]);
    paint();
    screen.__tick = function () { if (!hovering) paint(); };
    return screen;
  }

  function kv(key, value) {
    return h("div", { class: "kv" }, [
      h("span", { class: "kv__k", text: key }),
      h("span", { class: "kv__v num", text: value })
    ]);
  }

  /* ============================================================
     amount entry
     ============================================================ */

  /** Digits-and-one-dot model shared by the buy, sell and send sheets. */
  function amountModel(onChange) {
    var text = "0";
    var api = {
      get: function () { return text; },
      value: function () { return parseFloat(text.replace(",", ".")) || 0; },
      set: function (v) {
        text = typeof v === "string" ? v : String(v);
        if (!text) text = "0";
        onChange();
      },
      push: function (ch) {
        if (ch === ",") {
          if (text.indexOf(",") === -1) text += ",";
        } else if (text === "0") text = ch;
        else if (text.replace(/[^0-9]/g, "").length < 12) text += ch;
        onChange();
      },
      back: function () {
        text = text.length > 1 ? text.slice(0, -1) : "0";
        onChange();
      },
      clear: function () { text = "0"; onChange(); }
    };
    return api;
  }

  function keypad(model) {
    var pad = h("div", { class: "keypad" });
    ["1", "2", "3", "4", "5", "6", "7", "8", "9", ",", "0"].forEach(function (key) {
      pad.appendChild(h("button", { class: "key", text: key, onclick: function () { model.push(key); } }));
    });
    pad.appendChild(h("button", { class: "key", "aria-label": "Стереть", html: icon("backspace"), onclick: function () { model.back(); } }));
    return pad;
  }

  /** Physical keyboards should work too. */
  function bindKeys(node, model) {
    var handler = function (e) {
      var tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;   // the address field wins
      if (e.key >= "0" && e.key <= "9") model.push(e.key);
      else if (e.key === "." || e.key === ",") model.push(",");
      else if (e.key === "Backspace") model.back();
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", handler);
    node.addEventListener("sheet-teardown", function () { document.removeEventListener("keydown", handler); });
  }

  function bigAmount(text, prefix, suffix) {
    return '<span class="amount__value num">' +
      (prefix ? '<span class="amount__cur">' + esc(prefix) + "</span>" : "") +
      "<span>" + esc(text) + "</span>" +
      (suffix ? '<span class="amount__cur">' + esc(suffix) + "</span>" : "") +
      "</span>";
  }

  function holdButton(label, onDone) {
    var button = h("button", {
      class: "btn btn--primary hold",
      html: '<span class="hold__fill"></span><span class="hold__label">' + icon("check") + "<span>" + esc(label) + "</span></span>"
    });
    UI.holdToConfirm(button, 620, function () { onDone(button); });
    return button;
  }

  /* ============================================================
     buy / sell
     ============================================================ */

  function tokenPicker(current, onPick, filter) {
    var row = h("div", { class: "picker" });
    Market.TOKENS.filter(filter || function () { return true; }).forEach(function (token) {
      row.appendChild(h("button", {
        class: "pick", "aria-pressed": String(token.id === current),
        html: UI.coinBadge(token, 26) + "<span>" + esc(token.sym) + "</span>",
        onclick: function () {
          onPick(token.id);
          UI.$$(".pick", row).forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
          this.setAttribute("aria-pressed", "true");
        }
      }));
    });
    return row;
  }

  function buySheet(tokenId) {
    var current = tokenId || "sol";
    var cur = currency();
    var rate = Market.rate(cur);
    var sign = Market.CURRENCIES[cur].sign;

    var display = h("div", { class: "amount" });
    var summary = h("div", { class: "card" });
    var error = h("div", { class: "hint hint--bad", style: "display:none" });

    var model = amountModel(function () { paint(); });

    function usdValue() { return model.value() / rate; }

    function paint() {
      var token = Market.byId(current);
      var usd = usdValue();
      var fee = usd * Store.FEES.buy;
      var units = usd > 0 ? (usd - fee) / token.price : 0;
      var card = Store.card();

      display.innerHTML = bigAmount(model.get(), null, sign) +
        '<div class="amount__sub">≈ ' + esc(Market.amount(units, current)) + " " + esc(token.sym) + "</div>";

      summary.innerHTML = "";
      summary.appendChild(kv("Курс", "1 " + token.sym + " = " + Market.money(token.price, cur)));
      summary.appendChild(kv("Комиссия сервиса", Market.money(fee, cur, { dp: 2 })));
      summary.appendChild(kv("Зачислится", Market.amount(units, current) + " " + token.sym));

      var over = usd > card.available;
      error.style.display = over ? "" : "none";
      error.textContent = "На карте доступно " + Market.money(card.available, cur, { dp: 2 });
      confirm.disabled = !(usd > 0) || over;
    }

    var confirm = holdButton("Удерживайте, чтобы купить", function () {
      try {
        var tx = Store.buy(current, usdValue());
        UI.closeSheet();
        showSuccess("Куплено", Market.amount(tx.amount, current) + " " + Market.byId(current).sym +
          " за " + Market.money(tx.usd, cur, { dp: 2 }));
      } catch (e) { UI.toast(e.message, "alert"); }
    });

    var chips = h("div", { class: "chips" });
    [25, 100, 500].forEach(function (usd) {
      chips.appendChild(h("button", {
        class: "chip", text: Market.money(usd, cur, { dp: 0 }),
        onclick: function () { model.set(String(Math.round(usd * rate)).replace(".", ",")); }
      }));
    });
    chips.appendChild(h("button", {
      class: "chip", text: "Макс",
      onclick: function () { model.set(String(Math.floor(Store.card().available * rate)).replace(".", ",")); }
    }));

    var body = [
      h("div", { class: "card", style: "display:flex;align-items:center;gap:11px;padding:11px 13px" }, [
        h("span", { class: "opt__ico", html: icon("card") }),
        h("span", {}, [
          h("div", { style: "font-weight:620;font-size:14px", text: "Карта •• " + Store.card().last4 }),
          h("div", { class: "muted", style: "font-size:12.5px", text: "Доступно " + Market.money(Store.card().available, cur, { dp: 2 }) })
        ])
      ]),
      tokenPicker(current, function (id) { current = id; paint(); }),
      display, chips, keypad(model), error, summary
    ];

    var sheet = UI.openSheet("Купить", body, [confirm]);
    bindKeys(sheet, model);
    paint();
  }

  function sellSheet(tokenId) {
    var owned = Market.TOKENS.filter(function (t) { return Store.balanceOf(t.id) > 0; });
    if (!owned.length) { UI.toast("Продавать пока нечего", "info"); return; }
    var current = tokenId && Store.balanceOf(tokenId) > 0 ? tokenId : owned[0].id;
    var cur = currency();

    var display = h("div", { class: "amount" });
    var summary = h("div", { class: "card" });
    var error = h("div", { class: "hint hint--bad", style: "display:none" });
    var model = amountModel(function () { paint(); });

    function paint() {
      var token = Market.byId(current);
      var units = model.value();
      var gross = units * token.price;
      var fee = gross * Store.FEES.sell;
      var balance = Store.balanceOf(current);

      display.innerHTML = bigAmount(model.get(), null, token.sym) +
        '<div class="amount__sub">≈ ' + esc(Market.money(gross, cur, { dp: 2 })) + "</div>";

      summary.innerHTML = "";
      summary.appendChild(kv("В кошельке", Market.amount(balance, current) + " " + token.sym));
      summary.appendChild(kv("Курс", "1 " + token.sym + " = " + Market.money(token.price, cur)));
      summary.appendChild(kv("Комиссия сервиса", Market.money(fee, cur, { dp: 2 })));
      summary.appendChild(kv("Придёт на карту", Market.money(gross - fee, cur, { dp: 2 })));

      var over = units > balance;
      error.style.display = over ? "" : "none";
      error.textContent = "Больше, чем есть: " + Market.amount(balance, current) + " " + token.sym;
      confirm.disabled = !(units > 0) || over;
    }

    var confirm = holdButton("Удерживайте, чтобы продать", function () {
      try {
        var tx = Store.sell(current, model.value());
        UI.closeSheet();
        showSuccess("Продано", Market.money(tx.usd - tx.fee, cur, { dp: 2 }) + " на карту •• " + Store.card().last4);
      } catch (e) { UI.toast(e.message, "alert"); }
    });

    var chips = h("div", { class: "chips" });
    [[25, "25 %"], [50, "50 %"], [75, "75 %"], [100, "Всё"]].forEach(function (pair) {
      chips.appendChild(h("button", {
        class: "chip", text: pair[1],
        onclick: function () {
          var part = Store.balanceOf(current) * pair[0] / 100;
          model.set(part.toFixed(Market.byId(current).dp + 2).replace(/0+$/, "").replace(/[.,]$/, "").replace(".", ","));
        }
      }));
    });

    var body = [
      tokenPicker(current, function (id) { current = id; model.clear(); paint(); },
        function (t) { return Store.balanceOf(t.id) > 0; }),
      display, chips, keypad(model), error, summary
    ];
    var sheet = UI.openSheet("Продать", body, [confirm]);
    bindKeys(sheet, model);
    paint();
  }

  /* ============================================================
     send / receive / swap
     ============================================================ */

  function sendSheet(tokenId) {
    var current = tokenId || "sol";
    var cur = currency();
    var address = h("input", { class: "input input--mono", placeholder: "Адрес получателя", spellcheck: "false" });
    var display = h("div", { class: "amount" });
    var summary = h("div", { class: "card" });
    var error = h("div", { class: "hint hint--bad", style: "display:none" });
    var model = amountModel(function () { paint(); });
    address.addEventListener("input", paint);

    function paint() {
      var token = Market.byId(current);
      var units = model.value();
      var fee = Store.networkFee(current);
      var balance = Store.balanceOf(current);

      display.innerHTML = bigAmount(model.get(), null, token.sym) +
        '<div class="amount__sub">≈ ' + esc(Market.money(units * token.price, cur, { dp: 2 })) + "</div>";

      summary.innerHTML = "";
      summary.appendChild(kv("Сеть", token.chain));
      summary.appendChild(kv("Комиссия сети", Market.amount(fee, current) + " " + token.sym));
      summary.appendChild(kv("Итого спишется", Market.amount(units + fee, current) + " " + token.sym));
      summary.appendChild(kv("Остаток", Market.amount(Math.max(0, balance - units - fee), current) + " " + token.sym));

      var badAddress = address.value && !Store.addressLooksValid(address.value);
      address.className = "input input--mono" + (badAddress ? " input--bad" : "");
      var over = units + fee > balance;
      error.style.display = (over || badAddress) ? "" : "none";
      error.textContent = badAddress ? "Адрес не похож на base58-адрес" : "Не хватает на сумму с комиссией";
      confirm.disabled = !(units > 0) || over || !Store.addressLooksValid(address.value);
    }

    var confirm = holdButton("Удерживайте, чтобы отправить", function () {
      try {
        var tx = Store.send(current, model.value(), address.value.trim());
        UI.closeSheet();
        showSuccess("Отправлено", Market.amount(tx.amount, current) + " " + Market.byId(current).sym +
          " → " + UI.shortAddress(tx.address, 4, 4));
      } catch (e) { UI.toast(e.message, "alert"); }
    });

    var chips = h("div", { class: "chips" });
    [[25, "25 %"], [50, "50 %"], [100, "Макс"]].forEach(function (pair) {
      chips.appendChild(h("button", {
        class: "chip", text: pair[1],
        onclick: function () {
          var room = Math.max(0, Store.balanceOf(current) - (pair[0] === 100 ? Store.networkFee(current) : 0));
          var part = room * pair[0] / 100;
          model.set(part.toFixed(Market.byId(current).dp + 2).replace(/0+$/, "").replace(/[.,]$/, "").replace(".", ","));
        }
      }));
    });

    var body = [
      tokenPicker(current, function (id) { current = id; model.clear(); paint(); },
        function (t) { return Store.balanceOf(t.id) > 0; }),
      h("label", { class: "field" }, [h("span", { class: "field__label", text: "Кому" }), address]),
      h("button", {
        class: "btn btn--ghost btn--sm", html: icon("copy") + "<span>Вставить из буфера</span>",
        onclick: function () {
          if (navigator.clipboard && navigator.clipboard.readText) {
            navigator.clipboard.readText().then(function (t) { address.value = t.trim(); paint(); },
              function () { UI.toast("Буфер недоступен", "alert"); });
          } else UI.toast("Буфер недоступен", "alert");
        }
      }),
      display, chips, keypad(model), error, summary
    ];
    var sheet = UI.openSheet("Отправить", body, [confirm]);
    bindKeys(sheet, model);
    paint();
  }

  function receiveSheet() {
    var acc = Store.account();
    var qr = global.QR.svg(acc.address, 208, { dark: "#05070e", light: "#ffffff", quiet: 2, radius: 1 });
    UI.openSheet("Получить", [
      h("div", { class: "center", style: "padding:6px 0 12px" }, [
        h("div", { style: "display:inline-block;padding:12px;border-radius:20px;background:#fff", html: qr })
      ]),
      h("div", { class: "card center" }, [
        h("div", { class: "muted", style: "font-size:12.5px;margin-bottom:6px", text: "Адрес счёта «" + acc.name + "»" }),
        h("div", { class: "mono", style: "font-size:13px;word-break:break-all;line-height:1.5", text: acc.address })
      ]),
      h("div", { style: "height:10px" }),
      h("div", { class: "warn warn--info" }, [
        h("span", { html: icon("info") }),
        h("span", { text: "Адрес демонстрационный: за ним нет реальной сети, и отправленные на него настоящие средства пропадут." })
      ])
    ], [
      h("button", {
        class: "btn btn--primary", html: icon("copy") + "<span>Скопировать адрес</span>",
        onclick: function () { UI.copy(acc.address, "Адрес скопирован"); }
      })
    ]);
  }

  function swapSheet(fromId) {
    var from = fromId || "usdc";
    var to = from === "cob" ? "sol" : "cob";
    var cur = currency();
    var model = amountModel(function () { paint(); });

    var fromCard = h("div", { class: "card" });
    var toCard = h("div", { class: "card" });
    var summary = h("div", { class: "card" });
    var error = h("div", { class: "hint hint--bad", style: "display:none" });

    function paint() {
      var quote = Store.swapQuote(from, to, model.value());
      var tokenFrom = Market.byId(from), tokenTo = Market.byId(to);
      var balance = Store.balanceOf(from);

      fromCard.innerHTML =
        '<div class="rowsplit"><span class="muted" style="font-size:12.5px">Отдаёте</span>' +
        '<span class="muted num" style="font-size:12.5px">Баланс ' + esc(Market.amount(balance, from)) + "</span></div>" +
        '<div class="rowsplit" style="margin-top:8px">' + UI.coinBadge(tokenFrom, 34) +
        '<span class="num" style="font-size:26px;font-weight:700;letter-spacing:-.03em">' + esc(model.get()) + "</span></div>";

      toCard.innerHTML =
        '<div class="rowsplit"><span class="muted" style="font-size:12.5px">Получаете</span>' +
        '<span class="muted num" style="font-size:12.5px">' + esc(quote ? Market.money(quote.out * tokenTo.price, cur, { dp: 2 }) : "—") + "</span></div>" +
        '<div class="rowsplit" style="margin-top:8px">' + UI.coinBadge(tokenTo, 34) +
        '<span class="num" style="font-size:26px;font-weight:700;letter-spacing:-.03em;color:var(--soft)">' +
        esc(quote ? Market.amount(quote.out, to) : "0") + "</span></div>";

      summary.innerHTML = "";
      if (quote) {
        summary.appendChild(kv("Курс", "1 " + tokenFrom.sym + " = " + Market.amount(quote.rate, to) + " " + tokenTo.sym));
        summary.appendChild(kv("Комиссия обмена", Market.money(quote.fee, cur, { dp: 2 })));
        summary.appendChild(kv("Влияние на цену", quote.impact.toFixed(2).replace(".", ",") + " %"));
      }
      var over = model.value() > balance;
      error.style.display = over ? "" : "none";
      error.textContent = "Больше, чем есть на балансе";
      confirm.disabled = !(model.value() > 0) || over;
    }

    var confirm = holdButton("Удерживайте, чтобы обменять", function () {
      try {
        var tx = Store.swap(from, to, model.value());
        UI.closeSheet();
        showSuccess("Обменяно", Market.amount(tx.amount, from) + " " + Market.byId(from).sym + " → " +
          Market.amount(tx.toAmount, to) + " " + Market.byId(to).sym);
      } catch (e) { UI.toast(e.message, "alert"); }
    });

    var flip = h("button", {
      class: "swapbtn", "aria-label": "Поменять местами", html: icon("swap"),
      onclick: function () {
        var t = from; from = to; to = t;
        this.classList.toggle("swapbtn--spin");
        model.clear();
        renderPickers();
        paint();
      }
    });

    var pickers = h("div");
    function renderPickers() {
      pickers.innerHTML = "";
      pickers.appendChild(h("div", { class: "h", text: "Отдаёте" }));
      pickers.appendChild(tokenPicker(from, function (id) { if (id === to) to = from; from = id; renderPickers(); model.clear(); paint(); },
        function (t) { return Store.balanceOf(t.id) > 0; }));
      pickers.appendChild(h("div", { class: "h", text: "Получаете" }));
      pickers.appendChild(tokenPicker(to, function (id) { if (id === from) from = to; to = id; renderPickers(); paint(); }));
    }
    renderPickers();

    var body = [
      fromCard,
      h("div", { class: "swapline" }, [flip]),
      toCard,
      pickers,
      keypad(model),
      error,
      summary
    ];
    var sheet = UI.openSheet("Обмен", body, [confirm]);
    bindKeys(sheet, model);
    paint();
  }

  /* ============================================================
     activity, collectibles, accounts
     ============================================================ */

  var TX_TEXT = {
    buy:  { title: "Покупка",  icon: "arrow-down",     tone: "in" },
    sell: { title: "Продажа",  icon: "arrow-up",       tone: "out" },
    in:   { title: "Получено", icon: "arrow-down-left", tone: "in" },
    out:  { title: "Отправлено", icon: "arrow-up-right", tone: "out" },
    swap: { title: "Обмен",    icon: "swap",           tone: "" }
  };

  function activityList() {
    var txs = Store.txs();
    if (!txs.length) {
      return h("div", { class: "empty", html: icon("clock") + "<div>Операций пока нет</div>" });
    }
    var list = h("div", { class: "list" });
    var lastDay = "";
    txs.forEach(function (tx) {
      var day = UI.dayLabel(tx.at);
      if (day !== lastDay) {
        lastDay = day;
        list.appendChild(h("div", { class: "h", text: day }));
      }
      var meta = TX_TEXT[tx.kind];
      var token = Market.byId(tx.tokenId);
      var right = tx.kind === "swap"
        ? Market.amount(tx.toAmount, tx.toTokenId) + " " + Market.byId(tx.toTokenId).sym
        : (meta.tone === "in" ? "+" : "−") + Market.amount(tx.amount, tx.tokenId) + " " + token.sym;
      var sub = tx.kind === "swap" ? token.sym + " → " + Market.byId(tx.toTokenId).sym
        : tx.address ? UI.shortAddress(tx.address, 4, 4)
        : token.name;

      list.appendChild(h("button", {
        class: "tx", onclick: function () { txSheet(tx); },
        html:
          '<span class="tx__ico' + (meta.tone ? " tx__ico--" + meta.tone : "") + '">' + icon(meta.icon) + "</span>" +
          '<span><span class="tx__t">' + esc(meta.title) + '</span><br><span class="tx__s mono">' + esc(sub) + " · " + esc(UI.timeLabel(tx.at)) + "</span></span>" +
          '<span class="tx__a num' + (meta.tone === "in" ? " tx__a--in" : "") + '">' + esc(right) + "</span>"
      }));
    });
    return list;
  }

  function txSheet(tx) {
    var meta = TX_TEXT[tx.kind];
    var token = Market.byId(tx.tokenId);
    var cur = currency();
    var rows = [
      kv("Тип", meta.title),
      kv("Токен", token.name + " (" + token.sym + ")"),
      kv("Количество", Market.amount(tx.amount, tx.tokenId) + " " + token.sym)
    ];
    if (tx.kind === "swap") rows.push(kv("Получено", Market.amount(tx.toAmount, tx.toTokenId) + " " + Market.byId(tx.toTokenId).sym));
    if (tx.address) rows.push(kv("Адрес", UI.shortAddress(tx.address, 6, 6)));
    rows.push(kv("Сумма", Market.money(tx.usd, cur, { dp: 2 })));
    rows.push(kv("Комиссия", Market.money(tx.fee, cur, { dp: 2 })));
    rows.push(kv("Когда", UI.dayLabel(tx.at) + ", " + UI.timeLabel(tx.at)));
    rows.push(kv("Статус", "Подтверждено"));

    UI.openSheet(meta.title, [
      h("div", { class: "card" }, rows),
      h("div", { class: "h", text: "Подпись" }),
      h("div", { class: "card mono", style: "font-size:12px;word-break:break-all;line-height:1.5", text: tx.id })
    ], [
      h("button", {
        class: "btn btn--ghost", html: icon("copy") + "<span>Скопировать подпись</span>",
        onclick: function () { UI.copy(tx.id, "Подпись скопирована"); }
      })
    ]);
  }

  function collectibles() {
    var acc = Store.account();
    var rnd = Vault.seedRandom("nfts/" + acc.address);
    var count = 4 + Math.floor(rnd() * 3);
    var grid = h("div", { class: "nftgrid" });
    var NAMES = ["Синий шум", "Грань", "Полярность", "Тихий сигнал", "Кобальт 001", "Ночная смена"];
    for (var i = 0; i < count; i++) {
      var seed = acc.address + "/" + i;
      var price = (0.4 + rnd() * 6).toFixed(2).replace(".", ",");
      grid.appendChild(h("button", {
        class: "nft",
        html: UI.nftArt(seed) +
          '<span class="nft__meta"><span class="nft__t">' + esc(NAMES[i % NAMES.length]) + "</span><br>" +
          '<span class="nft__s num">' + price + " SOL</span></span>",
        onclick: (function (name, seedValue, priceText) {
          return function () {
            UI.openSheet(name, [
              h("div", { style: "border-radius:18px;overflow:hidden", html: UI.nftArt(seedValue) }),
              h("div", { class: "h", text: "Свойства" }),
              h("div", { class: "card" }, [
                kv("Коллекция", "Cobalt Genesis"),
                kv("Оценка", priceText + " SOL"),
                kv("Сеть", "Solana"),
                kv("Стандарт", "Демонстрационный")
              ])
            ], [h("button", { class: "btn btn--ghost", text: "Закрыть", onclick: function () { UI.closeSheet(); } })]);
          };
        })(NAMES[i % NAMES.length], seed, price)
      }));
    }
    return grid;
  }

  function accountsSheet() {
    var list = h("div", { class: "list" });
    Store.accounts().forEach(function (acc, i) {
      var value = 0;
      Market.TOKENS.forEach(function (t) { value += (acc.balances[t.id] || 0) * t.price; });
      list.appendChild(h("button", {
        class: "row row--wide", onclick: function () { Store.selectAccount(i); UI.closeSheet(); app().go("home"); },
        html:
          '<span class="avatar" style="' + UI.avatarStyle(acc.address) + '">' + esc(acc.name.slice(0, 1).toUpperCase()) + "</span>" +
          '<span><span class="row__name">' + esc(acc.name) + '</span><br><span class="row__sub mono">' +
          esc(UI.shortAddress(acc.address, 5, 5)) + "</span></span>" +
          '<span class="row__right"><span class="row__val num">' + esc(money(value, { dp: 2 })) + "</span>" +
          (i === Store.state().active ? '<br><span class="row__delta">текущий</span>' : "") + "</span>"
      }));
    });

    UI.openSheet("Счета", [
      list,
      h("div", { class: "hint", text: "Адрес каждого счёта выводится из вашей секретной фразы." })
    ], [
      h("button", {
        class: "btn btn--ghost", html: icon("plus") + "<span>Добавить счёт</span>",
        onclick: function () { Store.addAccount(); UI.closeSheet(); app().go("home"); UI.toast("Счёт добавлен", "users"); }
      }),
      h("button", {
        class: "btn btn--ghost", html: icon("copy") + "<span>Скопировать адрес</span>",
        onclick: function () { UI.copy(Store.account().address, "Адрес скопирован"); }
      })
    ]);
  }

  /* ============================================================
     settings
     ============================================================ */

  function settingsScreen() {
    var scroll = h("div", { class: "scroll" });

    scroll.appendChild(h("div", { class: "h", text: "Отображение" }));
    var seg = h("div", { class: "seg" });
    ["USD", "RUB", "EUR"].forEach(function (code) {
      seg.appendChild(h("button", {
        class: "segbtn", "aria-pressed": String(currency() === code),
        text: Market.CURRENCIES[code].sign + " " + code,
        onclick: function () { Store.setSetting("currency", code); app().refresh(); }
      }));
    });
    scroll.appendChild(seg);

    scroll.appendChild(h("div", { style: "height:8px" }));
    scroll.appendChild(toggleOpt("eye-off", "Скрывать суммы", "Баланс показывается как ••••••", "hidden"));

    scroll.appendChild(h("div", { class: "h", text: "Безопасность" }));
    scroll.appendChild(linkOpt("key", "Показать секретную фразу", "Потребуется пароль", revealSheet));
    scroll.appendChild(linkOpt("lock", "Заблокировать сейчас", "Потребуется пароль для входа", function () {
      Store.lock(); app().go("lock");
    }));
    scroll.appendChild(linkOpt("users", "Счета", Store.accounts().length + " шт.", accountsSheet));

    scroll.appendChild(h("div", { class: "h", text: "Сеть" }));
    scroll.appendChild(h("div", { class: "card" }, [
      kv("Сеть", "Cobalt Mainnet (симуляция)"),
      kv("RPC", "нет — данные локальные"),
      kv("Версия", "1.0")
    ]));

    scroll.appendChild(h("div", { class: "h", text: "Опасная зона" }));
    scroll.appendChild(h("div", { style: "padding-top:4px" }, [
      h("button", { class: "btn btn--danger", html: icon("trash") + "<span>Сбросить кошелёк</span>", onclick: confirmReset })
    ]));

    scroll.appendChild(h("div", { class: "h", text: "О приложении" }));
    scroll.appendChild(h("div", { class: "card muted", style: "font-size:13px;line-height:1.55", text:
      BRAND + " — учебный кошелёк. Нет сети, нет биржи, нет реальных средств: котировки генерируются на месте, а всё состояние лежит в localStorage этого браузера." }));

    return h("div", { class: "screen screen--enter" }, [
      h("div", { class: "topbar" }, [
        h("button", { class: "iconbtn", "aria-label": "Назад", html: icon("arrow-left"), onclick: function () { app().go("home"); } }),
        h("b", { style: "font-size:17px;letter-spacing:-.02em", text: "Настройки" }),
        h("div", { class: "spacer" }),
        h("span", { class: "pill", html: '<span class="pill__dot"></span>демо' })
      ]),
      scroll
    ]);
  }

  function toggleOpt(iconName, title, sub, key) {
    var on = !!Store.settings()[key];
    var sw = h("button", { class: "switch", role: "switch", "aria-checked": String(on), "aria-label": title });
    var node = h("button", { class: "opt", onclick: function () {
      on = !on;
      Store.setSetting(key, on);
      sw.setAttribute("aria-checked", String(on));
    } }, [
      h("span", { class: "opt__ico", html: icon(iconName) }),
      h("span", { style: "flex:1;text-align:left" }, [
        h("div", { class: "opt__t", text: title }),
        h("div", { class: "opt__s", text: sub })
      ]),
      sw
    ]);
    return node;
  }

  function linkOpt(iconName, title, sub, onclick) {
    return h("button", { class: "opt", onclick: onclick }, [
      h("span", { class: "opt__ico", html: icon(iconName) }),
      h("span", { style: "flex:1;text-align:left" }, [
        h("div", { class: "opt__t", text: title }),
        h("div", { class: "opt__s", text: sub })
      ]),
      h("span", { style: "color:var(--dim);display:flex", html: icon("chevron-right") })
    ]);
  }

  function revealSheet() {
    var pass = h("input", { class: "input", type: "password", placeholder: "Пароль", autocomplete: "current-password" });
    var hint = h("div", { class: "hint" });
    var body = h("div", {}, [
      h("div", { class: "warn" }, [
        h("span", { html: icon("alert") }),
        h("span", { text: "Убедитесь, что экран никто не видит и не записывает." })
      ]),
      h("label", { class: "field" }, [h("span", { class: "field__label", text: "Подтвердите пароль" }), pass]),
      hint
    ]);

    var show = h("button", { class: "btn btn--primary", html: icon("eye") + "<span>Показать</span>", onclick: function () {
      var stored = Store.state();
      if (!Vault.passwordMatches(pass.value, stored.auth.salt, stored.auth.hash)) {
        hint.className = "hint hint--bad";
        hint.textContent = "Неверный пароль";
        return;
      }
      var grid = h("div", { class: "seedgrid" });
      Store.recoveryPhrase().split(" ").forEach(function (word, i) {
        grid.appendChild(h("div", { class: "seedword" }, [
          h("span", { class: "seedword__i", text: String(i + 1) }),
          h("span", { text: word })
        ]));
      });
      UI.openSheet("Секретная фраза", [grid], [
        h("button", {
          class: "btn btn--ghost", html: icon("copy") + "<span>Скопировать</span>",
          onclick: function () { UI.copy(Store.recoveryPhrase(), "Фраза скопирована"); }
        }),
        h("button", { class: "btn btn--primary", text: "Скрыть", onclick: function () { UI.closeSheet(); } })
      ]);
    } });

    UI.openSheet("Секретная фраза", [body], [show]);
    setTimeout(function () { pass.focus(); }, 80);
  }

  /* ============================================================
     success overlay
     ============================================================ */

  function showSuccess(title, sub) {
    var node = h("div", { class: "done" }, [
      h("div", { class: "done__ring", html:
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path class="tick" d="M20 6 9 17l-5-5"/></svg>' }),
      h("div", { class: "done__t", text: title }),
      h("div", { class: "done__s", text: sub }),
      h("div", { style: "position:absolute;left:16px;right:16px;bottom:22px" }, [
        h("button", { class: "btn btn--primary", text: "Готово", onclick: function () { close(); } })
      ])
    ]);
    function close() {
      node.remove();
      clearTimeout(timer);
      app().refresh();
    }
    var timer = setTimeout(close, 3200);
    UI.$("#device").appendChild(node);
  }

  global.Screens = {
    BRAND: BRAND, MARK: MARK,
    welcome: welcome, createFlow: createFlow, importFlow: importFlow, lockScreen: lockScreen,
    home: home, tokenScreen: tokenScreen, settingsScreen: settingsScreen,
    buySheet: buySheet, sellSheet: sellSheet, sendSheet: sendSheet,
    receiveSheet: receiveSheet, swapSheet: swapSheet, accountsSheet: accountsSheet
  };
})(typeof window !== "undefined" ? window : globalThis);
