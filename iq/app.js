/**
 * ХОД ТЕСТА: витрина, задания, оплата, результат.
 *
 * Состояние живёт в localStorage: начатая попытка переживает случайное
 * закрытие вкладки, а открытый доступ — перезагрузку. Если хранилище
 * недоступно (приватное окно, файл с диска), всё работает, просто
 * незаконченная попытка не сохранится.
 */
(function () {
  "use strict";

  var CFG = window.IQ_CONFIG;
  var T = window.Tasks, S = window.Score, F = window.Figures, A = window.Access;
  var KEY = "iq.v1";

  function el(id) { return document.getElementById(id); }
  function esc(text) {
    return String(text).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function plural(n, one, few, many) {
    var t = n % 100, d = n % 10;
    if (t > 10 && t < 20) return many;
    if (d === 1) return one;
    if (d >= 2 && d <= 4) return few;
    return many;
  }

  /* ---------- хранилище ---------- */

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function write(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* приватное окно — переживём */ }
  }

  var store = read();
  var run = store.run || null;
  var clock = null;

  function save() { store.run = run; write(store); }

  /* ---------- экраны ---------- */

  var SCREENS = ["start", "test", "gate", "pay", "result"];

  function show(name) {
    SCREENS.forEach(function (s) { el("screen-" + s).hidden = s !== name; });
    var testing = name === "test";
    el("timer").hidden = !testing;
    el("count").hidden = !testing;
    if (!testing) el("progress").style.width = "0";
    window.scrollTo(0, 0);
  }

  /* ---------- витрина ---------- */

  function paintStart() {
    el("price").textContent = CFG.price + " ₽";
    el("go-buy").textContent = "Купить полный тест — " + CFG.price + " ₽";

    var counts = {};
    T.ALL.forEach(function (t) { counts[t.block] = (counts[t.block] || 0) + 1; });

    el("blocklist").innerHTML = T.BLOCKS.map(function (b, i) {
      var n = counts[b.id];
      return '<div class="blocklist__row">' +
        '<div class="blocklist__n num">' + (i + 1) + '</div>' +
        '<div><div class="blocklist__name">' + esc(b.name) + '</div>' +
        '<div class="blocklist__about">' + esc(b.about) + '</div></div>' +
        '<div class="blocklist__count num">' + n + " " + plural(n, "задание", "задания", "заданий") + '</div>' +
        '</div>';
    }).join("");

    el("foot").innerHTML =
      "Тест считает прямо в браузере: ответы никуда не отправляются и остаются на вашем устройстве. " +
      "Полный тест — " + CFG.minutesFull + " минут на " + T.ALL.length + " заданий, пробная часть — " +
      CFG.minutesDemo + " минут на " + T.DEMO.length + "." +
      (CFG.contact ? "<br>Вопросы и коды доступа: " + esc(CFG.contact) : "");

    if (store.unlocked) {
      el("go-buy").textContent = "Начать полный тест";
      el("go-demo").classList.remove("btn--primary");
      el("go-buy").classList.add("btn--primary");
    }
  }

  /* ---------- задания ---------- */

  function minutesFor(mode) { return mode === "demo" ? CFG.minutesDemo : CFG.minutesFull; }

  function begin(mode) {
    var set = mode === "demo" ? T.demoSet() : T.fullSet();
    run = {
      mode: mode,
      ids: set.map(function (t) { return t.id; }),
      idx: 0,
      answers: {},
      startedAt: Date.now(),
      endsAt: Date.now() + minutesFor(mode) * 60000
    };
    save();
    show("test");
    paintTask();
    startClock();
  }

  function current() { return T.byId(run.ids[run.idx]); }

  /** Картинка задания: числовой ряд, матрица 3x3 или отдельная фигура. */
  function body(task) {
    if (task.row) {
      return '<div class="row">' +
        task.row.map(function (v) { return '<div class="row__cell num">' + v + "</div>"; }).join("") +
        '<div class="row__cell row__cell--ask">?</div></div>';
    }
    if (task.rule) {
      var cells = "", r, c;
      for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) {
        cells += (r === 2 && c === 2)
          ? '<div class="matrix__cell matrix__cell--ask">?</div>'
          : '<div class="matrix__cell">' + F.svg(task.rule(r, c)) + "</div>";
      }
      return '<div class="matrix">' + cells + "</div>";
    }
    if (task.figure) return '<div class="figbox">' + F.svg(task.figure) + "</div>";
    return "";
  }

  function paintTask() {
    var task = current();
    var chosen = run.answers[task.id];
    var block = T.blockOf(task.block);

    el("q").innerHTML =
      '<div class="q__head">' +
        '<div class="q__no">Задание ' + (run.idx + 1) + " из " + run.ids.length + "</div>" +
        '<div class="q__block">' + esc(block.name) + "</div>" +
      "</div>" +
      '<div class="q__ask">' + esc(task.ask) + "</div>" +
      body(task) +
      '<div class="opts ' + (task.kind === "figure" ? "opts--fig" : "") + '" id="opts">' +
        task.options.map(function (opt, i) {
          var inner = task.kind === "figure" ? F.svg(opt) : '<div class="opt__text">' + esc(opt) + "</div>";
          return '<button class="opt ' + (chosen === i ? "opt--on" : "") + '" data-pick="' + i + '">' +
            '<div class="opt__key">' + "АБВГД"[i] + "</div>" + inner + "</button>";
        }).join("") +
      "</div>";

    var last = run.idx === run.ids.length - 1;
    el("nav").innerHTML =
      (run.idx > 0 ? '<button class="btn" data-go="prev">Назад</button>' : "") +
      '<button class="btn btn--primary" data-go="next">' + (last ? "Завершить" : "Дальше") + "</button>";

    el("dots").innerHTML = run.ids.map(function (id, i) {
      var cls = "dot" + (run.answers[id] !== undefined ? " dot--done" : "") + (i === run.idx ? " dot--now" : "");
      return '<button class="' + cls + '" data-jump="' + i + '">' + (i + 1) + "</button>";
    }).join("");

    el("count").textContent = countDone() + " / " + run.ids.length;
    el("progress").style.width = ((run.idx) / run.ids.length * 100).toFixed(1) + "%";
  }

  function countDone() {
    return run.ids.filter(function (id) { return run.answers[id] !== undefined; }).length;
  }

  function pick(i) {
    run.answers[current().id] = i;
    save();
    paintTask();
  }

  function step(delta) {
    var next = run.idx + delta;
    if (next < 0) return;
    if (next >= run.ids.length) return finish();
    run.idx = next;
    save();
    paintTask();
  }

  /* ---------- часы ---------- */

  function startClock() {
    stopClock();
    tick();
    clock = setInterval(tick, 500);
  }
  function stopClock() { if (clock) { clearInterval(clock); clock = null; } }

  function tick() {
    if (!run) return stopClock();
    var left = Math.max(0, run.endsAt - Date.now());
    var mm = Math.floor(left / 60000), ss = Math.floor(left % 60000 / 1000);
    var box = el("timer");
    box.textContent = mm + ":" + (ss < 10 ? "0" : "") + ss;
    box.classList.toggle("timer--low", left < 60000);
    if (left <= 0) finish(true);
  }

  /* ---------- итог ---------- */

  function finish(byTime) {
    stopClock();
    var set = run.ids.map(T.byId);
    var result = S.grade(set, run.answers);
    result.mode = run.mode;
    result.byTime = !!byTime;
    result.seconds = Math.round((Date.now() - run.startedAt) / 1000);
    result.answers = run.answers;
    result.ids = run.ids;

    run = null;
    store.last = { at: Date.now(), mode: result.mode, iq: result.iq, low: result.low, high: result.high };
    save();

    if (result.mode === "demo") paintGate(result); else paintResult(result);
  }

  function timeText(seconds) {
    var m = Math.floor(seconds / 60), s = seconds % 60;
    if (!m) return s + " " + plural(s, "секунда", "секунды", "секунд");
    return m + " " + plural(m, "минута", "минуты", "минут") + " " + s + " с";
  }

  /* ---------- после пробной части ---------- */

  function paintGate(result) {
    /* Обещание «станет точнее» проверяемо: показываем ширину интервала
       сейчас и ту, что даёт полный набор заданий при той же способности.
       Формула на краях шкалы осторожна — обещает меньше, чем выходит. */
    var nowWide = result.high - result.low;
    var thenWide = Math.round(2 * S.precision(T.fullSet(), result.theta));

    el("screen-gate").innerHTML =
      '<div class="score">' +
        '<div class="score__label">Предварительная оценка</div>' +
        '<div class="score__value num">' + result.iq + "</div>" +
        '<div class="score__range">и это точно не точка, а диапазон ' + result.low + "–" + result.high + "</div>" +
      "</div>" +
      scaleHtml(result) +
      '<div class="card">' +
        "<p class=\"plate__text\">Верно " + result.raw + " из " + result.total +
        ". Интервал сейчас — " + nowWide + " " + plural(nowWide, "пункт", "пункта", "пунктов") +
        ". Это не осторожность, а арифметика: чем меньше заданий, тем больше в ответе роли случая. " +
        (thenWide < nowWide
          ? "На всех " + T.ALL.length + " заданиях он был бы уже — около " +
            thenWide + " " + plural(thenWide, "пункта", "пунктов", "пунктов") + "."
          : "Полный тест считает по " + T.ALL.length + " заданиям вместо шести.") + "</p>" +
      "</div>" +
      '<h2>Что открывает полный тест</h2>' +
      '<div class="grid grid--2">' +
        plate("Все " + T.ALL.length + " заданий", "Пять блоков целиком, включая сложные матрицы и ряды, которых нет в пробной части.") +
        plate("Балл с узким интервалом", "Тот же расчёт, но заданий в шесть раз больше — результат становится осмысленным.") +
        plate("Разбор каждого задания", "Ваш ответ, верный ответ и объяснение — по всем заданиям.") +
        plate("Карта по блокам", "Где вы выше среднего, а где ниже: ряды, слова, матрицы, пространство, логика.") +
      "</div>" +
      '<div class="actions" style="margin-top:28px">' +
        '<button class="btn btn--primary" data-act="buy">Купить полный тест — ' + CFG.price + " ₽</button>" +
        '<button class="btn" data-act="review">Разбор пробных заданий</button>' +
      "</div>" +
      '<div id="gate-review"></div>';

    el("screen-gate").onclick = function (e) {
      var act = e.target.closest("[data-act]");
      if (!act) return;
      if (act.dataset.act === "buy") return paintPay();
      el("gate-review").innerHTML = "<h2>Разбор пробных заданий</h2>" + reviewHtml(result);
      act.remove();
    };

    show("gate");
  }

  function plate(title, text) {
    return '<div class="plate"><div class="plate__title">' + esc(title) +
      '</div><div class="plate__text">' + esc(text) + "</div></div>";
  }

  /* ---------- оплата ---------- */

  function paintPay() {
    el("screen-pay").innerHTML =
      '<div class="pay">' +
        '<div class="kicker">Полный доступ</div>' +
        "<h1>" + CFG.price + " ₽ — один раз</h1>" +
        '<p class="lead">Оплата открывает все ' + T.ALL.length +
          " заданий и разбор. Доступ остаётся в этом браузере — код вводится один раз.</p>" +

        '<div class="steps">' +
          step2(1, "Оплатите" + (CFG.payUrl ? " по кнопке ниже" : "") + " — " + CFG.price + " ₽.") +
          step2(2, "Получите <b>код доступа</b>" + (CFG.contact ? " — " + esc(CFG.contact) : "") + ".") +
          step2(3, "Введите код здесь, и тест откроется.") +
        "</div>" +

        (CFG.payUrl
          ? '<a class="btn btn--primary btn--wide" href="' + esc(CFG.payUrl) + '" target="_blank" rel="noopener">Оплатить ' + CFG.price + " ₽</a>"
          : '<div class="card"><p class="plate__text">Ссылка на оплату не настроена. ' +
            "Владельцу страницы: впишите её в <b>iq/config.js</b>, поле <b>payUrl</b>.</p></div>") +

        '<div class="code">' +
          '<input class="code__input" id="code-input" placeholder="IQ-XXXX-XXXX-XXXX" spellcheck="false" autocomplete="off" aria-label="Код доступа">' +
          '<button class="btn" id="code-go">Открыть доступ</button>' +
        "</div>" +
        '<div class="code__msg" id="code-msg"></div>' +

        '<hr class="hr">' +
        '<p class="note">Оплата даёт доступ к заданиям и разбору — не к определённому баллу. ' +
        "Балл зависит только от ваших ответов, и результат может оказаться любым.</p>" +
        '<div class="actions" style="margin-top:22px">' +
          '<button class="btn" data-act="back">Назад</button>' +
        "</div>" +
      "</div>";

    var input = el("code-input");
    el("code-go").onclick = tryCode;
    input.onkeydown = function (e) { if (e.key === "Enter") tryCode(); };
    el("screen-pay").onclick = function (e) {
      if (e.target.closest('[data-act="back"]')) show(store.lastScreen || "start");
    };
    show("pay");
    input.focus();

    function tryCode() {
      var msg = el("code-msg");
      var answer = A.read(input.value, CFG.secret);
      if (!answer.ok) {
        msg.className = "code__msg code__msg--bad";
        msg.textContent = answer.reason === "длина"
          ? "В коде 12 знаков — похоже, часть потерялась."
          : "Такой код не подходит. Проверьте, не перепутаны ли знаки.";
        return;
      }
      store.unlocked = true;
      store.code = answer.code;
      write(store);
      msg.className = "code__msg code__msg--ok";
      msg.textContent = "Доступ открыт. Начинаем.";
      setTimeout(function () { begin("full"); }, 500);
    }

    function step2(n, text) {
      return '<div class="step"><div class="step__n num">' + n + '</div><div class="step__text">' + text + "</div></div>";
    }
  }

  /* ---------- результат ---------- */

  function scaleHtml(result) {
    var lo = 55, hi = 155, span = hi - lo;
    var at = function (v) { return ((Math.max(lo, Math.min(hi, v)) - lo) / span * 100).toFixed(1) + "%"; };
    var ticks = [70, 85, 100, 115, 130];
    return '<div class="scale">' +
      '<div class="scale__track"></div>' +
      '<div class="scale__span" style="left:' + at(result.low) + ";right:" + (100 - parseFloat(at(result.high))).toFixed(1) + '%"></div>' +
      '<div class="scale__pin" style="left:' + at(result.iq) + '"></div>' +
      ticks.map(function (t) { return '<div class="scale__tick num" style="left:' + at(t) + '">' + t + "</div>"; }).join("") +
      "</div>";
  }

  function reviewHtml(result) {
    return '<div class="review">' + result.ids.map(function (id, i) {
      var task = T.byId(id);
      var given = result.answers[id];
      var ok = given === task.answer;
      var shown = given === undefined ? "нет ответа" : task.kind === "figure" ? "вариант " + "АБВГД"[given] : task.options[given];
      var right = task.kind === "figure" ? "вариант " + "АБВГД"[task.answer] : task.options[task.answer];
      return '<div class="review__item">' +
        '<div class="review__head">' +
          '<div class="review__no num">' + (i + 1) + "</div>" +
          '<div class="review__mark ' + (ok ? "review__mark--ok" : "review__mark--bad") + '">' + (ok ? "верно" : "неверно") + "</div>" +
          '<div class="review__no">' + esc(T.blockOf(task.block).name) + "</div>" +
        "</div>" +
        '<div class="review__ask">' + esc(task.ask) +
          (task.row ? " <span class=\"num\">" + task.row.join(", ") + ", ?</span>" : "") + "</div>" +
        (task.kind === "figure"
          ? '<div class="review__fig">' + F.svg(task.options[task.answer]) +
            (!ok && given !== undefined ? F.svg(task.options[given]) : "") + "</div>"
          : "") +
        '<div class="review__given">Ваш ответ: ' + esc(shown) + (ok ? "" : " · верно: " + esc(right)) + "</div>" +
        '<div class="review__why">' + esc(task.why) + "</div>" +
      "</div>";
    }).join("") + "</div>";
  }

  function paintResult(result) {
    var blocks = T.BLOCKS.filter(function (b) { return result.blocks[b.id]; });

    el("screen-result").innerHTML =
      '<div class="score">' +
        '<div class="score__label">Ваш балл</div>' +
        '<div class="score__value num">' + result.iq + "</div>" +
        '<div class="score__range">диапазон ' + result.low + "–" + result.high + " · " + esc(S.band(result.iq)) + "</div>" +
        (result.offScale ? '<div class="score__range">шкала упёрлась в край: заданий такой сложности не хватает, чтобы различить дальше</div>' : "") +
      "</div>" +
      scaleHtml(result) +

      '<div class="stats">' +
        stat(result.raw + " из " + result.total, "верных ответов") +
        stat(result.percentile.toFixed(0) + " %", "процентиль: выше стольких людей") +
        stat("1 из " + result.rarity, result.percentile >= 50 ? "такой результат или выше" : "такой результат или ниже") +
      "</div>" +

      '<p class="note">Средний человек решает ' + result.expectedRaw.toFixed(0) + " из " + result.total +
      ". Времени потрачено: " + timeText(result.seconds) + (result.byTime ? " — время вышло, оставшиеся задания засчитаны как неверные." : ".") + "</p>" +

      "<h2>По блокам</h2>" +
      blocks.map(function (b) {
        var d = result.blocks[b.id];
        return '<div class="blockrow">' +
          '<div class="blockrow__head">' +
            '<div class="blockrow__name">' + esc(b.name) + "</div>" +
            '<div class="blockrow__count num">' + d.correct + " из " + d.total + "</div>" +
          "</div>" +
          '<div class="blockrow__meter"><div class="blockrow__fill" style="width:' + (d.share * 100).toFixed(0) + '%"></div>' +
            '<div class="blockrow__mark" style="left:' + (d.expected / d.total * 100).toFixed(0) + '%"></div></div>' +
          '<div class="blockrow__verdict">' + esc(d.verdict) + " · среднему по силам " + d.expected.toFixed(1) + " (отметка на шкале)</div>" +
        "</div>";
      }).join("") +

      '<p class="note" style="margin-top:14px">Сильнее всего — ' + esc(T.blockOf(result.strongest).name) +
      ", слабее — " + esc(T.blockOf(result.weakest).name) + ".</p>" +

      "<h2>Разбор заданий</h2>" +
      reviewHtml(result) +

      '<div class="actions" style="margin-top:28px">' +
        '<button class="btn btn--primary" data-act="card">Скачать карточку результата</button>' +
        '<button class="btn" data-act="again">Пройти заново</button>' +
      "</div>" +
      '<p class="note" style="margin-top:14px">Повторное прохождение завышает балл: задания уже знакомы. ' +
      "Если хотите проверить себя честно, вернитесь к тесту не раньше чем через несколько месяцев.</p>" +
      '<hr class="hr"><div class="foot">Расчёт идёт по модели с тремя параметрами: сложность задания, ' +
      "шанс угадать один из пяти вариантов и ваша расстановка ответов. Балл — обоснованная оценка, " +
      "а не медицинское заключение.</div>";

    el("screen-result").onclick = function (e) {
      var act = e.target.closest("[data-act]");
      if (!act) return;
      if (act.dataset.act === "card") return card(result);
      if (act.dataset.act === "again") return begin(store.unlocked ? "full" : "demo");
    };

    show("result");

    function stat(value, label) {
      return '<div class="stat"><div class="stat__value num">' + esc(value) + '</div><div class="stat__label">' + esc(label) + "</div></div>";
    }
  }

  /* ---------- карточка результата ----------
     Рисуется как SVG и переводится в PNG через canvas: файл можно
     сохранить или отправить, и он не зависит от шрифтов страницы. */

  function card(result) {
    var W = 1080, H = 1080, x = 96;
    var rows = T.BLOCKS.filter(function (b) { return result.blocks[b.id]; });
    var y0 = 660;

    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '">' +
      '<rect width="' + W + '" height="' + H + '" fill="#0b1120"/>' +
      '<rect x="40" y="40" width="' + (W - 80) + '" height="' + (H - 80) + '" rx="34" fill="none" stroke="#1d2a44" stroke-width="2"/>' +
      text(x, 150, "ИНДЕКС · ТЕСТ IQ", 26, "#5d789f", 700, ".22em") +
      text(x, 330, String(result.iq), 210, "#eef2fb", 800, "-.05em") +
      text(x, 390, "диапазон " + result.low + "–" + result.high + " · " + S.band(result.iq), 30, "#93a0bd", 500) +
      text(x, 470, "верных " + result.raw + " из " + result.total + " · выше " + result.percentile.toFixed(0) + " % людей", 30, "#93a0bd", 500) +
      '<line x1="' + x + '" y1="540" x2="' + (W - x) + '" y2="540" stroke="#1d2a44" stroke-width="2"/>' +
      text(x, 600, "ПО БЛОКАМ", 22, "#5d789f", 700, ".2em") +
      rows.map(function (b, i) {
        var d = result.blocks[b.id];
        var y = y0 + i * 66;
        return text(x, y, b.name, 28, "#eef2fb", 500) +
          '<rect x="' + (x + 330) + '" y="' + (y - 22) + '" width="420" height="16" rx="8" fill="#141f36"/>' +
          '<rect x="' + (x + 330) + '" y="' + (y - 22) + '" width="' + (420 * d.share).toFixed(0) + '" height="16" rx="8" fill="#7f9fd8"/>' +
          text(W - x, y, d.correct + "/" + d.total, 28, "#93a0bd", 600, null, "end");
      }).join("") +
      text(x, H - 96, new Date().toLocaleDateString("ru-RU") + " · оценка по 36 заданиям, не медицинское заключение", 22, "#5d6982", 500) +
      "</svg>";

    var blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var img = new Image();
    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = W; canvas.height = H;
      canvas.getContext("2d").drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob(function (png) {
        var a = document.createElement("a");
        a.href = URL.createObjectURL(png);
        a.download = "iq-" + result.iq + ".png";
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      }, "image/png");
    };
    img.onerror = function () { URL.revokeObjectURL(url); };
    img.src = url;

    function text(px, py, value, size, color, weight, spacing, anchor) {
      return '<text x="' + px + '" y="' + py + '" fill="' + color + '" font-size="' + size +
        '" font-weight="' + weight + '" font-family="Inter, Helvetica, Arial, sans-serif"' +
        (spacing ? ' letter-spacing="' + spacing + '"' : "") +
        (anchor ? ' text-anchor="' + anchor + '"' : "") + ">" + esc(value) + "</text>";
    }
  }

  /* ---------- события ---------- */

  el("go-demo").onclick = function () { begin("demo"); };
  el("go-buy").onclick = function () {
    store.lastScreen = "start";
    if (store.unlocked) begin("full"); else paintPay();
  };

  el("screen-test").onclick = function (e) {
    var opt = e.target.closest("[data-pick]");
    if (opt) return pick(Number(opt.dataset.pick));
    var go = e.target.closest("[data-go]");
    if (go) return step(go.dataset.go === "next" ? 1 : -1);
    var jump = e.target.closest("[data-jump]");
    if (jump) { run.idx = Number(jump.dataset.jump); save(); paintTask(); }
  };

  document.addEventListener("keydown", function (e) {
    if (!run || el("screen-test").hidden) return;
    if (e.key >= "1" && e.key <= "5") {
      var i = Number(e.key) - 1;
      if (i < current().options.length) pick(i);
    } else if (e.key === "Enter" || e.key === "ArrowRight") step(1);
    else if (e.key === "ArrowLeft") step(-1);
  });

  /* ---------- запуск ---------- */

  paintStart();

  if (run && run.endsAt > Date.now()) {
    /* незаконченная попытка: возвращаем человека туда, где он остановился */
    show("test");
    paintTask();
    startClock();
  } else {
    if (run) { run = null; save(); }
    show("start");
  }
})();
