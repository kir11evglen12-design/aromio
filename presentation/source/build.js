const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title = "Швейцария в начале XVIII века";

const W = 13.333, H = 7.5;
const HEAD = "Bookman Old Style", BODY = "Cambria";
const C = {
  gold: "C9A15A", goldDeep: "8E6A2E", oxblood: "7A1C1A", ink: "2A1E16",
  cream: "F1E6CF", muted: "6B5640", night: "140E0A",
};
const IMG = "img/";
const shadow = () => ({ type: "outer", color: "000000", blur: 14, offset: 4, angle: 90, opacity: 0.45 });

function bg(s, file) { s.background = { path: IMG + file }; }
function veil(s, t, name) { // dark translucent overlay over a painting
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: H, fill: { color: C.night, transparency: t }, line: { type: "none" }, objectName: name });
}
function frame(s, name, inset = 0.35, color = C.gold) { // double gilt hairline frame
  s.addShape(pres.shapes.RECTANGLE, { x: inset, y: inset, w: W - 2 * inset, h: H - 2 * inset, fill: { type: "none" }, line: { color, width: 1.25 }, objectName: name + "a" });
  s.addShape(pres.shapes.RECTANGLE, { x: inset + 0.09, y: inset + 0.09, w: W - 2 * inset - 0.18, h: H - 2 * inset - 0.18, fill: { type: "none" }, line: { color, width: 0.5 }, objectName: name + "b" });
}
function shade(s) { // dark at the top where the text sits, clear at the bottom where the scene is
  s.addImage({ path: IMG + "shade.png", x: 0, y: 0, w: W, h: H, objectName: "shade" });
}
function shield(s, x, y, w) { s.addImage({ path: IMG + "shield.png", x, y, w, h: w * 1.18, objectName: "!!shield" }); }
function text(s, t, o) { s.addText(t, { isTextBox: true, margin: 0, ...o }); }
function gilt(s, x, y, w, h) { // painting in a gilded frame
  s.addShape(pres.shapes.RECTANGLE, { x: x - 0.16, y: y - 0.16, w: w + 0.32, h: h + 0.32, fill: { color: C.goldDeep }, line: { color: C.gold, width: 2 }, shadow: shadow(), objectName: "!!gilt" });
  s.addImage({ path: IMG + "lake.jpg", x, y, w, h, sizing: { type: "cover", w, h }, objectName: "!!scene" });
}

const N = require("./narrative.js");
const ROMAN = ["I", "II", "III", "IV", "V", "VI"];

// Content that slides sideways. Every content object gets a stable name "!!c<slide>_<n>",
// and each slide also carries off-canvas copies of its neighbours' content (previous one
// parked to the left, next one to the right). Morph then pushes the old content out to the
// left and pulls the new one in from the right; only identical objects (shield, painting) stay.
let DX = 0, CUR = 0, K = 0;
const nm = () => `!!c${CUR}_${K++}`;
const T = (s, t, o) => text(s, t, { ...o, x: o.x + DX, objectName: nm() });
const SH = (s, type, o) => s.addShape(type, { ...o, x: o.x + DX, objectName: nm() });
const pageT = (s, i, color) => T(s, ROMAN[i] + "  ·  VI", { x: 11.3, y: 6.85, w: 1.2, h: 0.3, fontFace: HEAD, fontSize: 10, color, align: "right", charSpacing: 3 });
const IM = (s, o) => s.addImage({ ...o, x: o.x + DX, objectName: nm() });

