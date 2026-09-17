/**
 * Выпуск кодов доступа: node iq/keygen.cjs [сколько] [--batch N] [--secret S]
 * Проверка кода:        node iq/keygen.cjs --check IQ-XXXX-XXXX-XXXX
 *
 * Секрет по умолчанию берётся из iq/config.js — того же файла, который
 * читает страница. Если секреты разойдутся, страница не примет коды, и это
 * первое, что стоит проверить, когда покупатель пишет «код не подходит».
 *
 * Номер партии (--batch) вшит в сам код: по нему потом видно, из какой
 * поставки код, даже если список потерялся.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const sandbox = { window: {} };
new Function("window", fs.readFileSync(path.join(__dirname, "access.js"), "utf8"))(sandbox);
new Function("window", fs.readFileSync(path.join(__dirname, "config.js"), "utf8"))(sandbox);
const Access = sandbox.Access;
const config = sandbox.IQ_CONFIG || {};

const args = process.argv.slice(2);
const flag = name => {
  const at = args.indexOf("--" + name);
  return at >= 0 ? args[at + 1] : null;
};

const secret = flag("secret") || config.secret;
if (!secret) {
  console.error("keygen: секрет не найден — укажите --secret или заполните iq/config.js");
  process.exit(1);
}

if (args.includes("--check")) {
  const code = flag("check");
  const answer = Access.read(code, secret);
  console.log(answer.ok ? `годен, партия ${answer.batch}: ${answer.code}` : `не годен (${answer.reason})`);
  process.exit(answer.ok ? 0 : 1);
}

const count = Number(args.find(a => /^\d+$/.test(a)) || 10);
const batch = Number(flag("batch") || 1);

/* Коды выпускаются криптографическим генератором: два одинаковых кода в
   одной поставке — испорченная поставка. */
const random = () => crypto.randomBytes(4).readUInt32BE(0) / 4294967296;

const codes = new Set();
while (codes.size < count) codes.add(Access.make(secret, batch, random));

codes.forEach(code => console.log(code));
const word = (n => {
  const t = n % 100, d = n % 10;
  if (t > 10 && t < 20) return "кодов";
  if (d === 1) return "код";
  if (d >= 2 && d <= 4) return "кода";
  return "кодов";
})(count);

console.error(`\n${count} ${word}, партия ${batch}. ` +
  (secret === "поменяйте-этот-секрет-перед-продажей"
    ? "ВНИМАНИЕ: секрет по умолчанию — поменяйте его в iq/config.js до первой продажи."
    : "Секрет взят из iq/config.js."));
