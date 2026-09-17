/** Геометрия фигур и отрисовка: без браузера, на чистых функциях. */
const { load, reporter } = require("./helpers.cjs");
const { Figures: F } = load(["figures.js"]);
const { ok, eq, done } = reporter();

const L = [[0, 0], [1, 0], [2, 0], [2, 1]];

eq("нормализация сдвигает к началу координат", F.normalize([[3, 5], [4, 5]]), [[0, 0], [1, 0]]);
eq("четыре поворота возвращают фигуру", F.rotate(F.rotate(F.rotate(F.rotate(L)))), F.normalize(L));
eq("двойное отражение возвращает фигуру", F.mirror(F.mirror(L)), F.normalize(L));
ok("поворот не равен исходной фигуре", JSON.stringify(F.rotate(L)) !== JSON.stringify(F.normalize(L)));
ok("зеркальная копия L не совпадает ни с одним поворотом", !F.isRotationOf(F.mirror(L), L));
ok("квадрат симметричен: его отражение — поворот", F.isRotationOf(F.mirror([[0, 0], [1, 0], [0, 1], [1, 1]]), [[0, 0], [1, 0], [0, 1], [1, 1]]));

/* Отрисовка: каждая фигура, каждая заливка, каждое количество. */
const shapes = ["circle", "square", "diamond", "triangle", "pentagon", "hexagon", "star", "cross", "arrow"];
let bad = 0;
shapes.forEach(shape =>
  ["outline", "solid", "core"].forEach(fill =>
    [1, 2, 3, 4, 5].forEach(count => {
      const svg = F.svg({ shape, count, fill, rotate: 30 });
      if (!svg.startsWith("<svg") || !svg.includes("</svg>") || svg.length < 80) {
        bad++;
        console.log("  не нарисовалось:", shape, fill, count);
      }
    })));
ok("все 135 сочетаний фигуры, заливки и количества рисуются", bad === 0);

ok("решётка рисует девять клеток", (F.svg({ grid: [1, 0, 1, 0, 1, 0, 1, 0, 1] }).match(/<rect/g) || []).length === 9);
ok("сетка 3x3 рисует восемь линий", (F.svg({ mesh: 3 }).match(/<line/g) || []).length === 8);

/* Башня из кубиков: три грани на кубик, порядок — от дальнего к ближнему. */
const stack = F.svg({ stack: [[2, 1], [1, 1]] });
ok("кубиков нарисовано ровно столько, сколько в карте высот", (stack.match(/<polygon/g) || []).length === 5 * 3);

ok("неизвестная фигура — это ошибка, а не пустая картинка", (() => {
  try { F.svg({ shape: "спираль", count: 1 }); return false; } catch (e) { return true; }
})());

done();
