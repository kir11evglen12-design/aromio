/**
 * ФИГУРЫ — рисование заданий.
 *
 * Матричные задания описаны не картинками, а правилом: клетка (строка,
 * столбец) — это объект-спецификация, а правило само выдаёт её для любой
 * клетки, включая ту, что закрыта знаком вопроса. Поэтому «правильный
 * вариант» не проставлен рукой: тест сверяет вариант ответа с тем, что
 * выдаёт правило для последней клетки. Рукой проставленный ответ рано или
 * поздно разошёлся бы с картинкой — здесь разойтись нечему.
 *
 * Здесь же чистая геометрия полимино (повороты, отражения) — её тоже
 * проверяют тестами, без браузера.
 */
(function (global) {
  "use strict";

  /* ---------- спецификация клетки ----------
     { shape, count, fill, rotate, scale }  — фигуры
     { grid: [9 бит] }                      — решётка 3x3
     { mesh: n }                            — сетка n x n
     { cells: [[x,y], ...] }                — полимино
     { stack: [[высоты], ...] }             — башня из кубиков
  */

  var INK = "currentColor";

  /** Точки правильного многоугольника: n вершин, первая — вверху. */
  function polygon(cx, cy, r, n, turn) {
    var pts = [], i, a;
    for (i = 0; i < n; i++) {
      a = (Math.PI * 2 * i) / n - Math.PI / 2 + (turn || 0);
      pts.push((cx + r * Math.cos(a)).toFixed(2) + "," + (cy + r * Math.sin(a)).toFixed(2));
    }
    return pts.join(" ");
  }

  /** Звезда: пять лучей, внутренний радиус — 0.42 внешнего. */
  function star(cx, cy, r) {
    var pts = [], i, a, rad;
    for (i = 0; i < 10; i++) {
      a = (Math.PI * i) / 5 - Math.PI / 2;
      rad = i % 2 ? r * 0.42 : r;
      pts.push((cx + rad * Math.cos(a)).toFixed(2) + "," + (cy + rad * Math.sin(a)).toFixed(2));
    }
    return pts.join(" ");
  }

  /** Крест: плюс с плечом в 0.38 радиуса. */
  function cross(cx, cy, r) {
    var a = r * 0.38, b = r;
    return [
      [-a, -b], [a, -b], [a, -a], [b, -a], [b, a], [a, a],
      [a, b], [-a, b], [-a, a], [-b, a], [-b, -a], [-a, -a]
    ].map(function (p) { return (cx + p[0]).toFixed(2) + "," + (cy + p[1]).toFixed(2); }).join(" ");
  }

  /** Стрелка вверх — по ней видно поворот, в отличие от круга. */
  function arrow(cx, cy, r) {
    var w = r * 0.30, head = r * 0.55;
    return [
      [0, -r], [head, -r + head], [w, -r + head], [w, r], [-w, r], [-w, -r + head], [-head, -r + head]
    ].map(function (p) { return (cx + p[0]).toFixed(2) + "," + (cy + p[1]).toFixed(2); }).join(" ");
  }

  /** Одна фигура нужного вида в точке (cx, cy) радиусом r. */
  function shapeSvg(shape, cx, cy, r, solid) {
    var paint = solid
      ? 'fill="' + INK + '" stroke="none"'
      : 'fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linejoin="round"';
    switch (shape) {
      case "circle":   return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r.toFixed(2) + '" ' + paint + "/>";
      case "square":   return '<polygon points="' + polygon(cx, cy, r * 1.08, 4, Math.PI / 4) + '" ' + paint + "/>";
      case "diamond":  return '<polygon points="' + polygon(cx, cy, r * 1.15, 4, 0) + '" ' + paint + "/>";
      case "triangle": return '<polygon points="' + polygon(cx, cy, r * 1.12, 3, 0) + '" ' + paint + "/>";
      case "pentagon": return '<polygon points="' + polygon(cx, cy, r * 1.08, 5, 0) + '" ' + paint + "/>";
      case "hexagon":  return '<polygon points="' + polygon(cx, cy, r * 1.05, 6, 0) + '" ' + paint + "/>";
      case "star":     return '<polygon points="' + star(cx, cy, r * 1.15) + '" ' + paint + "/>";
      case "cross":    return '<polygon points="' + cross(cx, cy, r * 1.05) + '" ' + paint + "/>";
      case "arrow":    return '<polygon points="' + arrow(cx, cy, r * 1.1) + '" ' + paint + "/>";
      default: throw new Error("неизвестная фигура: " + shape);
    }
  }

  /* Где стоят фигуры, когда их несколько, и какого они размера. */
  var LAYOUT = {
    1: { r: 26, at: [[50, 50]] },
    2: { r: 17, at: [[31, 50], [69, 50]] },
    3: { r: 15, at: [[50, 28], [30, 64], [70, 64]] },
    4: { r: 15, at: [[31, 31], [69, 31], [31, 69], [69, 69]] },
    5: { r: 12, at: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]] }
  };

  /** Решётка 3x3 из девяти бит: закрашенная клетка — единица. */
  function gridSvg(bits) {
    var out = "", i, x, y, s = 26, ox = 11, oy = 11;
    for (i = 0; i < 9; i++) {
      x = ox + (i % 3) * s;
      y = oy + Math.floor(i / 3) * s;
      out += '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s +
             '" fill="' + (bits[i] ? INK : "none") + '" stroke="' + INK +
             '" stroke-width="1.2" stroke-opacity="' + (bits[i] ? 0 : 0.45) + '"/>';
    }
    return out;
  }

  /** Полимино: клетки [[x,y], ...] в квадрате 100x100. */
  function cellsSvg(cells, size) {
    var norm = normalize(cells), i, w = 0, h = 0, s, ox, oy, out = "";
    for (i = 0; i < norm.length; i++) {
      w = Math.max(w, norm[i][0] + 1);
      h = Math.max(h, norm[i][1] + 1);
    }
    s = Math.min((size || 100) * 0.74 / Math.max(w, h), 26);
    ox = ((size || 100) - w * s) / 2;
    oy = ((size || 100) - h * s) / 2;
    for (i = 0; i < norm.length; i++) {
      out += '<rect x="' + (ox + norm[i][0] * s).toFixed(2) + '" y="' + (oy + norm[i][1] * s).toFixed(2) +
             '" width="' + s.toFixed(2) + '" height="' + s.toFixed(2) +
             '" fill="' + INK + '" fill-opacity="0.9" stroke="#0b1120" stroke-width="1.5"/>';
    }
    return out;
  }

  /**
   * Башня из кубиков в изометрии. На вход карта высот: stack[x][y] — сколько
   * кубиков стоит в столбце. Кубики рисуются от дальнего к ближнему
   * (по возрастанию x+y+z), иначе задние перекрыли бы передние.
   */
  function stackSvg(heights, size) {
    var cubes = [], x, y, z, w = 17, hh = 9.5, v = 20;
    for (x = 0; x < heights.length; x++)
      for (y = 0; y < heights[x].length; y++)
        for (z = 0; z < heights[x][y]; z++) cubes.push([x, y, z]);

    cubes.sort(function (a, b) { return (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]); });

    var out = "", cx = (size || 100) / 2, cy = (size || 100) * 0.68;
    /* центр по фигуре, а не по холсту: иначе башня уезжает вбок */
    var nx = heights.length, ny = heights[0] ? heights[0].length : 0, maxZ = 0;
    cubes.forEach(function (c) { maxZ = Math.max(maxZ, c[2] + 1); });
    cx -= ((nx - 1) - (ny - 1)) * w / 2;
    cy -= ((nx - 1) + (ny - 1)) * hh / 2 - (maxZ - 1) * v / 2;

    cubes.forEach(function (c) {
      var px = cx + (c[0] - c[1]) * w;
      var py = cy + (c[0] + c[1]) * hh - c[2] * v;
      out += cube(px, py, w, hh, v);
    });
    return out;

    function cube(px, py, w, h, v) {
      var top   = [[px, py - v], [px + w, py - v + h], [px, py - v + 2 * h], [px - w, py - v + h]];
      var left  = [[px - w, py - v + h], [px, py - v + 2 * h], [px, py + h], [px - w, py]];
      var right = [[px + w, py - v + h], [px, py - v + 2 * h], [px, py + h], [px + w, py]];
      return face(top, 0.92) + face(left, 0.45) + face(right, 0.66);
    }
    function face(pts, alpha) {
      return '<polygon points="' + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" ") +
             '" fill="' + INK + '" fill-opacity="' + alpha + '" stroke="#0b1120" stroke-width="1.4" stroke-linejoin="round"/>';
    }
  }

  /** Сетка n x n — для задания «сколько здесь квадратов». */
  function meshSvg(n, size) {
    var s = (size || 100) * 0.78, o = ((size || 100) - s) / 2, step = s / n, out = "", i;
    for (i = 0; i <= n; i++) {
      out += '<line x1="' + (o + i * step).toFixed(2) + '" y1="' + o + '" x2="' + (o + i * step).toFixed(2) +
             '" y2="' + (o + s) + '" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="square"/>';
      out += '<line x1="' + o + '" y1="' + (o + i * step).toFixed(2) + '" x2="' + (o + s) +
             '" y2="' + (o + i * step).toFixed(2) + '" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="square"/>';
    }
    return out;
  }

  /** Внутренность <svg> по спецификации клетки. */
  function draw(spec, size) {
    size = size || 100;
    if (!spec) return "";
    if (spec.grid) return gridSvg(spec.grid);
    if (spec.cells) return cellsSvg(spec.cells, size);
    if (spec.stack) return stackSvg(spec.stack, size);
    if (spec.mesh) return meshSvg(spec.mesh, size);
    if (spec.raw) return spec.raw;

    var count = spec.count || 1;
    var lay = LAYOUT[count];
    if (!lay) throw new Error("нет раскладки для " + count + " фигур");
    var r = lay.r * (spec.scale || 1);
    var body = lay.at.map(function (p) {
      var one = shapeSvg(spec.shape, p[0], p[1], r, spec.fill === "solid");
      /* «ядро» — контур с закрашенной серединой: третий вид заливки,
         который читается и в мелком размере, и на телефоне */
      if (spec.fill === "core") one += shapeSvg(spec.shape, p[0], p[1], r * 0.45, true);
      return one;
    }).join("");

    if (spec.rotate) body = '<g transform="rotate(' + spec.rotate + ' 50 50)">' + body + "</g>";
    return body;
  }

  /** Готовый <svg> с рамкой viewBox 0 0 100 100. */
  function svg(spec, cls) {
    return '<svg class="' + (cls || "fig") + '" viewBox="0 0 100 100" aria-hidden="true">' + draw(spec, 100) + "</svg>";
  }

  /* ---------- геометрия полимино: чистые функции ---------- */

  function normalize(cells) {
    var minX = Infinity, minY = Infinity;
    cells.forEach(function (c) { minX = Math.min(minX, c[0]); minY = Math.min(minY, c[1]); });
    return cells
      .map(function (c) { return [c[0] - minX, c[1] - minY]; })
      .sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
  }

  /** Поворот на 90° по часовой стрелке: (x, y) -> (-y, x). */
  function rotate(cells) {
    return normalize(cells.map(function (c) { return [-c[1], c[0]]; }));
  }

  /** Отражение по вертикальной оси. */
  function mirror(cells) {
    return normalize(cells.map(function (c) { return [-c[0], c[1]]; }));
  }

  function same(a, b) {
    return JSON.stringify(normalize(a)) === JSON.stringify(normalize(b));
  }

  /** Совпадает ли фигура с образцом при каком-нибудь повороте (без отражения). */
  function isRotationOf(cells, sample) {
    var probe = normalize(sample), i;
    for (i = 0; i < 4; i++) {
      if (same(cells, probe)) return true;
      probe = rotate(probe);
    }
    return false;
  }

  var api = {
    draw: draw, svg: svg, shapeSvg: shapeSvg,
    normalize: normalize, rotate: rotate, mirror: mirror, same: same, isRotationOf: isRotationOf,
    meshSvg: meshSvg, stackSvg: stackSvg
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.Figures = api;
})(typeof window !== "undefined" ? window : globalThis);
