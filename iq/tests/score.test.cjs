/**
 * Проверки подсчёта. Смысл не в том, что функция что-то возвращает, а в
 * том, что шкала ведёт себя как обещано: балл растёт с числом верных
 * ответов, средний человек получает около ста, а заявленный интервал
 * действительно накрывает истину примерно в 95 случаях из ста.
 */
const { load, reporter } = require("./helpers.cjs");
const { Tasks: T, Score: S } = load(["figures.js", "tasks.js", "score.js"]);
const { ok, done } = reporter();

const full = T.fullSet();
const demo = T.demoSet();

/* Управляемый генератор: проверки должны падать и проходить одинаково
   каждый запуск, а не через раз. */
let seed = 20260917;
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const normal = () => {
  let u = 0, v = 0;
  while (!u) u = rnd();
  while (!v) v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};
const mean = xs => xs.reduce((s, v) => s + v, 0) / xs.length;
const sd = xs => { const m = mean(xs); return Math.sqrt(mean(xs.map(v => (v - m) ** 2))); };

/** Ответы, где верны ровно первые n заданий по порядку. */
function answersFor(tasks, n) {
  const out = {};
  tasks.forEach((t, i) => { out[t.id] = i < n ? t.answer : (t.answer + 1) % 5; });
  return out;
}

/* Сложность заданий должна быть определена для всех долей решивших. */
ok("сложность считается для каждого задания", full.every(t => isFinite(S.difficulty(t.p))));
ok("задание, которое решают реже, — сложнее", S.difficulty(0.35) > S.difficulty(0.85));
ok("шанс угадать не даёт вероятности упасть ниже 1/5", S.chance(-6, 3) >= S.GUESS - 1e-9);

/* Балл не должен падать от лишнего верного ответа. */
let monotone = true, previous = -Infinity;
for (let n = 0; n <= full.length; n++) {
  const iq = S.grade(full, answersFor(full, n)).iqExact;
  if (iq < previous - 1e-9) monotone = false;
  previous = iq;
}
ok("каждый дополнительный верный ответ не понижает балл", monotone);

const none = S.grade(full, answersFor(full, 0));
const every = S.grade(full, answersFor(full, full.length));
ok("ноль верных даёт низкий край шкалы", none.iq <= 70, "получили " + none.iq);
ok("все верные дают высокий край", every.iq >= 125, "получили " + every.iq);
ok("край шкалы помечен как край", none.offScale && every.offScale);
ok("пропущенные задания считаются неверными", S.grade(full, {}).raw === 0);

/* Калибровка: люди с распределением N(100, 15) должны получать
   распределение около N(100, 15) — иначе шкала врёт. */
const scores = [], errors = [], covered = [];
for (let person = 0; person < 500; person++) {
  const theta = normal();
  const answers = {};
  full.forEach(t => { answers[t.id] = rnd() < S.chance(theta, S.difficulty(t.p)) ? t.answer : (t.answer + 1) % 5; });
  const result = S.grade(full, answers);
  scores.push(result.iqExact);
  errors.push(result.theta - theta);
  covered.push(100 + 15 * theta >= result.low && 100 + 15 * theta <= result.high);
}
ok("средний балл около 100", Math.abs(mean(scores) - 100) < 2.5, "получили " + mean(scores).toFixed(1));
ok("разброс баллов около 15", Math.abs(sd(scores) - 15) < 2.5, "получили " + sd(scores).toFixed(1));
ok("оценка не смещена", Math.abs(mean(errors)) < 0.1, "смещение " + mean(errors).toFixed(3));
ok("заявленный интервал накрывает истину примерно в 95% случаев",
  mean(covered.map(Number)) > 0.9, "накрыл в " + (mean(covered.map(Number)) * 100).toFixed(0) + "%");

/* Пробная часть обязана быть заметно менее точной, иначе полный тест
   продавать не за что. */
const demoWide = S.grade(demo, answersFor(demo, 4));
const fullWide = S.grade(full, answersFor(full, 24));
ok("по шести заданиям интервал шире, чем по тридцати шести",
  demoWide.high - demoWide.low > fullWide.high - fullWide.low,
  "демо " + (demoWide.high - demoWide.low) + ", полный " + (fullWide.high - fullWide.low));
ok("полный набор заданий информативнее пробного",
  S.precision(full, 0) < S.precision(demo, 0));

/* Разбор по блокам. */
const mixed = S.grade(full, answersFor(full, 20));
ok("в разборе есть все пять блоков", Object.keys(mixed.blocks).length === 5);
ok("сумма верных по блокам равна общему числу верных",
  Object.values(mixed.blocks).reduce((s, b) => s + b.correct, 0) === mixed.raw);
ok("процентиль лежит в границах", mixed.percentile > 0 && mixed.percentile < 100);
ok("сильный и слабый блоки названы", !!T.blockOf(mixed.strongest) && !!T.blockOf(mixed.weakest));
ok("средний человек решает около двадцати одного задания",
  Math.abs(mixed.expectedRaw - 21) < 1.5, "ожидание " + mixed.expectedRaw.toFixed(1));

/* Подписи диапазонов. */
ok("подпись диапазона не пустая ни при каком балле",
  [60, 85, 100, 115, 130, 150].every(iq => S.band(iq).length > 5));

done();
