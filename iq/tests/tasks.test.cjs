/**
 * Проверки заданий. Главная из них — про матрицы: правильный вариант
 * должен совпадать с тем, что выдаёт правило матрицы для закрытой клетки.
 * Это единственная защита от ошибки, которую иначе заметил бы покупатель,
 * а не автор.
 */
const { load, reporter } = require("./helpers.cjs");
const { Tasks: T, Figures: F } = load(["figures.js", "tasks.js"]);
const { ok, eq, done } = reporter();

const all = T.ALL;

ok("заданий 36", all.length === 36, "их " + all.length);
eq("блоков пять", T.BLOCKS.length, 5);

const ids = all.map(t => t.id);
ok("идентификаторы не повторяются", new Set(ids).size === ids.length);

let broken = [];
all.forEach(t => {
  const say = m => broken.push(t.id + ": " + m);
  if (!t.ask || t.ask.length < 10) say("нет вопроса");
  if (!Array.isArray(t.options) || t.options.length !== 5) say("вариантов не пять");
  if (!(t.answer >= 0 && t.answer < 5)) say("номер ответа вне 0..4");
  if (!t.why || t.why.length < 20) say("нет объяснения");
  if (!(t.p > 0.25 && t.p <= 0.95)) say("доля решивших вне 0.25..0.95 — модель не примет");
  if (!T.blockOf(t.block)) say("неизвестный блок");
  if (t.kind !== "text" && t.kind !== "figure") say("непонятный вид задания");
  const seen = t.options.map(o => JSON.stringify(o));
  if (new Set(seen).size !== seen.length) say("варианты повторяются");
});
ok("у каждого задания вопрос, пять разных вариантов, ответ, объяснение и доля решивших", broken.length === 0, broken.join("\n      "));

/* Матрицы: ответ собирается правилом, а не проставлен рукой. */
let matrixBad = [];
all.filter(t => t.rule).forEach(t => {
  const wanted = JSON.stringify(t.rule(2, 2));
  const given = JSON.stringify(t.options[t.answer]);
  if (wanted !== given) matrixBad.push(t.id + ": правило даёт " + wanted + ", отмечен " + given);
  const matches = t.options.filter(o => JSON.stringify(o) === wanted).length;
  if (matches !== 1) matrixBad.push(t.id + ": верных вариантов " + matches + ", должен быть один");
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
    try { F.svg(t.rule(r, c)); } catch (e) { matrixBad.push(t.id + ": клетка " + r + "," + c + " не рисуется — " + e.message); }
  }
});
ok("во всех восьми матрицах отмеченный вариант совпадает с правилом", matrixBad.length === 0, matrixBad.join("\n      "));

/* Поворот полимино: верный вариант — поворот образца, остальные — нет. */
const turn = T.byId("p3");
const sample = turn.figure.cells;
ok("в задании на поворот верный вариант — поворот образца", F.isRotationOf(turn.options[turn.answer].cells, sample));
ok("остальные варианты — зеркальные, а не повёрнутые",
  turn.options.every((o, i) => i === turn.answer || !F.isRotationOf(o.cells, sample)));

/* Счётные задания: ответ должен сходиться с картинкой, а не с памятью автора. */
const cubes = T.byId("p2");
const drawn = cubes.figure.stack.reduce((sum, col) => sum + col.reduce((s, h) => s + h, 0), 0);
ok("в задании про кубики нарисовано столько же, сколько в ответе",
  String(drawn) === cubes.options[cubes.answer], "нарисовано " + drawn + ", в ответе " + cubes.options[cubes.answer]);

const missing = T.byId("p5");
const built = missing.figure.stack.reduce((sum, col) => sum + col.reduce((s, h) => s + h, 0), 0);
ok("в задании про достройку куба ответ равен 27 минус нарисованное",
  String(27 - built) === missing.options[missing.answer], "нарисовано " + built);

/* Пробная часть. */
ok("в пробной части шесть заданий", T.DEMO.length === 6);
ok("все пробные задания существуют", T.DEMO.every(id => T.byId(id)));
ok("пробная часть покрывает все пять блоков",
  new Set(T.demoSet().map(t => t.block)).size === T.BLOCKS.length);

/* Порядок по сложности — иначе тест начинается с самого трудного. */
let unordered = [];
T.BLOCKS.forEach(b => {
  const block = all.filter(t => t.block === b.id);
  block.forEach((t, i) => {
    if (i && block[i - 1].p < t.p - 0.12) unordered.push(b.id + ": " + t.id + " легче предыдущего");
  });
});
ok("внутри блока задания идут от простых к сложным", unordered.length === 0, unordered.join("\n      "));

done();