const content = [
  // 1 · Титул
  (s) => {
    T(s, "Союз тринадцати кантонов среди больших войн Европы", { x: 2, y: 4.2, w: W - 4, h: 0.9, fontFace: BODY, fontSize: 21, italic: true, color: "E2D2B0", align: "center", valign: "top" });
    T(s, "Проект по истории  ·  8 «А» класс  ·  Кирилл Ленин и Михаил Луконин", { x: 1.5, y: 5.75, w: W - 3, h: 0.4, fontFace: BODY, fontSize: 14, color: C.gold, align: "center", charSpacing: 3 });
  },
  // 2 · Как всё началось
  (s) => {
    T(s, "К", { x: 7.15, y: 2.5, w: 0.95, h: 1.05, fontFace: HEAD, fontSize: 66, bold: true, color: C.oxblood, valign: "top" });
    T(s, "1700 году Швейцарию составляли 13 кантонов. Общего правительства не было: дела решал сейм — съезд послов кантонов.", { x: 8.15, y: 2.55, w: 4.45, h: 1.2, fontFace: BODY, fontSize: 15, color: C.ink, valign: "top", lineSpacingMultiple: 1.1 });
    T(s, "Рядом были союзники — Женева, Граубюнден, Вале, Невшатель — и подвластные земли, которыми кантоны управляли сообща.", { x: 7.15, y: 3.85, w: 5.45, h: 1.3, fontFace: BODY, fontSize: 15, color: C.ink, valign: "top", lineSpacingMultiple: 1.1 });
    T(s, "Каждый кантон жил по своим законам и сам решал, с кем дружить.", { x: 7.15, y: 5.3, w: 5.45, h: 0.95, fontFace: BODY, fontSize: 16, italic: true, color: C.oxblood, valign: "top" });
  },
  // 3 · Три опоры
  (s) => {
    const cols = [
      ["I", "Наёмная служба", "Швейцарские полки служили Франции, Голландии и другим державам. Плата солдатам кормила многие деревни."],
      ["II", "Ремесло и часы", "Крестьяне у Цюриха пряли хлопок для купцов. В Женеве и горах Юры делали часы."],
      ["III", "Власть патрициев", "Городами правили немногие знатные семьи. Крестьяне и подвластные земли права голоса не имели."],
    ];
    const cw = 3.6, gap = 0.47, x0 = 0.85;
    cols.forEach(([n, h, b], i) => {
      const x = x0 + i * (cw + gap);
      T(s, n, { x, y: 3.95, w: 1.3, h: 0.7, fontFace: HEAD, fontSize: 36, bold: true, color: C.oxblood });
      T(s, h, { x, y: 4.7, w: cw, h: 0.45, fontFace: HEAD, fontSize: 19, bold: true, color: C.ink });
      T(s, b, { x, y: 5.2, w: cw, h: 1.35, fontFace: BODY, fontSize: 14, color: C.muted, valign: "top", lineSpacingMultiple: 1.05 });
    });
  },
  // 4 · Хроника
  (s) => {
    const ev = [
      ["1701", "Нейтралитет", "В войне за испанское наследство союз не воюет"],
      ["1707", "Невшатель", "Княжество переходит к королю Пруссии"],
      ["1709", "Мальплаке", "Швейцарские полки сражаются по обе стороны"],
      ["1712", "Вильмерген", "Протестанты Цюриха и Берна побеждают католиков"],
      ["1723", "Майор Давель", "Восстание в земле Во против власти Берна"],
    ];
    const ly = 3.75, x0 = 1.0, step = 2.42, cw = 2.2;
    SH(s, pres.shapes.LINE, { x: 0.85, y: ly, w: W - 1.7, h: 0, line: { color: C.gold, width: 1 } });
    ev.forEach(([yr, h, b], i) => {
      const x = x0 + i * step;
      SH(s, pres.shapes.DIAMOND, { x: x - 0.14, y: ly - 0.14, w: 0.28, h: 0.28, fill: { color: C.oxblood }, line: { color: C.gold, width: 1.25 } });
      T(s, yr, { x: x - 0.1, y: 2.65, w: cw, h: 0.8, fontFace: HEAD, fontSize: 34, bold: true, color: C.gold });
      T(s, h, { x: x - 0.1, y: 4.1, w: cw, h: 0.4, fontFace: HEAD, fontSize: 14, bold: true, color: C.cream });
      T(s, b, { x: x - 0.1, y: 4.55, w: cw - 0.1, h: 1.0, fontFace: BODY, fontSize: 13, color: "D9C9A8", valign: "top" });
    });
    T(s, "Войны шли вокруг, но на землю самой Швейцарии чужие армии не вступали.", { x: 0.85, y: 5.3, w: 10.3, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: C.gold });
  },
  // 5 · XIII кантонов
  (s) => {
    IM(s, { path: IMG + "parchment.jpg", x: 7.1, y: 0.85, w: 5.4, h: 5.8, sizing: { type: "cover", w: 5.4, h: 5.8 } });
    SH(s, pres.shapes.RECTANGLE, { x: 7.1, y: 0.85, w: 5.4, h: 5.8, fill: { type: "none" }, line: { color: C.gold, width: 1.5 }, shadow: shadow() });
    T(s, "1707", { x: 7.1, y: 1.3, w: 5.4, h: 1.9, fontFace: HEAD, fontSize: 100, bold: true, color: C.oxblood, align: "center" });
    T(s, "в Базеле родился Эйлер", { x: 7.1, y: 3.2, w: 5.4, h: 0.6, fontFace: HEAD, fontSize: 24, color: C.ink, align: "center" });
    T(s, "Леонард Эйлер — один из величайших математиков. С 1727 года он работал в Петербургской академии наук.", { x: 7.6, y: 4.1, w: 4.4, h: 1.6, fontFace: BODY, fontSize: 15, color: C.muted, align: "center", valign: "top" });
    T(s, "Базель и Женева — города учёных", { x: 0.85, y: 1.95, w: 5.8, h: 2.3, fontFace: HEAD, fontSize: 30, italic: true, color: C.cream, valign: "top" });
    T(s, "В Базеле жила семья математиков Бернулли, в 1712 году в Женеве родился Руссо.", { x: 0.85, y: 3.4, w: 5.6, h: 0.9, fontFace: BODY, fontSize: 16, color: C.gold, valign: "top" });
  },
  // 6 · Финал
  (s) => {
    T(s, "Швейцария осталась нейтральной в войнах Европы, но внутри спорила из-за веры и власти. Богатела она ремеслом и наёмной службой.", { x: 2.2, y: 3.35, w: W - 4.4, h: 0.95, fontFace: BODY, fontSize: 19, italic: true, color: "E2D2B0", align: "center", valign: "top" });
    T(s, "Выполнили: ученики 8 «А» класса  ·  Кирилл Ленин и Михаил Луконин", { x: 1.5, y: 4.4, w: W - 3, h: 0.4, fontFace: BODY, fontSize: 14, color: C.gold, align: "center", charSpacing: 2 });
    T(s, "Источники: А. Я. Юдовская и др. «Всеобщая история. История Нового времени», 7–8 кл.; энциклопедические статьи о Швейцарской конфедерации", { x: 1.5, y: 6.75, w: W - 3, h: 0.4, fontFace: BODY, fontSize: 10, color: "3A2A1E", align: "center" });
  },
];

