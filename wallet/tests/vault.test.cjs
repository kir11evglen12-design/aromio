const fs = require('fs'), crypto = require('crypto'), path = require('path');
const ROOT = path.join(__dirname, '..', '/');
const sb = {};
for (const f of ['wordlist.js', 'vault.js'])
  new Function('window', fs.readFileSync(ROOT + f, 'utf8'))(sb);
const V = sb.Vault;

let fails = 0;
const eq = (name, a, b) => { const ok = a === b; if (!ok) fails++; console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `\n     got ${a}\n     exp ${b}`)); };

// SHA-256 against Node's implementation, including multi-block and unicode
let shaBad = 0;
for (let n = 0; n <= 200; n++) {
  const s = 'a'.repeat(n);
  if (V.hex(V.digest(s)) !== crypto.createHash('sha256').update(s).digest('hex')) { shaBad++; console.log('FAIL sha256 len=' + n); }
}
for (const s of ['abc', 'Проверка юникода — многобайтовые символы', JSON.stringify({a:1,b:[2,3]}), 'x'.repeat(5000)]) {
  if (V.hex(V.digest(s)) !== crypto.createHash('sha256').update(s, 'utf8').digest('hex')) { shaBad++; console.log('FAIL sha256 ' + s.slice(0, 12)); }
}
eq('sha256 over lengths 0..200 + unicode + 5 KB', shaBad, 0);

// base58 against a reference implementation
const B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function refB58(buf) {
  let n = BigInt('0x' + (buf.toString('hex') || '0')), out = '';
  while (n > 0n) { out = B58[Number(n % 58n)] + out; n /= 58n; }
  for (const b of buf) { if (b === 0) out = B58[0] + out; else break; }
  return out || B58[0];
}
for (let i = 0; i < 40; i++) {
  const buf = crypto.randomBytes(i === 0 ? 32 : 1 + (i % 33));
  if (i % 7 === 0) buf[0] = 0;
  eq('base58 #' + i, V.base58(new Uint8Array(buf)), refB58(buf));
}

// phrases
const seen = new Set();
for (let i = 0; i < 200; i++) {
  const p = V.newPhrase();
  if (!V.phraseIsValid(p)) { fails++; console.log('FAIL phrase invalid:', p); }
  seen.add(p);
}
eq('200 phrases all distinct', seen.size, 200);
eq('rejects 11 words', V.phraseIsValid('abbey adobe agent alien amber angle arbor arrow atlas autumn badge'), false);
eq('rejects unknown word', V.phraseIsValid('abbey adobe agent alien amber angle arbor arrow atlas autumn badge zzzzzz'), false);
eq('accepts messy spacing/case', V.phraseIsValid('  Abbey   adobe\nAGENT alien amber angle arbor arrow atlas autumn badge baker '), true);

// addresses: stable, distinct per account, base58 shaped
const phrase = V.newPhrase();
const a0 = V.addressFor(phrase, 0), a1 = V.addressFor(phrase, 1);
eq('address stable', a0, V.addressFor(phrase, 0));
eq('address differs per index', a0 !== a1, true);
eq('address charset', /^[1-9A-HJ-NP-Za-km-z]{40,46}$/.test(a0), true);
eq('address differs per phrase', a0 !== V.addressFor(V.newPhrase(), 0), true);

// password + sealed phrase
const salt = V.newSalt();
const t0 = Date.now();
const h = V.passwordHash('correct horse', salt);
const cost = Date.now() - t0;
eq('password matches', V.passwordMatches('correct horse', salt, h), true);
eq('wrong password rejected', V.passwordMatches('correct horsе', salt, h), false);
eq('same password, other salt differs', V.passwordHash('correct horse', V.newSalt()) !== h, true);
const sealed = V.sealPhrase(phrase, 'correct horse', salt);
eq('phrase not stored in the clear', sealed.includes(Buffer.from(phrase).toString('hex')), false);
eq('unseal round-trip', V.openPhrase(sealed, 'correct horse', salt), phrase);
eq('unseal with wrong password ≠ phrase', V.openPhrase(sealed, 'wrong', salt) !== phrase, true);
const longPhrase = phrase + ' ' + phrase + ' ' + phrase;   // > 32 bytes, spans keystream blocks
eq('unseal long round-trip', V.openPhrase(V.sealPhrase(longPhrase, 'pw', salt), 'pw', salt), longPhrase);

// deterministic PRNG
const r1 = V.seedRandom('abc'), r2 = V.seedRandom('abc'), r3 = V.seedRandom('abd');
eq('seedRandom deterministic', r1() === r2(), true);
eq('seedRandom differs by seed', r1() !== r3(), true);
const vals = Array.from({length: 5000}, () => V.seedRandom('x' + Math.random())());
eq('seedRandom stays in [0,1)', vals.every(v => v >= 0 && v < 1), true);
const mean = vals.reduce((a, b) => a + b) / vals.length;
eq('seedRandom roughly uniform (mean≈0.5)', Math.abs(mean - 0.5) < 0.03, true);

console.log(`\nkey stretching: ${cost} ms per password check`);
console.log(fails ? `\n${fails} FAILURES` : '\nall vault checks passed');
process.exit(fails ? 1 : 0);
