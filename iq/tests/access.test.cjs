/**
 * Проверки кодов доступа. Что здесь важно: код, выпущенный продавцом,
 * обязан открываться на странице, а выдуманный — нет; опечатки в похожих
 * знаках не должны стоить покупателю денег.
 */
const crypto = require("crypto");
const { load, reporter } = require("./helpers.cjs");
const { Access: A } = load(["access.js"]);
const { ok, eq, done } = reporter();

const secret = "секрет-для-проверки";
const random = () => crypto.randomBytes(4).readUInt32BE(0) / 4294967296;

/* Выпущенные коды открываются, и номер партии доходит целым. */
let issued = [];
let badBatch = 0;
for (let batch = 0; batch < 12; batch++) {
  for (let i = 0; i < 40; i++) {
    const code = A.make(secret, batch, random);
    const answer = A.read(code, secret);
    if (!answer.ok || answer.batch !== batch) badBatch++;
    issued.push(code);
  }
}
ok("480 выпущенных кодов открываются и помнят свою партию", badBatch === 0, "сбоев " + badBatch);
ok("коды не повторяются", new Set(issued).size === issued.length);
ok("код выглядит как IQ-XXXX-XXXX-XXXX", /^IQ-[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(issued[0]), issued[0]);

/* Опечатки, которые делают люди, переписывая код с экрана на бумагу. */
const code = A.make(secret, 3, random);
ok("нижний регистр принимается", A.read(code.toLowerCase(), secret).ok);
ok("пробелы вместо дефисов принимаются", A.read(code.replace(/-/g, " "), secret).ok);
ok("код без префикса принимается", A.read(code.replace(/^IQ-/, ""), secret).ok);
ok("буква О вместо нуля принимается", A.read(code.replace(/0/g, "O"), secret).ok);
ok("буква I вместо единицы принимается", A.read(code.replace(/1/g, "I"), secret).ok);

/* И то, что приниматься не должно. */
ok("чужой секрет не подходит", !A.read(code, "другой секрет").ok);
eq("слишком короткий код отвергается по длине", A.read("IQ-ABC", secret).reason, "длина");
ok("испорченный знак ломает код", !A.read(code.slice(0, 5) + (code[5] === "A" ? "B" : "A") + code.slice(6), secret).ok);

/* Сколько кодов можно подобрать наугад: контрольная часть — 20 бит. */
let guessed = 0;
const tries = 50000;
for (let i = 0; i < tries; i++) {
  let attempt = "";
  for (let j = 0; j < 12; j++) attempt += A.ALPHABET[Math.floor(Math.random() * 32)];
  if (A.read(attempt, secret).ok) guessed++;
}
ok("наугад подбирается меньше одного кода на 10 000 попыток", guessed / tries < 0.0001,
  "подобралось " + guessed + " из " + tries);

/* Контрольная часть должна зависеть и от тела кода, и от секрета. */
ok("контрольная часть меняется вместе с секретом", A.checksum("AAAAAAAA", "один") !== A.checksum("AAAAAAAA", "два"));
ok("контрольная часть меняется вместе с телом кода", A.checksum("AAAAAAAA", secret) !== A.checksum("AAAAAAAB", secret));

/* Хеш не должен складывать разные строки в одно значение слишком часто. */
const seen = new Set();
for (let i = 0; i < 20000; i++) seen.add(A.hash("строка-" + i));
ok("хеш почти не склеивает разные строки", seen.size > 19990, "различных значений " + seen.size);

done();
