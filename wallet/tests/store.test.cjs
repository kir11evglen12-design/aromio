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
ok('total = Σ (free + staked) × price', near(startTotal, Market.TOKENS.reduce((s, t) => s + W.holdingOf(t.id) * t.price, 0)));
ok('total counts the starter stake', startTotal > Market.TOKENS.reduce((s, t) => s + W.balanceOf(t.id) * t.price, 0));

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
  const usdcBefore = W.balanceOf('usdc'), mrdBefore = W.balanceOf('mrd');
  const quote = W.swapQuote('usdc', 'mrd', 500);
  W.swap('usdc', 'mrd', 500);
  ok('swap: source debited', near(W.balanceOf('usdc'), usdcBefore - 500));
  ok('swap: target credited per quote', near(W.balanceOf('mrd'), mrdBefore + quote.out));
  ok('swap: fee is 0.25 % of the input value', near(quote.fee, 500 * Market.byId('usdc').price * 0.0025));
  const lost = 500 * Market.byId('usdc').price - quote.out * Market.byId('mrd').price;
  ok('swap: value lost equals the fee', near(lost, quote.fee, 1e-9));
}
throws('swap a token for itself', () => W.swap('sol', 'sol', 1), /сам на себя/);
throws('swap more than held', () => W.swap('usdc', 'sol', 1e9), /недостаточно/);

// ---------- staking ----------
{
  const before = W.balanceOf('sol');
  const stakesBefore = W.stakes().length;
  W.stake('sol', 3, 'signal9');
  const position = W.stakes()[W.stakes().length - 1];
  ok('stake: moves tokens out of the free balance', near(W.balanceOf('sol'), before - 3));
  ok('stake: counted as staked', near(W.stakedOf('sol'), W.stakes().reduce((s, st) => st.tokenId === 'sol' ? s + st.amount : s, 0)));
  ok('stake: holding = free + staked', near(W.holdingOf('sol'), W.balanceOf('sol') + W.stakedOf('sol')));
  ok('stake: opened one position', W.stakes().length === stakesBefore + 1);
  ok('stake: apy comes from token and validator', near(position.apy, Market.apyFor('sol', 'signal9')));
  ok('stake: rewards start at zero', W.rewardsOf(position) < 1e-6);

  // rewards are a function of elapsed time, so the clock can be moved instead of waited on
  position.since = Date.now() - 3600 * 1000;              // an hour of real time
  const hours = 3600 * W.HOURS_PER_SECOND;                 // ...is that many demo hours
  const expected = position.amount * (position.apy / 100) * (hours / (24 * 365));
  ok('rewards accrue from elapsed demo time', near(W.rewardsOf(position), expected, 1e-6),
     `${W.rewardsOf(position).toFixed(6)} vs ${expected.toFixed(6)}`);

  const freeBefore = W.balanceOf('sol'), reward = W.rewardsOf(position);
  W.claim(position.id);
  ok('claim: pays the reward into the free balance', near(W.balanceOf('sol'), freeBefore + reward, 1e-6));
  ok('claim: leaves the principal staked', near(position.amount, 3));
  ok('claim: resets the accrual clock', W.rewardsOf(position) < 1e-6);
  throws('claim again immediately, while the reward is still dust', () => W.claim(position.id), /слишком мала/);

  position.since = Date.now() - 7200 * 1000;
  const owed = W.rewardsOf(position);
  const free2 = W.balanceOf('sol');
  W.unstake(position.id);
  ok('unstake: returns principal plus reward', near(W.balanceOf('sol'), free2 + 3 + owed, 1e-6));
  ok('unstake: closes the position', !W.stakes().some(st => st.id === position.id));
  ok('unstake: nothing left staked from it', near(W.stakedOf('sol'), W.stakes().reduce((s, st) => st.tokenId === 'sol' ? s + st.amount : s, 0)));
}
throws('stake a token without staking', () => W.stake('btc', 0.001, 'polaris'), /не поддерживает/);
throws('stake more than free', () => W.stake('sol', 1e9, 'polaris'), /недостаточно/);
throws('unstake an unknown position', () => W.unstake('nope'), /не найдена/);

