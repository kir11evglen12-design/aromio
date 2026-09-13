const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '/');
const store = {};
const win = {
  crypto: require('crypto').webcrypto,
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; }
  }
};
for (const f of ['wordlist.js', 'qr.js', 'vault.js', 'market.js', 'wallet.js'])
  new Function('window', fs.readFileSync(ROOT + f, 'utf8'))(win);

const { Vault, Market, WalletStore: W } = win;
let fails = 0;
const ok = (name, cond, extra) => { if (!cond) { fails++; console.log('FAIL ' + name + (extra ? ' — ' + extra : '')); } else console.log('ok   ' + name); };
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
const throws = (name, fn, re) => {
  try { fn(); fails++; console.log('FAIL ' + name + ' — did not throw'); }
  catch (e) { ok(name + ' → «' + e.message + '»', re ? re.test(e.message) : true); }
};

// ---------- creation ----------
const phrase = Vault.newPhrase();
W.create('pass-12345', phrase);
ok('wallet exists after create', W.exists() && W.isUnlocked());
ok('address derives from the phrase', W.account().address === Vault.addressFor(phrase, 0));
ok('card starts at 5000', W.card().available === 5000);
const startTotal = W.total();
ok('total = Σ balance × price', near(startTotal, Market.TOKENS.reduce((s, t) => s + W.balanceOf(t.id) * t.price, 0)));

// ---------- buy ----------
{
  const cardBefore = W.card().available, solBefore = W.balanceOf('sol'), price = Market.byId('sol').price;
  const tx = W.buy('sol', 300);
  const fee = 300 * W.FEES.buy;
  ok('buy: card debited by exactly the amount', near(W.card().available, cardBefore - 300));
  ok('buy: credited (amount − fee) / price', near(W.balanceOf('sol'), solBefore + (300 - fee) / price));
  ok('buy: fee is 1.2 %', near(tx.fee, 3.6));
  ok('buy: history got one entry', W.txs()[0].kind === 'buy' && W.txs()[0].usd === 300);
  ok('buy: signature is base58, 32 bytes', /^[1-9A-HJ-NP-Za-km-z]{40,46}$/.test(tx.id));
}
throws('buy above the card limit', () => W.buy('sol', 99999), /недостаточно/);
throws('buy zero', () => W.buy('sol', 0), /больше нуля/);
throws('buy an unknown token', () => W.buy('nope', 10), /нет такого/);

// ---------- sell ----------
{
  const cardBefore = W.card().available, ethBefore = W.balanceOf('eth'), price = Market.byId('eth').price;
  W.sell('eth', 0.5);
  const gross = 0.5 * price, fee = gross * W.FEES.sell;
  ok('sell: tokens debited', near(W.balanceOf('eth'), ethBefore - 0.5));
  ok('sell: card credited (gross − fee)', near(W.card().available, cardBefore + gross - fee));
}
throws('sell more than held', () => W.sell('eth', 1e6), /недостаточно/);

// ---------- buy then sell the same amount loses only the two fees ----------
{
  const cardBefore = W.card().available;
  const tonBefore = W.balanceOf('ton');
  const bought = W.buy('ton', 400).amount;
  W.sell('ton', bought);
  const spread = cardBefore - W.card().available;
  const expected = 400 * W.FEES.buy + (400 - 400 * W.FEES.buy) * W.FEES.sell;
  ok('round trip costs exactly both fees', near(spread, expected, 1e-9), `${spread.toFixed(6)} vs ${expected.toFixed(6)}`);
  ok('round trip leaves the token balance where it was', near(W.balanceOf('ton'), tonBefore, 1e-9));
}

// ---------- send ----------
{
  const before = W.balanceOf('sol'), fee = W.networkFee('sol');
  const to = Vault.base58(Vault.digest('some/other/wallet'));
  const tx = W.send('sol', 1.5, to);
  ok('send: debits amount plus network fee', near(W.balanceOf('sol'), before - 1.5 - fee));
  ok('send: fee equals $0.12 worth', near(tx.fee, W.NETWORK_FEE_USD, 1e-9));
  ok('send: records the destination', tx.address === to);
}
throws('send to a malformed address', () => W.send('sol', 1, 'not-an-address!'), /адрес/i);
throws('send to your own address', () => W.send('sol', 1, W.account().address), /этого же счёта/);
throws('send more than the balance', () => W.send('sol', 1e9, Vault.base58(Vault.digest('x'))), /не хватает/);
ok('address validator rejects base58-illegal chars', !W.addressLooksValid('0OIl' + 'a'.repeat(40)));
ok('address validator accepts a real derived address', W.addressLooksValid(W.account().address));

