/**
 * Wallet state: accounts, balances, history, and the operations that move
 * money between them. Everything lives in localStorage under one key, and
 * nothing leaves the browser.
 *
 * The linked card is what makes "купить" and "продать" symmetrical: buying
 * draws from the card, selling pays back into it, so neither button mints
 * value out of nowhere.
 *
 * Staking rewards are computed from elapsed time rather than incremented on
 * a timer, so they keep accruing across a reload and cannot drift. Demo time
 * runs fast — a second of watching is an hour of staking — otherwise nothing
 * visible would ever happen at 7 % a year.
 */
(function (global) {
  "use strict";

  var KEY = "meridian.wallet.v1";
  var LEGACY_KEY = "cobalt.wallet.v1";   // the wallet shipped under its old name
  var Market = global.Market;
  var Vault = global.Vault;

  var FEES = { buy: 0.012, sell: 0.012, swap: 0.0025 };
  var NETWORK_FEE_USD = 0.12;
  var HOURS_PER_SECOND = 1;        // demo clock: 1 s watched = 1 h staked
  var MAX_NOTES = 50;

  var state = null;      // persisted
  var phrase = null;     // in memory only, while unlocked

  function read() {
    try {
      if (!global.localStorage) return null;
      var raw = global.localStorage.getItem(KEY) || global.localStorage.getItem(LEGACY_KEY);
      return raw ? migrate(JSON.parse(raw)) : null;
    } catch (e) { return null; }
  }

  function save() {
    try {
      if (global.localStorage) global.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* private mode: the session still works, it just won't survive */ }
  }

  /**
   * Fills in whatever a stored wallet predates. Wallets written before the
   * rename keep deriving addresses from their original namespace, and their
   * house-token balances are moved onto the new ticker.
   */
  function migrate(stored) {
    if (!stored || !stored.accounts) return stored;
    stored.settings = stored.settings || { currency: "USD", hidden: false, network: "mainnet" };
    stored.card = stored.card || { last4: "4417", available: 5000 };
    stored.contacts = stored.contacts || [];
    stored.alerts = stored.alerts || [];
    stored.notes = stored.notes || [];
    stored.mail = stored.mail || defaultMail();
    stored.derive = stored.derive || "cobalt";
    stored.accounts.forEach(function (acc) {
      acc.balances = acc.balances || {};
      acc.stakes = acc.stakes || [];
      if (acc.balances.cob != null) {                 // COB became MRD
        acc.balances.mrd = (acc.balances.mrd || 0) + acc.balances.cob;
        delete acc.balances.cob;
      }
    });
    (stored.txs || []).forEach(function (tx) {
      if (tx.tokenId === "cob") tx.tokenId = "mrd";
      if (tx.toTokenId === "cob") tx.toTokenId = "mrd";
    });
    return stored;
  }

  function exists() { return !!read(); }
  function isUnlocked() { return !!state; }

  function signature() { return Vault.base58(Vault.randomBytes(32)); }

  function account() { return state.accounts[state.active]; }

  function balanceOf(tokenId) {
    var b = account().balances[tokenId];
    return b ? b : 0;
  }

  function setBalance(tokenId, value) {
    account().balances[tokenId] = Math.max(0, value);
  }

  /** Locked in stakes — owned, but not spendable until unstaked. */
  function stakedOf(tokenId) {
    return (account().stakes || []).reduce(function (sum, st) {
      return st.tokenId === tokenId ? sum + st.amount : sum;
    }, 0);
  }

  /** Everything owned of a token: what can be spent plus what is staked. */
  function holdingOf(tokenId) { return balanceOf(tokenId) + stakedOf(tokenId); }

  /** Portfolio value in USD at current prices, staked positions included. */
  function total() {
    return Market.TOKENS.reduce(function (sum, t) {
      return sum + holdingOf(t.id) * t.price;
    }, 0);
  }

  function stakedTotal() {
    return Market.TOKENS.reduce(function (sum, t) { return sum + stakedOf(t.id) * t.price; }, 0);
  }

  /** Weighted 24h move of the portfolio, so the header figure means something. */
  function totalChange() {
    var now = total();
    if (now <= 0) return 0;
    var before = Market.TOKENS.reduce(function (sum, t) {
      var s = Market.series(t.id, "1d");
      return sum + holdingOf(t.id) * s[0];
    }, 0);
    return before > 0 ? ((now - before) / before) * 100 : 0;
  }

  /**
   * Portfolio value across a timeframe: today's holdings valued at each
   * historical price. It answers "what would this basket have been worth",
   * which is the only honest reading without a ledger of past balances.
   */
  function totalSeries(frameId) {
    var out = null;
    Market.TOKENS.forEach(function (t) {
      var units = holdingOf(t.id);
      if (!units) return;
      var s = Market.series(t.id, frameId);
      if (!out) out = s.map(function (v) { return v * units; });
      else out = out.map(function (v, i) { return v + s[i] * units; });
    });
    return out || Market.series("usdc", frameId).map(function () { return 0; });
  }

  /* ---------- creation, locking ---------- */

  /* A new wallet starts at zero: no invented money, no invented history.
     Everything below arrives through «Пополнить», the way the holder
     decides. `demoPortfolio` exists for anyone who wants the old filled
     wallet to look around in, and it is opt-in from settings. */

  function demoPortfolio() {
    return {
      balances: { mrd: 1180, btc: 0.0412, eth: 1.24, sol: 12.482, ton: 320, usdc: 1840.5, doge: 12500 },
      card: 5000,
      stakes: [{
        id: signature(), tokenId: "sol", amount: 6, validator: "polaris",
        apy: Market.apyFor("sol", "polaris"), since: Date.now() - 1080 * 1000, carried: 0
      }],
      contacts: [
        { id: signature(), name: "Аня", address: Vault.base58(Vault.digest("meridian/demo/anya")), note: "обмен на карту" },
        { id: signature(), name: "Холодный кошелёк", address: Vault.base58(Vault.digest("meridian/demo/cold")), note: "долгое хранение" }
      ]
    };
  }

  /** Fills an empty wallet with something to look at, or empties it again. */
  function loadDemoPortfolio() {
    var demo = demoPortfolio();
    account().balances = demo.balances;
    account().stakes = demo.stakes;
    state.card.available = demo.card;
    state.contacts = demo.contacts;
    notify("topup", "Демо-портфель начислен", "Это ненастоящие средства — только для осмотра");
    save();
  }

  function zeroOut() {
    account().balances = {};
    account().stakes = [];
    state.card.available = 0;
    save();
  }

  function create(password, recovery) {
    var salt = Vault.newSalt();
    state = {
      v: 1,
      auth: { salt: salt, hash: Vault.passwordHash(password, salt) },
      sealed: Vault.sealPhrase(recovery, password, salt),
      derive: "meridian",
      accounts: [{
        name: "Основной",
        index: 0,
        address: Vault.addressFor(recovery, 0, "meridian"),
        balances: {},
        stakes: []
      }],
      active: 0,
      settings: { currency: "USD", hidden: false, network: "mainnet" },
      txs: [],
      card: { last4: "4417", available: 0 },
      contacts: [],
      alerts: [],
      notes: [],
      mail: defaultMail()
    };
    phrase = recovery;
    save();
    return state;
  }

  function unlock(password) {
    var stored = read();
    if (!stored) return false;
    if (!Vault.passwordMatches(password, stored.auth.salt, stored.auth.hash)) return false;
    state = stored;
    phrase = Vault.openPhrase(stored.sealed, password, stored.auth.salt);
    return true;
  }

  function lock() { state = null; phrase = null; }

  function reset() {
    lock();
    try { if (global.localStorage) global.localStorage.removeItem(KEY); } catch (e) {}
  }

  /** Only available while unlocked — the phrase is never read from storage. */
  function recoveryPhrase() { return phrase; }

  function addAccount(name) {
    var index = state.accounts.length;
    state.accounts.push({
      name: name || "Счёт " + (index + 1),
      index: index,
      address: Vault.addressFor(phrase, index, state.derive),
      balances: {},
      stakes: []
    });
    state.active = index;
    save();
  }

  function selectAccount(i) {
    state.active = Math.max(0, Math.min(i, state.accounts.length - 1));
    save();
  }

  /* ---------- operations ---------- */

  /* ---------- letters ---------- */

  var MAIL_GROUPS = {
    trade:   { label: "Покупка и продажа", hint: "когда купили или продали монету",     kinds: ["buy", "sell"] },
    move:    { label: "Переводы",          hint: "отправка, входящие и вывод на биржу", kinds: ["out", "in", "exchange"] },
    staking: { label: "Стейкинг",          hint: "ставки, вывод и забранные награды",   kinds: ["stake", "unstake", "reward"] },
    alerts:  { label: "Оповещения о цене", hint: "когда цена пересекла вашу отметку",   kinds: ["alert"] },
    card:    { label: "Пополнение карты",  hint: "когда положили денег на карту",       kinds: ["topup"] }
  };

  var MAX_OUTBOX = 60;

  function defaultMail() {
    return {
      address: "",
      on: { trade: true, move: true, staking: false, alerts: true, card: false },
      outbox: []
    };
  }

  function mail() { return state.mail; }

  /** Deliberately plain: an address is a name, an at-sign and a dotted host. */
  function emailLooksValid(address) {
    return /^[^\s@]{1,64}@[^\s@.]+(\.[^\s@.]+)+$/.test(String(address || "").trim());
  }

  function setMailAddress(address) {
    var value = String(address || "").trim();
    if (value && !emailLooksValid(value)) throw new Error("адрес почты выглядит неверно");
    state.mail.address = value;
    save();
  }

  function setMailGroup(group, enabled) {
    if (!MAIL_GROUPS[group]) throw new Error("нет такой группы событий");
    state.mail.on[group] = !!enabled;
    save();
  }

  function groupOf(kind) {
    var found = null;
    Object.keys(MAIL_GROUPS).forEach(function (key) {
      if (MAIL_GROUPS[key].kinds.indexOf(kind) !== -1) found = key;
    });
    return found;
  }

  /** The letter one event becomes. Composed here so it can be read back. */
  function composeLetter(kind, title, detail) {
    var acc = account();
    var when = Date.now();
    return {
      id: signature(),
      kind: kind,
      title: title,
      detail: detail || "",
      account: acc.name,
      address: acc.address,
      balance: total(),
      currency: state.settings.currency,
      at: when,
      sent: false
    };
  }

  function letterTime(at) { return new Date(at).toLocaleString("ru-RU"); }

  /** The letter as text: what lands in the mail client. */
  function letterBody(letter) {
    return [
      "Счёт: " + letter.account + " (" + letter.address.slice(0, 6) + "…" + letter.address.slice(-4) + ")",
      "Событие: " + letter.title,
      letter.detail ? "Подробности: " + letter.detail : null,
      "Баланс после: " + Market.money(letter.balance, letter.currency, { dp: 2 }),
      "Время: " + letterTime(letter.at),
      "",
      "—",
      "Письмо сформировано кошельком Meridian на вашем устройстве."
    ].filter(function (line) { return line !== null; }).join("\n");
  }

  function letterSubject(letter) { return "Meridian · " + letter.title; }

  /** Queues a letter if this kind of event is switched on and there is an address. */
  function queueLetter(kind, title, detail) {
    var group = groupOf(kind);
    if (!group || !state.mail.address || !state.mail.on[group]) return null;
    var letter = composeLetter(kind, title, detail);
    state.mail.outbox.unshift(letter);
    if (state.mail.outbox.length > MAX_OUTBOX) state.mail.outbox.length = MAX_OUTBOX;
    return letter;
  }

  function outbox() { return state.mail.outbox; }
  function pendingLetters() { return state.mail.outbox.filter(function (l) { return !l.sent; }); }

  function markLetterSent(id) {
    state.mail.outbox.forEach(function (l) { if (l.id === id) l.sent = true; });
    save();
  }

  function markAllSent() {
    state.mail.outbox.forEach(function (l) { l.sent = true; });
    save();
  }

  function clearOutbox() {
    state.mail.outbox = [];
    save();
  }

  /** Everything unsent, folded into one letter. */
  function digest() {
    var pending = pendingLetters();
    if (!pending.length) return null;
    var body = pending.map(function (letter, i) {
      return (i + 1) + ". " + letter.title +
        (letter.detail ? "\n   " + letter.detail : "") +
        "\n   " + letterTime(letter.at);
    }).join("\n\n");
    return {
      count: pending.length,
      subject: "Meridian · сводка, событий: " + pending.length,
      body: body + "\n\nБаланс: " + Market.money(total(), state.settings.currency, { dp: 2 }) +
        "\n\n—\nПисьмо сформировано кошельком Meridian на вашем устройстве."
    };
  }

  /** A mailto: link — the one way to actually post a letter with no server. */
  function mailtoLink(subject, body) {
    return "mailto:" + encodeURIComponent(state.mail.address) +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
  }

  function record(tx) {
    tx.id = signature();
    tx.at = Date.now();
    tx.status = "ok";
    state.txs.unshift(tx);
    if (state.txs.length > 120) state.txs.length = 120;
    return tx;
  }

  /** Fiat -> token. `usd` is what leaves the card, fee included. */
  function buy(tokenId, usd) {
    var token = Market.byId(tokenId);
    if (!token) throw new Error("нет такого токена");
    if (!(usd > 0)) throw new Error("сумма должна быть больше нуля");
    if (usd > state.card.available + 1e-9) throw new Error("на карте недостаточно средств");

    var fee = usd * FEES.buy;
    var units = (usd - fee) / token.price;
    state.card.available -= usd;
    setBalance(tokenId, balanceOf(tokenId) + units);
    var tx = record({ kind: "buy", tokenId: tokenId, amount: units, usd: usd, fee: fee });
    notify("buy", "Куплено " + Market.amount(units, tokenId) + " " + token.sym,
           "Списано с карты •• " + state.card.last4);
    save();
    return tx;
  }

  /** Token -> fiat, paid back to the card. */
  function sell(tokenId, units) {
    var token = Market.byId(tokenId);
    if (!token) throw new Error("нет такого токена");
    if (!(units > 0)) throw new Error("количество должно быть больше нуля");
    if (units > balanceOf(tokenId) + 1e-12) throw new Error("недостаточно " + token.sym);

    var gross = units * token.price;
    var fee = gross * FEES.sell;
    setBalance(tokenId, balanceOf(tokenId) - units);
    state.card.available += gross - fee;
    var tx = record({ kind: "sell", tokenId: tokenId, amount: units, usd: gross, fee: fee });
    notify("sell", "Продано " + Market.amount(units, tokenId) + " " + token.sym,
           "На карту •• " + state.card.last4);
    save();
    return tx;
  }

  function networkFee(tokenId) {
    var token = Market.byId(tokenId);
    return NETWORK_FEE_USD / token.price;
  }

  function send(tokenId, units, address) {
    var token = Market.byId(tokenId);
    if (!token) throw new Error("нет такого токена");
    if (!addressLooksValid(address)) throw new Error("адрес выглядит неверно");
    if (address === account().address) throw new Error("это адрес этого же счёта");
    if (!(units > 0)) throw new Error("количество должно быть больше нуля");

    var fee = networkFee(tokenId);
    if (units + fee > balanceOf(tokenId) + 1e-12) throw new Error("не хватает на комиссию сети");

    setBalance(tokenId, balanceOf(tokenId) - units - fee);
    var tx = record({
      kind: "out", tokenId: tokenId, amount: units,
      usd: units * token.price, fee: fee * token.price, address: address
    });
    var known = contactFor(address);
    notify("out", "Отправлено " + Market.amount(units, tokenId) + " " + token.sym,
           known ? "Получатель: " + known.name : "На адрес " + address.slice(0, 6) + "…");
    save();
    return tx;
  }

  /* ---------- topping up ---------- */

  var CARD_LIMIT = 1000000;

  /** Puts money on the linked card, which is what buying draws from. */
  function topUpCard(usd) {
    if (!(usd > 0)) throw new Error("сумма должна быть больше нуля");
    if (state.card.available + usd > CARD_LIMIT) throw new Error("демо-карта не принимает больше миллиона");
    state.card.available += usd;
    var tx = record({ kind: "topup", tokenId: "usdc", amount: usd, usd: usd, fee: 0 });
    notify("topup", "Карта пополнена", Market.money(usd, state.settings.currency) +
      " · на карте " + Market.money(state.card.available, state.settings.currency));
    save();
    return tx;
  }

  /** An incoming transfer: in a real network it would arrive from outside. */
  function depositToken(tokenId, units, from) {
    var token = Market.byId(tokenId);
    if (!token) throw new Error("нет такого токена");
    if (!(units > 0)) throw new Error("количество должно быть больше нуля");
    setBalance(tokenId, balanceOf(tokenId) + units);
    var tx = record({
      kind: "in", tokenId: tokenId, amount: units, usd: units * token.price, fee: 0,
      address: from || Vault.base58(Vault.digest("meridian/demo/deposit/" + Date.now()))
    });
    notify("in", "Получено " + Market.amount(units, tokenId) + " " + token.sym, "Зачислено на счёт");
    save();
    return tx;
  }

  /* ---------- withdrawing to an exchange ---------- */

  /**
   * A withdrawal is an ordinary transfer with the two checks that actually
   * matter: the address has to belong to the network you picked, and some
   * networks reject a deposit that arrives without a memo.
   */
  function withdrawToExchange(tokenId, units, opts) {
    opts = opts || {};
    var token = Market.byId(tokenId);
    if (!token) throw new Error("нет такого токена");

    var network = Market.networksFor(tokenId).filter(function (n) { return n.id === opts.network; })[0];
    if (!network) throw new Error("выберите сеть");

    var address = String(opts.address || "").trim();
    if (!address) throw new Error("вставьте адрес пополнения с биржи");
    if (!network.pattern.test(address))
      throw new Error("адрес не похож на адрес сети «" + network.label + "»");
    if (network.memo && !String(opts.memo || "").trim())
      throw new Error("для сети «" + network.label + "» биржа требует memo");

    if (!(units > 0)) throw new Error("количество должно быть больше нуля");
    if (units < network.min)
      throw new Error("биржа не примет меньше " + Market.amount(network.min, tokenId) + " " + token.sym);

    var fee = networkFee(tokenId);
    if (units + fee > balanceOf(tokenId) + 1e-12) throw new Error("не хватает на комиссию сети");

    setBalance(tokenId, balanceOf(tokenId) - units - fee);
    var exchange = (Market.EXCHANGES.filter(function (e) { return e.id === opts.exchange; })[0] || {}).name ||
      opts.exchangeName || "биржу";
    var tx = record({
      kind: "exchange", tokenId: tokenId, amount: units, usd: units * token.price,
      fee: fee * token.price, address: address, memo: String(opts.memo || "").trim() || null,
      exchange: exchange, network: network.label
    });
    notify("exchange", "Выведено на " + exchange,
      Market.amount(units, tokenId) + " " + token.sym + " · " + network.label);
    save();
    return tx;
  }

  function swapQuote(fromId, toId, units) {
    var from = Market.byId(fromId), to = Market.byId(toId);
    if (!from || !to || fromId === toId) return null;
    var gross = units * from.price;
    var fee = gross * FEES.swap;
    return {
      from: from, to: to, units: units,
      out: (gross - fee) / to.price,
      fee: fee,
      rate: from.price / to.price,
      impact: Math.min(0.9, (gross / 250000) * 100)
    };
  }

  function swap(fromId, toId, units) {
    var quote = swapQuote(fromId, toId, units);
    if (!quote) throw new Error("нельзя обменять токен сам на себя");
    if (!(units > 0)) throw new Error("количество должно быть больше нуля");
    if (units > balanceOf(fromId) + 1e-12) throw new Error("недостаточно " + quote.from.sym);

    setBalance(fromId, balanceOf(fromId) - units);
    setBalance(toId, balanceOf(toId) + quote.out);
    var tx = record({
      kind: "swap", tokenId: fromId, amount: units, usd: units * quote.from.price,
      fee: quote.fee, toTokenId: toId, toAmount: quote.out
    });
    notify("swap", "Обмен выполнен",
           Market.amount(units, fromId) + " " + quote.from.sym + " → " +
           Market.amount(quote.out, toId) + " " + quote.to.sym);
    save();
    return tx;
  }

  /* ---------- staking ---------- */

  /** Rewards owed on a position right now, from elapsed demo time. */
  function rewardsOf(stake) {
    var hours = ((Date.now() - stake.since) / 1000) * HOURS_PER_SECOND;
    return (stake.carried || 0) + stake.amount * (stake.apy / 100) * (hours / (24 * 365));
  }

  function stakes() { return account().stakes || []; }

  function rewardsTotal() {
    return stakes().reduce(function (sum, st) {
      return sum + rewardsOf(st) * Market.byId(st.tokenId).price;
    }, 0);
  }

  function stake(tokenId, units, validatorId) {
    var token = Market.byId(tokenId);
    if (!token) throw new Error("нет такого токена");
    if (!token.apy) throw new Error(token.sym + " не поддерживает стейкинг");
    if (!(units > 0)) throw new Error("количество должно быть больше нуля");
    if (units > balanceOf(tokenId) + 1e-12) throw new Error("недостаточно " + token.sym);

    setBalance(tokenId, balanceOf(tokenId) - units);
    var position = {
      id: signature(), tokenId: tokenId, amount: units, validator: validatorId,
      apy: Market.apyFor(tokenId, validatorId), since: Date.now(), carried: 0
    };
    account().stakes.push(position);
    var tx = record({ kind: "stake", tokenId: tokenId, amount: units, usd: units * token.price, fee: 0 });
    notify("stake", "Застейкано " + Market.amount(units, tokenId) + " " + token.sym,
           "Ставка " + position.apy.toFixed(1).replace(".", ",") + " % годовых");
    save();
    return tx;
  }

  /** Pays out rewards without touching the principal. */
  function claim(stakeId) {
    var position = stakes().filter(function (st) { return st.id === stakeId; })[0];
    if (!position) throw new Error("позиция не найдена");
    var reward = rewardsOf(position);
    /* Demo time runs fast enough that a reward is never exactly zero, so the
       bar is the token's own precision: don't spend a transaction on dust. */
    var dust = Math.pow(10, -(Market.byId(position.tokenId).dp + 2));
    if (reward < dust) throw new Error("награда пока слишком мала");

    position.carried = 0;
    position.since = Date.now();
    setBalance(position.tokenId, balanceOf(position.tokenId) + reward);
    var token = Market.byId(position.tokenId);
    var tx = record({ kind: "reward", tokenId: position.tokenId, amount: reward, usd: reward * token.price, fee: 0 });
    notify("reward", "Награда зачислена", Market.amount(reward, position.tokenId) + " " + token.sym);
    save();
    return tx;
  }

  /** Returns principal and rewards together, and closes the position. */
  function unstake(stakeId) {
    var position = stakes().filter(function (st) { return st.id === stakeId; })[0];
    if (!position) throw new Error("позиция не найдена");
    var reward = rewardsOf(position);
    var returned = position.amount + reward;

    account().stakes = stakes().filter(function (st) { return st.id !== stakeId; });
    setBalance(position.tokenId, balanceOf(position.tokenId) + returned);
    var token = Market.byId(position.tokenId);
    var tx = record({ kind: "unstake", tokenId: position.tokenId, amount: returned, usd: returned * token.price, fee: 0 });
    notify("unstake", "Выведено из стейкинга",
           Market.amount(returned, position.tokenId) + " " + token.sym + ", включая награду");
    save();
    return tx;
  }

  /* ---------- address book ---------- */

  function contacts() { return state.contacts; }

  function contactFor(address) {
    return state.contacts.filter(function (c) { return c.address === address; })[0] || null;
  }

  function addContact(name, address, note) {
    if (!String(name || "").trim()) throw new Error("нужно имя");
    /* The book also holds exchange deposit addresses, and those live on
       other networks — 0x…, T…, addr1… — so the base58 rule is too narrow. */
    if (!addressIsPlausible(address)) throw new Error("адрес выглядит неверно");
    if (contactFor(address.trim())) throw new Error("такой адрес уже сохранён");
    var contact = { id: signature(), name: String(name).trim(), address: String(address).trim(), note: String(note || "").trim() };
    state.contacts.unshift(contact);
    save();
    return contact;
  }

  function removeContact(id) {
    state.contacts = state.contacts.filter(function (c) { return c.id !== id; });
    save();
  }

  /* ---------- price alerts ---------- */

  function alerts() { return state.alerts; }

  function addAlert(tokenId, direction, price) {
    var token = Market.byId(tokenId);
    if (!token) throw new Error("нет такого токена");
    if (!(price > 0)) throw new Error("укажите цену больше нуля");
    if (direction === "above" && price <= token.price) throw new Error("цена уже выше указанной");
    if (direction === "below" && price >= token.price) throw new Error("цена уже ниже указанной");
    var alert = { id: signature(), tokenId: tokenId, direction: direction, price: price, at: Date.now() };
    state.alerts.unshift(alert);
    save();
    return alert;
  }

  function removeAlert(id) {
    state.alerts = state.alerts.filter(function (a) { return a.id !== id; });
    save();
  }

  /** Called on every market tick; returns the alerts that just tripped. */
  function checkAlerts() {
    if (!state) return [];
    var fired = state.alerts.filter(function (a) {
      var price = Market.byId(a.tokenId).price;
      return a.direction === "above" ? price >= a.price : price <= a.price;
    });
    if (!fired.length) return [];
    fired.forEach(function (a) {
      var token = Market.byId(a.tokenId);
      notify("alert", token.sym + (a.direction === "above" ? " выше " : " ниже ") +
        Market.money(a.price, state.settings.currency),
        "Сейчас " + Market.money(token.price, state.settings.currency));
      removeAlert(a.id);
    });
    save();
    return fired;
  }

  /* ---------- notifications ---------- */

  function notes() { return state.notes; }
  function unreadCount() { return state.notes.filter(function (n) { return !n.read; }).length; }

  function notify(kind, title, body) {
    state.notes.unshift({ id: signature(), kind: kind, title: title, body: body, at: Date.now(), read: false });
    if (state.notes.length > MAX_NOTES) state.notes.length = MAX_NOTES;
    queueLetter(kind, title, body);
  }

  function markNotesRead() {
    state.notes.forEach(function (n) { n.read = true; });
    save();
  }

  /** Base58, and the length a 32-byte key encodes to: this network's own. */
  function addressLooksValid(address) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,46}$/.test(String(address || "").trim());
  }

  /** Any network's address, loosely: enough to store, not to send blindly. */
  function addressIsPlausible(address) {
    return /^[A-Za-z0-9:._-]{20,80}$/.test(String(address || "").trim());
  }

  function settings() { return state.settings; }

  function setSetting(key, value) {
    state.settings[key] = value;
    save();
  }

  var api = {
    exists: exists, isUnlocked: isUnlocked, create: create, unlock: unlock,
    lock: lock, reset: reset, recoveryPhrase: recoveryPhrase,
    state: function () { return state; },
    account: account, accounts: function () { return state.accounts; },
    addAccount: addAccount, selectAccount: selectAccount,
    balanceOf: balanceOf, stakedOf: stakedOf, holdingOf: holdingOf,
    total: total, stakedTotal: stakedTotal, totalChange: totalChange, totalSeries: totalSeries,
    card: function () { return state.card; },
    txs: function () { return state.txs; },
    buy: buy, sell: sell, send: send, swap: swap, swapQuote: swapQuote,
    topUpCard: topUpCard, depositToken: depositToken, withdrawToExchange: withdrawToExchange,
    loadDemoPortfolio: loadDemoPortfolio, zeroOut: zeroOut, CARD_LIMIT: CARD_LIMIT,
    networkFee: networkFee, addressLooksValid: addressLooksValid,
    addressIsPlausible: addressIsPlausible,
    settings: settings, setSetting: setSetting, save: save,
    stakes: stakes, stake: stake, unstake: unstake, claim: claim,
    rewardsOf: rewardsOf, rewardsTotal: rewardsTotal,
    contacts: contacts, contactFor: contactFor, addContact: addContact, removeContact: removeContact,
    alerts: alerts, addAlert: addAlert, removeAlert: removeAlert, checkAlerts: checkAlerts,
    notes: notes, unreadCount: unreadCount, markNotesRead: markNotesRead,
    mail: mail, MAIL_GROUPS: MAIL_GROUPS, emailLooksValid: emailLooksValid,
    setMailAddress: setMailAddress, setMailGroup: setMailGroup,
    composeLetter: composeLetter, letterBody: letterBody, letterSubject: letterSubject,
    outbox: outbox, pendingLetters: pendingLetters,
    markLetterSent: markLetterSent, markAllSent: markAllSent, clearOutbox: clearOutbox,
    digest: digest, mailtoLink: mailtoLink,
    FEES: FEES, NETWORK_FEE_USD: NETWORK_FEE_USD, HOURS_PER_SECOND: HOURS_PER_SECOND
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.WalletStore = api;
})(typeof window !== "undefined" ? window : globalThis);