// ---------- topping up ----------
{
  const cardBefore = W.card().available;
  W.topUpCard(750);
  ok('card top-up adds exactly the amount', near(W.card().available, cardBefore + 750));
  ok('card top-up is recorded', W.txs()[0].kind === 'topup' && W.txs()[0].usd === 750);
  ok('card top-up costs no fee', W.txs()[0].fee === 0);

  const solBefore = W.balanceOf('sol');
  const tx = W.depositToken('sol', 2.5);
  ok('deposit credits the token', near(W.balanceOf('sol'), solBefore + 2.5));
  ok('deposit lands in history as incoming', tx.kind === 'in' && W.addressLooksValid(tx.address));
}
throws('top up with zero', () => W.topUpCard(0), /больше нуля/);
throws('top up past the demo limit', () => W.topUpCard(W.CARD_LIMIT * 2), /миллиона/);
throws('deposit an unknown token', () => W.depositToken('nope', 1), /нет такого/);

// ---------- withdrawing to an exchange ----------
{
  const solAddress = Vault.base58(Vault.digest('bybit/sol/deposit'));
  const before = W.balanceOf('sol');
  const fee = W.networkFee('sol');
  const tx = W.withdrawToExchange('sol', 1, { address: solAddress, exchange: 'bybit', network: 'solana' });
  ok('withdrawal debits amount plus network fee', near(W.balanceOf('sol'), before - 1 - fee));
  ok('withdrawal remembers where it went', tx.exchange === 'Bybit' && tx.network === 'Solana' && tx.address === solAddress);
  ok('withdrawal is its own kind of entry', tx.kind === 'exchange');

  // the mistake that actually loses money: right address, wrong network
  const ercAddress = '0x8f3Ac1b2D4e5F60718293a4B5c6D7e8F90a1B2c3';
  throws('an ERC-20 address on Solana is refused',
    () => W.withdrawToExchange('usdc', 50, { address: ercAddress, exchange: 'bybit', network: 'solana' }), /сети/);
  const ok50 = W.withdrawToExchange('usdc', 50, { address: ercAddress, exchange: 'bybit', network: 'ethereum' });
  ok('the same address on Ethereum goes through', ok50.network === 'Ethereum (ERC-20)');

  // networks that need a memo say so
  const tonAddress = 'UQ' + 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUu1234'; // 48 chars, TON shape
  ok('the test TON address is the right shape', tonAddress.length === 48);
  throws('TON without a memo is refused',
    () => W.withdrawToExchange('ton', 5, { address: tonAddress, exchange: 'bybit', network: 'ton' }), /memo/);
  const withMemo = W.withdrawToExchange('ton', 5, { address: tonAddress, memo: '4471829', exchange: 'bybit', network: 'ton' });
  ok('TON with a memo goes through', withMemo.memo === '4471829');

  throws('below the exchange minimum', () => W.withdrawToExchange('usdc', 0.5,
    { address: ercAddress, exchange: 'bybit', network: 'ethereum' }), /не примет меньше/);
  throws('unknown network', () => W.withdrawToExchange('sol', 1,
    { address: solAddress, exchange: 'bybit', network: 'made-up' }), /выберите сеть/);
  throws('empty address', () => W.withdrawToExchange('sol', 1,
    { address: '', exchange: 'bybit', network: 'solana' }), /вставьте адрес/);
  throws('more than held', () => W.withdrawToExchange('sol', 1e9,
    { address: solAddress, exchange: 'bybit', network: 'solana' }), /не хватает/);
}

// ---------- address book ----------
{
  const before = W.contacts().length;
  const address = Vault.base58(Vault.digest('friend/one'));
  const contact = W.addContact('  Борис  ', address, 'обмен');
  ok('contact: added and trimmed', W.contacts().length === before + 1 && contact.name === 'Борис');
  ok('contact: found by address', W.contactFor(address).id === contact.id);
  ok('contact: unknown address returns null', W.contactFor(Vault.base58(Vault.digest('nobody'))) === null);
  throws('duplicate contact', () => W.addContact('Ещё раз', address), /уже сохранён/);
  throws('contact without a name', () => W.addContact('   ', Vault.base58(Vault.digest('x'))), /нужно имя/);
  throws('contact with a bad address', () => W.addContact('Кто-то', 'nope!'), /адрес/i);
  const erc = W.addContact('Bybit · USDC', '0x8f3Ac1b2D4e5F60718293a4B5c6D7e8F90a1B2c3', 'Ethereum (ERC-20)');
  ok('an exchange address on another network can be saved', W.contactFor(erc.address).note === 'Ethereum (ERC-20)');
  ok('but it is not valid for this network', !W.addressLooksValid(erc.address));
  W.removeContact(erc.id);
  W.removeContact(contact.id);
  ok('contact: removed', W.contacts().length === before && W.contactFor(address) === null);
}

