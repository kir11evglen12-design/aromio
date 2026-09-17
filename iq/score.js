/**
 * ПОДСЧЁТ БАЛЛА.
 *
 * Считать «сколько верно из 36» и объявлять это интеллектом нечестно: одно
 * задание не равно другому. Здесь работает обычная для тестирования модель
 * с тремя параметрами (3PL): у каждого задания своя сложность, а у любого
 * задания с пятью вариантами есть шанс 1/5 быть угаданным.
 *
 *   p(верно | способность) = 0.2 + 0.8 / (1 + exp(-1.7 (способность - сложность)))
 *
 * Сложность задания выводится из его `p` — доли людей, решающих задание
 * верно. Способность подбирается так, чтобы она лучше всего объясняла
 * именно вашу расстановку ответов: три верных сложных задания весят больше,
 * чем три верных лёгких.
 *
 * Дальше способность переводится в привычную шкалу: 100 — середина,
 * 15 — одно стандартное отклонение. Заодно считается погрешность: она
 * честно показывает, что по шести заданиям диапазон широкий, а по
 * тридцати шести — уже узкий. Ни один тест из браузера не даёт точку,
 * все дают диапазон; здесь он хотя бы написан.
 *
 * Чего эта математика не делает: она не превращает страницу в клинический
 * инструмент. Нормы взяты из оценок сложности заданий, а не из выборки
 * населения — об этом прямо сказано и в интерфейсе.
 */