// ---------- swap ----------
{
  const usdcBefore = W.balanceOf('usdc'), cobBefore = W.balanceOf('cob');
  const quote = W.swapQuote('usdc', 'cob', 500);
  W.swap('usdc', 'cob', 500);
  ok('swap: source debited', near(W.balanceOf('usdc'), usdcBefore - 500));
  ok('swap: target credited per quote', near(W.balanceOf('cob'), cobBefore + quote.out));
  ok('swap: fee is 0.25 % of the input value', near(quote.fee, 500 * Market.byId('usdc').price * 0.0025));
  const lost = 500 * Market.byId('usdc').price - quote.out * Market.byId('cob').price;
  ok('swap: value lost equals the fee', near(lost, quote.fee, 1e-9));
}
throws('swap a token for itself', () => W.swap('sol', 'sol', 1), /сам на себя/);
throws('swap more than held', () => W.swap('usdc', 'sol', 1e9), /недостаточно/);

// ---------- accounts ----------
{
  const first = W.account().address;
  W.addAccount('Второй');
  ok('new account gets a different address', W.account().address !== first);
  ok('new account address is derived from the same phrase', W.account().address === Vault.addressFor(phrase, 1));
  ok('new account starts empty', W.total() === 0);
  W.selectAccount(0);
  ok('switching back restores the first account', W.account().address === first);
  W.selectAccount(99);
  ok('out-of-range account index is clamped', W.account().address === Vault.addressFor(phrase, 1));
  W.selectAccount(0);
}

// ---------- lock, persistence, reset ----------
{
  const totalBefore = W.total();
  W.lock();
  ok('locking clears the in-memory state', !W.isUnlocked() && W.recoveryPhrase() === null);
  ok('locked wallet still exists on disk', W.exists());
  ok('wrong password does not unlock', W.unlock('nope') === false);
  ok('right password unlocks', W.unlock('pass-12345') === true);
  ok('balances survived the lock', near(W.total(), totalBefore));
  ok('phrase comes back after unlock', W.recoveryPhrase() === phrase);
  ok('stored blob never contains the phrase', !JSON.stringify(store).includes(phrase.split(' ')[0] + ' ' + phrase.split(' ')[1]));
  ok('stored blob never contains the password', !JSON.stringify(store).includes('pass-12345'));
}
{
  W.reset();
  ok('reset wipes storage', !W.exists() && !W.isUnlocked());
}

// ---------- market ----------
{
  W.create('pw-abcdefgh', Vault.newPhrase());
  const s1 = Market.series('sol', '1d');
  ok('series has the frame length', s1.length === 96);
  ok('series ends on the live price', near(s1[s1.length - 1], Market.byId('sol').price, 1e-12));
  ok('series is stable across reads', Market.series('sol', '1d').every((v, i) => v === s1[i]));
  ok('change matches the series it draws', near(Market.change('sol', '1d'), (s1[95] - s1[0]) / s1[0] * 100, 1e-12));
  ok('all prices stay positive over 400 ticks', Array.from({length: 400}, () => { Market.tick(); return Market.TOKENS.every(t => t.price > 0); }).every(Boolean));
  ok('USDC stays pegged after the ticks', Math.abs(Market.byId('usdc').price - 1) < 0.01, Market.byId('usdc').price.toFixed(5));
  const s2 = Market.series('sol', '1d');
  ok('series still ends on the live price after ticks', near(s2[s2.length - 1], Market.byId('sol').price, 1e-9));
  ok('money() formats in the chosen currency', Market.money(1234.5, 'RUB').includes('₽') && Market.money(1234.5, 'USD').includes('$'));
  ok('percent() marks the sign', Market.percent(-2.5).startsWith('−') && Market.percent(2.5).startsWith('+'));
}

console.log(fails ? `\n${fails} FAILURES` : '\nall wallet-logic checks passed');
process.exit(fails ? 1 : 0);