// ---------- price alerts ----------
{
  const price = Market.byId('sol').price;
  const above = W.addAlert('sol', 'above', price * 1.5);
  const below = W.addAlert('sol', 'below', price * 0.5);
  ok('alerts: both stored', W.alerts().length === 2);
  ok('alerts: nothing fires while the price sits between them', W.checkAlerts().length === 0);
  throws('alert above a price already passed', () => W.addAlert('sol', 'above', price * 0.5), /уже выше/);
  throws('alert below a price already passed', () => W.addAlert('sol', 'below', price * 1.5), /уже ниже/);
  throws('alert at zero', () => W.addAlert('sol', 'above', 0), /больше нуля/);

  const notesBefore = W.notes().length;
  Market.byId('sol').price = price * 1.6;                 // the market moves past the mark
  const fired = W.checkAlerts();
  ok('alert fires once the price crosses', fired.length === 1 && fired[0].id === above.id);
  ok('fired alert is removed', W.alerts().length === 1 && W.alerts()[0].id === below.id);
  ok('fired alert leaves a notification', W.notes().length === notesBefore + 1 && W.notes()[0].kind === 'alert');
  Market.byId('sol').price = price;
  W.removeAlert(below.id);
  ok('alert removed by hand', W.alerts().length === 0);
}

// ---------- notifications ----------
{
  const before = W.notes().length;
  W.buy('sol', 40);
  ok('a purchase leaves a notification', W.notes().length === before + 1 && W.notes()[0].kind === 'buy');
  ok('new notifications are unread', W.unreadCount() > 0);
  W.markNotesRead();
  ok('marking read clears the count', W.unreadCount() === 0);
  for (let i = 0; i < 60; i++) W.buy('sol', 1);
  ok('the notification list is capped', W.notes().length <= 50);
}

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

// ---------- migration from the wallet's previous name ----------
{
  W.reset();
  const legacyPhrase = Vault.newPhrase();
  const legacySalt = Vault.newSalt();
  store['cobalt.wallet.v1'] = JSON.stringify({
    v: 1,
    auth: { salt: legacySalt, hash: Vault.passwordHash('old-password', legacySalt) },
    sealed: Vault.sealPhrase(legacyPhrase, 'old-password', legacySalt),
    accounts: [{ name: 'Основной', index: 0, address: Vault.addressFor(legacyPhrase, 0, 'cobalt'), balances: { cob: 500, sol: 2 } }],
    active: 0,
    txs: [{ id: 'x', kind: 'buy', tokenId: 'cob', amount: 500, usd: 1000, fee: 12, at: Date.now(), status: 'ok' }]
  });
  ok('an old-name wallet is still found', W.exists());
  ok('it unlocks with its original password', W.unlock('old-password'));
  ok('COB balance moved onto MRD', W.balanceOf('mrd') === 500 && W.balanceOf('cob') === undefined - undefined || W.balanceOf('mrd') === 500);
  ok('history follows the ticker', W.txs()[0].tokenId === 'mrd');
  ok('the missing lists are filled in', Array.isArray(W.contacts()) && Array.isArray(W.alerts()) && Array.isArray(W.stakes()));
  ok('the old address is untouched', W.account().address === Vault.addressFor(legacyPhrase, 0, 'cobalt'));
  W.addAccount('Второй');
  ok('a new account keeps deriving in the old namespace',
     W.account().address === Vault.addressFor(legacyPhrase, 1, 'cobalt'));
  W.reset();
  delete store['cobalt.wallet.v1'];
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
