/**
 * Wallet state: accounts, balances, history, and the operations that move
 * money between them. Everything lives in localStorage under one key, and
 * nothing leaves the browser.
 *
 * The linked card is what makes "купить" and "продать" symmetrical: buying
 * draws from the card, selling pays back into it, so neither button mints
 * value out of nowhere.
 */
(function (global) {
  "use strict";

  var KEY = "cobalt.wallet.v1";
  var Market = global.Market;
  var Vault = global.Vault;

  var FEES = { buy: 0.012, sell: 0.012, swap: 0.0025 };
  var NETWORK_FEE_USD = 0.12;

  var state = null;      // persisted
  var phrase = null;     // in memory only, while unlocked

  function read() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function save() {
    try {
      if (global.localStorage) global.localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) { /* private mode: the session still works, it just won't survive */ }
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

  /** Portfolio value in USD, at current prices. */
  function total() {
    return Market.TOKENS.reduce(function (sum, t) {
      return sum + balanceOf(t.id) * t.price;
    }, 0);
  }

  /** Weighted 24h move of the portfolio, so the header figure means something. */
  function totalChange() {
    var now = total();
    if (now <= 0) return 0;
    var before = Market.TOKENS.reduce(function (sum, t) {
      var s = Market.series(t.id, "1d");
      return sum + balanceOf(t.id) * s[0];
    }, 0);
    return before > 0 ? ((now - before) / before) * 100 : 0;
  }

  /* ---------- creation, locking ---------- */

  function starterPortfolio() {
    return { cob: 1180, btc: 0.0412, eth: 1.24, sol: 12.482, ton: 320, usdc: 1840.5, doge: 12500 };
  }

  /** A little history so the activity tab has something true to show. */
  function starterHistory() {
    var day = 86400000;
    var now = Date.now();
    return [
      { id: signature(), kind: "buy",  tokenId: "sol",  amount: 4.2,   usd: 774.2,  fee: 9.29, at: now - day * 2 - 3600e3 * 5, status: "ok" },
      { id: signature(), kind: "swap", tokenId: "usdc", amount: 620,   usd: 620,    fee: 1.55, at: now - day * 4, status: "ok",
        toTokenId: "cob", toAmount: 284.3 },
      { id: signature(), kind: "in",   tokenId: "eth",  amount: 0.35,  usd: 1338.6, fee: 0,    at: now - day * 9, status: "ok",
        address: Vault.base58(Vault.digest("cobalt/demo/sender")) },
      { id: signature(), kind: "buy",  tokenId: "btc",  amount: 0.0412, usd: 2935.1, fee: 35.2, at: now - day * 21, status: "ok" }
    ];
  }

  function create(password, recovery) {
    var salt = Vault.newSalt();
    state = {
      v: 1,
      auth: { salt: salt, hash: Vault.passwordHash(password, salt) },
      sealed: Vault.sealPhrase(recovery, password, salt),
      accounts: [{
        name: "Основной",
        index: 0,
        address: Vault.addressFor(recovery, 0),
        balances: starterPortfolio()
      }],
      active: 0,
      settings: { currency: "USD", hidden: false, network: "mainnet" },
      txs: starterHistory(),
      card: { last4: "4417", available: 5000 }
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
      address: Vault.addressFor(phrase, index),
      balances: {}
    });
    state.active = index;
    save();
  }

  function selectAccount(i) {
    state.active = Math.max(0, Math.min(i, state.accounts.length - 1));
    save();
  }

  /* ---------- operations ---------- */

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
    save();
    return tx;
  }

  /** Base58, and the length a 32-byte key encodes to. */
  function addressLooksValid(address) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,46}$/.test(String(address || "").trim());
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
    balanceOf: balanceOf, total: total, totalChange: totalChange,
    card: function () { return state.card; },
    txs: function () { return state.txs; },
    buy: buy, sell: sell, send: send, swap: swap, swapQuote: swapQuote,
    networkFee: networkFee, addressLooksValid: addressLooksValid,
    settings: settings, setSetting: setSetting, save: save,
    FEES: FEES, NETWORK_FEE_USD: NETWORK_FEE_USD
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.WalletStore = api;
})(typeof window !== "undefined" ? window : globalThis);
