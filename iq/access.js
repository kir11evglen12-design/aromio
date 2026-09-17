/**
 * КОДЫ ДОСТУПА.
 *
 * Бэкенда у страницы нет: она лежит статикой и работает даже из файла.
 * Поэтому доступ к полному тесту открывает код, который покупатель
 * получает после оплаты, а страница проверяет его сама — по контрольной
 * части, дописанной к коду при выпуске.
 *
 * Честно о границах: проверка идёт в браузере, а значит алгоритм лежит в
 * исходнике страницы. Человек, который откроет исходник, сможет выпустить
 * себе код. Это защита от пересылки кода другу, а не от того, кто умеет
 * читать JavaScript. Если продажи вырастут настолько, что это станет
 * заметно, коды надо выпускать на сервере и гасить после первой
 * активации — как это сделать, написано в README.
 *
 * Алфавит — кроконтфордовский base32: нет I, L, O и U, поэтому «ноль или
 * буква О» не может стать проблемой при переписывании кода от руки.
 */
(function (global) {
  "use strict";

  var ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  var PREFIX = "IQ";
  var PAYLOAD = 8;   /* 2 знака — номер партии, 6 — случайные */
  var CHECK = 4;     /* контрольная часть: 20 бит, около миллиона вариантов */

  /** FNV-1a с перемешиванием на выходе: короткий и одинаковый везде. */
  function hash(text) {
    var h = 0x811c9dc5, i;
    for (i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    h ^= h >>> 16; h = Math.imul(h, 0x7feb352d) >>> 0;
    h ^= h >>> 15; h = Math.imul(h, 0x846ca68b) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
  }

  function toBase32(value, length) {
    var out = "", i;
    for (i = 0; i < length; i++) {
      out = ALPHABET[value % 32] + out;
      value = Math.floor(value / 32);
    }
    return out;
  }

  function fromBase32(text) {
    var value = 0, i, at;
    for (i = 0; i < text.length; i++) {
      at = ALPHABET.indexOf(text[i]);
      if (at < 0) return -1;
      value = value * 32 + at;
    }
    return value;
  }

  /** Контрольная часть кода: зависит и от тела кода, и от секрета продавца. */
  function checksum(payload, secret) {
    return toBase32(hash(secret + "|" + payload) % Math.pow(32, CHECK), CHECK);
  }

  /** Приводит к каноническому виду: регистр, разделители, похожие знаки. */
  function normalize(input) {
    return String(input || "")
      .toUpperCase()
      .replace(/[\s\-_.]/g, "")
      .replace(/^IQ/, "")
      .replace(/O/g, "0")
      .replace(/[IL]/g, "1")
      .replace(/U/g, "V");
  }

  function pretty(body) {
    return PREFIX + "-" + body.slice(0, 4) + "-" + body.slice(4, 8) + "-" + body.slice(8, 12);
  }

  /**
   * Выпускает код. `random` — функция, выдающая число 0..1; в Node это
   * crypto, в браузере код никто не выпускает, там его только проверяют.
   */
  function make(secret, batch, random) {
    var rnd = random || Math.random;
    var body = toBase32(batch % 1024, 2), i;
    for (i = 0; i < PAYLOAD - 2; i++) body += ALPHABET[Math.floor(rnd() * 32) % 32];
    return pretty(body + checksum(body, secret));
  }

  /** Проверяет код. Возвращает партию, чтобы можно было отследить продажу. */
  function read(code, secret) {
    var body = normalize(code);
    if (body.length !== PAYLOAD + CHECK) return { ok: false, reason: "длина" };
    var payload = body.slice(0, PAYLOAD);
    if (fromBase32(payload) < 0 || fromBase32(body.slice(PAYLOAD)) < 0) return { ok: false, reason: "знаки" };
    if (checksum(payload, secret) !== body.slice(PAYLOAD)) return { ok: false, reason: "контрольная часть" };
    return { ok: true, batch: fromBase32(payload.slice(0, 2)), code: pretty(body) };
  }

  var api = {
    ALPHABET: ALPHABET, make: make, read: read, normalize: normalize, pretty: pretty,
    checksum: checksum, hash: hash
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.Access = api;
})(typeof window !== "undefined" ? window : globalThis);
