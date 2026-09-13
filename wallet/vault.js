/**
 * Keys, addresses and the recovery phrase.
 *
 * Everything here is deliberately self-contained: no WebCrypto, no network,
 * so the wallet behaves the same opened from a server or straight off disk.
 * What that buys and what it does not:
 *
 *   - the password is never stored, only a salted, stretched SHA-256 digest;
 *   - the recovery phrase is stored XOR-ed against a keystream derived from
 *     that digest, so it is not sitting in localStorage in the clear;
 *   - 20 000 rounds of SHA-256 in JavaScript is not scrypt or Argon2, and a
 *     stream cipher hand-rolled from a hash is not AES-GCM.
 *
 * That is honest for a wallet holding simulated balances. It is not a
 * keystore for real funds, and nothing here should be reused as one.
 */
(function (global) {
  "use strict";

  var K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  var H0 = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  /** SHA-256 over a byte array. */
  function sha256(bytes) {
    var len = bytes.length;
    /* message + the 0x80 byte + a 64-bit length, rounded up to whole blocks.
       Note the +63: at len = 55 the tail fits exactly and no second block
       is needed, which a plain "+1 block" would get wrong. */
    var withPad = ((len + 9 + 63) >> 6) << 6;
    var block = new Uint8Array(withPad);
    block.set(bytes);
    block[len] = 0x80;
    var bits = len * 8;
    for (var b = 0; b < 8; b++)
      block[withPad - 1 - b] = Math.floor(bits / Math.pow(2, 8 * b)) & 0xff;

    var h = H0.slice();
    var w = new Uint32Array(64);

    for (var off = 0; off < withPad; off += 64) {
      for (var i = 0; i < 16; i++)
        w[i] = (block[off + i * 4] << 24) | (block[off + i * 4 + 1] << 16) |
               (block[off + i * 4 + 2] << 8) | block[off + i * 4 + 3];
      for (var t = 16; t < 64; t++) {
        var w15 = w[t - 15], w2 = w[t - 2];
        var s0 = ((w15 >>> 7) | (w15 << 25)) ^ ((w15 >>> 18) | (w15 << 14)) ^ (w15 >>> 3);
        var s1 = ((w2 >>> 17) | (w2 << 15)) ^ ((w2 >>> 19) | (w2 << 13)) ^ (w2 >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
      }

      var a = h[0], bb = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
      for (var r = 0; r < 64; r++) {
        var S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
        var ch = (e & f) ^ (~e & g);
        var t1 = (hh + S1 + ch + K[r] + w[r]) >>> 0;
        var S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
        var maj = (a & bb) ^ (a & c) ^ (bb & c);
        var t2 = (S0 + maj) >>> 0;
        hh = g; g = f; f = e;
        e = (d + t1) >>> 0;
        d = c; c = bb; bb = a;
        a = (t1 + t2) >>> 0;
      }
      h[0] = (h[0] + a) >>> 0;  h[1] = (h[1] + bb) >>> 0;
      h[2] = (h[2] + c) >>> 0;  h[3] = (h[3] + d) >>> 0;
      h[4] = (h[4] + e) >>> 0;  h[5] = (h[5] + f) >>> 0;
      h[6] = (h[6] + g) >>> 0;  h[7] = (h[7] + hh) >>> 0;
    }

    var out = new Uint8Array(32);
    for (var k = 0; k < 8; k++) {
      out[k * 4] = h[k] >>> 24; out[k * 4 + 1] = (h[k] >>> 16) & 0xff;
      out[k * 4 + 2] = (h[k] >>> 8) & 0xff; out[k * 4 + 3] = h[k] & 0xff;
    }
    return out;
  }

  function utf8(text) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text);
    var out = [];
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
      else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    }
    return new Uint8Array(out);
  }

  function hex(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16);
    return s;
  }

  function unhex(text) {
    var out = new Uint8Array(text.length / 2);
    for (var i = 0; i < out.length; i++) out[i] = parseInt(text.substr(i * 2, 2), 16);
    return out;
  }

  function digest(text) { return sha256(utf8(text)); }

  var B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

  /** Base58 (Bitcoin alphabet) — no 0, O, I or l to misread aloud. */
  function base58(bytes) {
    var digits = [0];
    for (var i = 0; i < bytes.length; i++) {
      var carry = bytes[i];
      for (var j = 0; j < digits.length; j++) {
        carry += digits[j] << 8;
        digits[j] = carry % 58;
        carry = (carry / 58) | 0;
      }
      while (carry) { digits.push(carry % 58); carry = (carry / 58) | 0; }
    }
    var out = "";
    for (var z = 0; z < bytes.length && bytes[z] === 0; z++) out += B58[0];
    for (var d = digits.length - 1; d >= 0; d--) out += B58[digits[d]];
    return out;
  }

  /** Cryptographic randomness where the browser offers it. */
  function randomBytes(n) {
    var out = new Uint8Array(n);
    if (global.crypto && global.crypto.getRandomValues) global.crypto.getRandomValues(out);
    else for (var i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
    return out;
  }

  /** Twelve words out of 256 — 96 bits, one byte of entropy per word. */
  function newPhrase() {
    var words = global.Wordlist.WORDS;
    var bytes = randomBytes(12);
    var picked = [];
    for (var i = 0; i < 12; i++) picked.push(words[bytes[i]]);
    return picked.join(" ");
  }

  function normalizePhrase(text) {
    return String(text).toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean).join(" ");
  }

  /** True when every word is on the list and there are twelve of them. */
  function phraseIsValid(text) {
    var words = normalizePhrase(text).split(" ");
    if (words.length !== 12) return false;
    var list = global.Wordlist.WORDS;
    return words.every(function (w) { return list.indexOf(w) !== -1; });
  }

  /** A stable address for account `index` of this phrase. */
  function addressFor(phrase, index) {
    return base58(digest("cobalt/account/" + index + "/" + normalizePhrase(phrase)));
  }

  var ROUNDS = 20000;

  /** Salted, iterated SHA-256. Slow on purpose, though only mildly so. */
  function stretch(password, salt) {
    var acc = digest(salt + "|" + password);
    var buf = new Uint8Array(36);
    for (var i = 1; i < ROUNDS; i++) {
      buf.set(acc);
      buf[32] = i & 0xff; buf[33] = (i >>> 8) & 0xff;
      buf[34] = (i >>> 16) & 0xff; buf[35] = (i >>> 24) & 0xff;
      acc = sha256(buf);
    }
    return acc;
  }

  function newSalt() { return hex(randomBytes(16)); }

  function passwordHash(password, salt) { return hex(stretch(password, salt)); }

  function passwordMatches(password, salt, expected) {
    var got = passwordHash(password, salt);
    if (got.length !== expected.length) return false;
    var diff = 0;                                   // constant time over the digest
    for (var i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
    return diff === 0;
  }

  /** Keystream: SHA-256 in counter mode over the stretched password. */
  function keystream(key, length) {
    var out = new Uint8Array(length);
    var buf = new Uint8Array(36);
    for (var block = 0; block * 32 < length; block++) {
      buf.set(key);
      buf[32] = block & 0xff; buf[33] = (block >>> 8) & 0xff; buf[34] = 0; buf[35] = 0;
      var chunk = sha256(buf);
      for (var i = 0; i < 32 && block * 32 + i < length; i++) out[block * 32 + i] = chunk[i];
    }
    return out;
  }

  function sealPhrase(phrase, password, salt) {
    var plain = utf8(phrase);
    var pad = keystream(stretch(password, salt), plain.length);
    var out = new Uint8Array(plain.length);
    for (var i = 0; i < plain.length; i++) out[i] = plain[i] ^ pad[i];
    return hex(out);
  }

  function openPhrase(sealed, password, salt) {
    var cipher = unhex(sealed);
    var pad = keystream(stretch(password, salt), cipher.length);
    var out = new Uint8Array(cipher.length);
    for (var i = 0; i < cipher.length; i++) out[i] = cipher[i] ^ pad[i];
    return typeof TextDecoder !== "undefined"
      ? new TextDecoder().decode(out)
      : String.fromCharCode.apply(null, out);
  }

  /** Deterministic 0..1 stream from any string — drives avatars and art. */
  function seedRandom(text) {
    var d = digest(text);
    var s = ((d[0] << 24) | (d[1] << 16) | (d[2] << 8) | d[3]) >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  var api = {
    sha256: sha256, digest: digest, hex: hex, utf8: utf8, base58: base58,
    randomBytes: randomBytes, newPhrase: newPhrase, normalizePhrase: normalizePhrase,
    phraseIsValid: phraseIsValid, addressFor: addressFor, newSalt: newSalt,
    passwordHash: passwordHash, passwordMatches: passwordMatches,
    sealPhrase: sealPhrase, openPhrase: openPhrase, seedRandom: seedRandom
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.Vault = api;
})(typeof window !== "undefined" ? window : globalThis);