// Persistent layer of each slide: background, painting, shield, kicker, title, page number.
// Fixed layer of each slide: background, painting, shield — these stay put through the transition.
const persist = [
  (s) => {
    bg(s, "castle.jpg"); veil(s, 32, "veil"); frame(s, "!!frame");
    shield(s, W / 2 - 0.55, 0.85, 1.1);
  },
  (s) => {
    bg(s, "parchment.jpg");
    gilt(s, 0.85, 0.85, 5.6, 5.8);
    shield(s, 12.0, 0.55, 0.62);
  },
  (s) => {
    bg(s, "parchment.jpg");
    s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 2.25, fill: { color: C.goldDeep }, line: { color: C.gold, width: 2 }, shadow: shadow(), objectName: "!!gilt" });
    s.addImage({ path: IMG + "lake.jpg", x: 0, y: 0, w: W, h: 2.15, sizing: { type: "cover", w: W, h: 2.15 }, objectName: "!!scene" });
    shield(s, 12.0, 0.55, 0.62);
  },
  (s) => {
    bg(s, "battle.jpg");
    shade(s);
    shield(s, 12.0, 0.55, 0.62);
  },
  (s) => {
    bg(s, "town.jpg"); shade(s);
    shield(s, 0.85, 0.45, 0.62);
  },
  (s) => {
    bg(s, "village.jpg"); shade(s); frame(s, "!!frame");
    shield(s, W / 2 - 0.5, 0.45, 1.0);
  },
];