(function (global) {
  "use strict";

  var GUESS = 0.2;     /* пять вариантов — один шанс из пяти */
  var SLOPE = 1.0;     /* насколько резко задание разделяет людей */
  var D = 1.7;         /* переводит логистику в шкалу нормального распределения */
  var LIMIT = 4;       /* дальше 4 стандартных отклонений шкала не идёт */

  /** Сложность задания из доли решивших. */
  function difficulty(p) {
    var q = (1 - GUESS) / (p - GUESS) - 1;
    return Math.log(q) / (D * SLOPE);
  }

  /** Вероятность верного ответа при данной способности. */
  function chance(theta, b) {
    return GUESS + (1 - GUESS) / (1 + Math.exp(-D * SLOPE * (theta - b)));
  }

  /** Информация задания — сколько оно сообщает о человеке с такой способностью. */
  function info(theta, b) {
    var p = chance(theta, b);
    var part = (p - GUESS) / (1 - GUESS);
    return Math.pow(D * SLOPE, 2) * part * part * (1 - p) / p;
  }

  function logLikelihood(theta, items) {
    var sum = 0, i, p;
    for (i = 0; i < items.length; i++) {
      p = chance(theta, items[i].b);
      sum += items[i].correct ? Math.log(p) : Math.log(1 - p);
    }
    return sum;
  }

  /**
   * Способность — среднее по апостериорному распределению, с обычным
   * априорным N(0, 1): люди распределены вокруг середины.
   *
   * Простой подбор «при какой способности ответы вероятнее всего» здесь не
   * годится: на 36 заданиях он завышает края — при всех верных ответах
   * уходит в бесконечность, а разброс оценок получается 20 пунктов вместо
   * 15. Априорное распределение возвращает оценку к середине ровно
   * настолько, насколько её не подтверждают ответы, и заодно даёт
   * погрешность из той же арифметики, а не из отдельной формулы.
   */
  function posterior(items) {
    var step = 0.01, weights = [], grid = [], t, w, peak = -Infinity, sum = 0, mean = 0, varSum = 0, i;

    for (t = -LIMIT - 0.5; t <= LIMIT + 0.5 + 1e-9; t += step) {
      grid.push(t);
      weights.push(logLikelihood(t, items) - t * t / 2);
    }
    /* вычитаем максимум перед экспонентой, иначе длинный тест уводит всё в ноль */
    for (i = 0; i < weights.length; i++) peak = Math.max(peak, weights[i]);
    for (i = 0; i < weights.length; i++) { weights[i] = Math.exp(weights[i] - peak); sum += weights[i]; }
    for (i = 0; i < weights.length; i++) { weights[i] /= sum; mean += grid[i] * weights[i]; }
    for (i = 0; i < weights.length; i++) varSum += Math.pow(grid[i] - mean, 2) * weights[i];

    return { theta: mean, sd: Math.sqrt(varSum) };
  }

  /** Только оценка способности — без погрешности. */
  function estimate(items) { return posterior(items).theta; }

  /** Стандартное нормальное распределение — для процентиля. */
  function normalCdf(z) {
    var t = 1 / (1 + 0.2316419 * Math.abs(z));
    var d = 0.3989422804014327 * Math.exp(-z * z / 2);
    var p = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    return z > 0 ? 1 - p : p;
  }

  /**
   * answers — объект { идентификатор задания: номер выбранного варианта }.
   * Пропущенное задание считается решённым неверно: время — часть теста.
   */
  function grade(tasks, answers) {
    var items = tasks.map(function (t) {
      return {
        id: t.id,
        block: t.block,
        b: difficulty(t.p),
        p: t.p,
        given: answers[t.id],
        correct: answers[t.id] === t.answer
      };
    });

    var raw = items.filter(function (i) { return i.correct; }).length;
    var posted = posterior(items);
    var theta = posted.theta;
    var se = posted.sd;

    var iqExact = 100 + 15 * theta;
    var margin = 1.96 * 15 * se;

    var blocks = {};
    items.forEach(function (i) {
      var b = blocks[i.block] || (blocks[i.block] = { total: 0, correct: 0, expected: 0, spread: 0 });
      b.total++;
      b.correct += i.correct ? 1 : 0;
      b.expected += i.p;
      b.spread += i.p * (1 - i.p);
    });

    Object.keys(blocks).forEach(function (key) {
      var b = blocks[key];
      var sd = Math.sqrt(b.spread) || 1;
      b.z = (b.correct - b.expected) / sd;
      b.verdict = b.z >= 0.6 ? "выше среднего" : b.z <= -0.6 ? "ниже среднего" : "на уровне среднего";
      b.share = b.correct / b.total;
    });

    var ranked = Object.keys(blocks).sort(function (a, b) { return blocks[b].z - blocks[a].z; });

    return {
      raw: raw,
      total: items.length,
      theta: theta,
      iq: Math.round(clamp(iqExact)),
      iqExact: iqExact,
      low: Math.round(clamp(iqExact - margin)),
      high: Math.round(clamp(iqExact + margin)),
      offScale: raw === items.length || raw === 0,
      se: se,
      percentile: Math.min(99.9, Math.max(0.1, normalCdf(theta) * 100)),
      rarity: rarity(normalCdf(theta)),
      items: items,
      blocks: blocks,
      strongest: ranked[0],
      weakest: ranked[ranked.length - 1],
      expectedRaw: items.reduce(function (s, i) { return s + i.p; }, 0)
    };
  }

  function clamp(iq) { return Math.max(60, Math.min(150, iq)); }

  /**
   * Во сколько раз один набор заданий точнее другого. Считается по
   * информации, которую несут задания, и годится именно для сравнения
   * «шесть заданий против тридцати шести»: обещать по этой формуле
   * конкретную ширину интервала нельзя — она выходит оптимистичнее, чем
   * настоящая апостериорная. Настоящую даёт `grade`, и в результате
   * показана именно она.
   */
  function precision(tasks, theta) {
    var information = tasks.reduce(function (sum, t) { return sum + info(theta, difficulty(t.p)); }, 0);
    return 1.96 * 15 / Math.sqrt(information + 1); /* +1 — вклад априорного распределения */
  }

  /** «Такой результат у одного человека из N» — понятнее, чем процентиль. */
  function rarity(share) {
    var rest = share > 0.5 ? 1 - share : share;
    if (rest <= 0) return 1000;
    var n = Math.round(1 / rest);
    if (n >= 1000) return 1000;
    if (n >= 100) return Math.round(n / 50) * 50;
    if (n >= 20) return Math.round(n / 5) * 5;
    return n;
  }

  /** Короткая расшифровка диапазона — без лести и без приговора. */
  function band(iq) {
    if (iq >= 130) return "очень высокий диапазон";
    if (iq >= 120) return "высокий диапазон";
    if (iq >= 110) return "выше среднего";
    if (iq >= 90) return "средний диапазон";
    if (iq >= 80) return "ниже среднего";
    return "низкий диапазон";
  }

  var api = {
    GUESS: GUESS, difficulty: difficulty, chance: chance, info: info,
    posterior: posterior, estimate: estimate, grade: grade, band: band,
    normalCdf: normalCdf, precision: precision
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.Score = api;
})(typeof window !== "undefined" ? window : globalThis);