// Slide headings (kicker, title, caption, page number) slide away with the rest of the content.
const head = [
  (s) => {
    T(s, "CONFOEDERATIO  HELVETICA  ·  MDCC — MDCCXXX", { x: 1, y: 2.35, w: W - 2, h: 0.4, fontFace: HEAD, fontSize: 13, color: C.gold, align: "center", charSpacing: 6 });
    T(s, "Швейцария в начале XVIII века", { x: 0.7, y: 2.9, w: W - 1.4, h: 1.2, fontFace: HEAD, fontSize: 44, bold: true, color: C.cream, align: "center" });
  },
  (s) => {
    T(s, "Горное озеро в сердце Швейцарии (иллюстрация)", { x: 0.85, y: 6.85, w: 5.6, h: 0.3, fontFace: BODY, fontSize: 10, italic: true, color: C.muted, align: "center" });
    T(s, "CAPUT  I  ·  1700", { x: 7.15, y: 0.95, w: 4.5, h: 0.35, fontFace: HEAD, fontSize: 13, color: C.oxblood, charSpacing: 6 });
    T(s, "Каким был союз", { x: 7.15, y: 1.35, w: 5.45, h: 0.9, fontFace: HEAD, fontSize: 32, bold: true, color: C.ink });
    pageT(s, 1, C.muted);
  },
  (s) => {
    T(s, "CAPUT  II", { x: 0.85, y: 2.6, w: 5, h: 0.35, fontFace: HEAD, fontSize: 13, color: C.oxblood, charSpacing: 6 });
    T(s, "Чем жила страна", { x: 0.85, y: 2.95, w: 9, h: 0.8, fontFace: HEAD, fontSize: 36, bold: true, color: C.ink });
    pageT(s, 2, C.muted);
  },
  (s) => {
    T(s, "CAPUT  III", { x: 0.85, y: 0.85, w: 5, h: 0.35, fontFace: HEAD, fontSize: 13, color: C.gold, charSpacing: 6 });
    T(s, "Хроника начала века", { x: 0.85, y: 1.2, w: 9, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: C.cream });
    pageT(s, 3, C.gold);
  },
  (s) => {
    T(s, "CAPUT  IV", { x: 0.85, y: 1.55, w: 5, h: 0.35, fontFace: HEAD, fontSize: 13, color: C.gold, charSpacing: 6 });
    pageT(s, 4, C.gold);
  },
  (s) => {
    T(s, "FINIS", { x: 1, y: 1.75, w: W - 2, h: 0.45, fontFace: HEAD, fontSize: 14, color: C.gold, align: "center", charSpacing: 10 });
    T(s, "Спасибо за внимание", { x: 1, y: 2.15, w: W - 2, h: 1.1, fontFace: HEAD, fontSize: 46, bold: true, color: C.cream, align: "center" });
  },
];

const draw = (s, i, dx) => { DX = dx; CUR = i; K = 0; head[i](s); content[i](s); };
persist.forEach((p, i) => {
  const s = pres.addSlide();
  p(s);
  if (i > 0) draw(s, i - 1, -W - 0.5);           // previous slide's content, parked off the left edge
  if (i < persist.length - 1) draw(s, i + 1, W + 0.5); // next slide's content, waiting off the right edge
  draw(s, i, 0);                                  // this slide's own content, on top
  s.addNotes(N[i]);
});

pres.writeFile({ fileName: "raw.pptx" }).then(() => console.log("written"));
