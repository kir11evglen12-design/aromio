const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title = "Helvetia — шаблон презентации";

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
function shield(s, x, y, w) { s.addImage({ path: IMG + "shield.png", x, y, w, h: w * 1.18, objectName: "!!shield" }); }
function text(s, t, o) { s.addText(t, { isTextBox: true, margin: 0, ...o }); }
function gilt(s, x, y, w, h) { // painting in a gilded frame
  s.addShape(pres.shapes.RECTANGLE, { x: x - 0.16, y: y - 0.16, w: w + 0.32, h: h + 0.32, fill: { color: C.goldDeep }, line: { color: C.gold, width: 2 }, shadow: shadow(), objectName: "!!gilt" });
  s.addImage({ path: IMG + "lake.jpg", x, y, w, h, sizing: { type: "cover", w, h }, objectName: "!!scene" });
}

// ───────── 1 · Title ─────────
{
  const s = pres.addSlide();
  bg(s, "alps_dawn.jpg");
  veil(s, 45, "veil");
  frame(s, "!!frame");
  shield(s, W / 2 - 0.55, 0.85, 1.1);
  text(s, "CONFOEDERATIO  HELVETICA  ·  ANNO  MDCXLVIII", { x: 1, y: 2.35, w: W - 2, h: 0.4, fontFace: HEAD, fontSize: 13, color: C.gold, align: "center", charSpacing: 6, objectName: "!!kicker" });
  text(s, "Название презентации", { x: 1, y: 2.85, w: W - 2, h: 1.3, fontFace: HEAD, fontSize: 54, bold: true, color: C.cream, align: "center", objectName: "!!title" });
  text(s, "Подзаголовок — одна строка о сути выступления", { x: 1.5, y: 4.2, w: W - 3, h: 0.6, fontFace: BODY, fontSize: 22, italic: true, color: "E2D2B0", align: "center" });
  text(s, "Имя Фамилия  ·  Город  ·  2026", { x: 1.5, y: 5.75, w: W - 3, h: 0.4, fontFace: BODY, fontSize: 14, color: C.gold, align: "center", charSpacing: 3 });
  s.addNotes("Титульный слайд. Переход: затемнение через чёрное. Замените название, подзаголовок и автора.");
}

// ───────── 2 · Введение (painting + text) ─────────
{
  const s = pres.addSlide();
  bg(s, "parchment.jpg");
  gilt(s, 0.85, 0.85, 5.6, 5.8);
  shield(s, 12.0, 0.55, 0.62);
  text(s, "CAPUT  I", { x: 7.15, y: 1.0, w: 5, h: 0.35, fontFace: HEAD, fontSize: 13, color: C.oxblood, charSpacing: 6, objectName: "!!kicker" });
  text(s, "Введение", { x: 7.15, y: 1.4, w: 5.4, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: C.ink, objectName: "!!title" });
  // drop cap
  text(s, "В", { x: 7.15, y: 2.55, w: 0.95, h: 1.05, fontFace: HEAD, fontSize: 66, bold: true, color: C.oxblood, valign: "top" });
  text(s, "ступительный абзац. Расскажите, о чём пойдёт речь и почему это важно слушателю именно сейчас.", { x: 8.15, y: 2.6, w: 4.45, h: 1.1, fontFace: BODY, fontSize: 16, color: C.ink, valign: "top", lineSpacingMultiple: 1.1 });
  text(s, "Второй абзац раскрывает контекст: откуда возникла тема, кого она касается и какой вопрос мы ставим перед собой.", { x: 7.15, y: 3.85, w: 5.45, h: 1.1, fontFace: BODY, fontSize: 16, color: C.ink, valign: "top", lineSpacingMultiple: 1.1 });
  text(s, "«Цитата или ключевая мысль, выделенная курсивом»", { x: 7.15, y: 5.35, w: 5.45, h: 0.8, fontFace: BODY, fontSize: 17, italic: true, color: C.oxblood, valign: "top" });
  text(s, "Женевское озеро, ок. 1444", { x: 0.85, y: 6.85, w: 5.6, h: 0.3, fontFace: BODY, fontSize: 10, italic: true, color: C.muted, align: "center" });
  s.addNotes("Переход: «Занавес» (Curtains). Картина слева — плейсхолдер; правый клик → Изменить рисунок, чтобы поставить свою.");
}

// ───────── 3 · Три столпа ─────────
{
  const s = pres.addSlide();
  bg(s, "parchment.jpg");
  // the painting morphs from framed portrait into a wide banner
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: W, h: 2.45, fill: { color: C.goldDeep }, line: { color: C.gold, width: 2 }, shadow: shadow(), objectName: "!!gilt" });
  s.addImage({ path: IMG + "lake.jpg", x: 0, y: 0, w: W, h: 2.35, sizing: { type: "cover", w: W, h: 2.35 }, objectName: "!!scene" });
  shield(s, 12.0, 0.55, 0.62);
  text(s, "CAPUT  II", { x: 0.85, y: 2.85, w: 5, h: 0.35, fontFace: HEAD, fontSize: 13, color: C.oxblood, charSpacing: 6, objectName: "!!kicker" });
  text(s, "Три главные идеи", { x: 0.85, y: 3.2, w: 9, h: 0.8, fontFace: HEAD, fontSize: 36, bold: true, color: C.ink, objectName: "!!title" });
  const cols = [
    ["I", "Первая идея", "Короткое пояснение в две-три строки: факт, довод или вывод."],
    ["II", "Вторая идея", "Короткое пояснение в две-три строки: факт, довод или вывод."],
    ["III", "Третья идея", "Короткое пояснение в две-три строки: факт, довод или вывод."],
  ];
  const cw = 3.6, gap = 0.47, x0 = 0.85;
  cols.forEach(([n, h, b], i) => {
    const x = x0 + i * (cw + gap);
    text(s, n, { x, y: 4.3, w: 1.3, h: 0.75, fontFace: HEAD, fontSize: 40, bold: true, color: C.oxblood });
    text(s, h, { x, y: 5.1, w: cw, h: 0.45, fontFace: HEAD, fontSize: 20, bold: true, color: C.ink });
    text(s, b, { x, y: 5.6, w: cw, h: 1.0, fontFace: BODY, fontSize: 15, color: C.muted, valign: "top" });
  });
  s.addNotes("Переход: «Трансформация» (Morph) — картина плавно перетекает из рамы в широкий баннер, заголовок и герб переезжают.");
}

// ───────── 4 · Хроника (timeline) ─────────
{
  const s = pres.addSlide();
  bg(s, "walnut.jpg");
  s.addShape(pres.shapes.RECTANGLE, { x: -0.16, y: -0.16, w: W + 0.32, h: H + 0.32, fill: { color: C.goldDeep }, line: { type: "none" }, objectName: "!!gilt" });
  s.addImage({ path: IMG + "lake.jpg", x: 0, y: 0, w: W, h: H, sizing: { type: "cover", w: W, h: H }, objectName: "!!scene" });
  veil(s, 50, "veil");
  shield(s, 12.0, 0.55, 0.62);
  text(s, "CAPUT  III", { x: 0.85, y: 0.85, w: 5, h: 0.35, fontFace: HEAD, fontSize: 13, color: C.gold, charSpacing: 6, objectName: "!!kicker" });
  text(s, "Хроника", { x: 0.85, y: 1.2, w: 9, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: C.cream, objectName: "!!title" });
  const ev = [
    ["1291", "Союзная грамота", "Ури, Швиц и Унтервальден заключают вечный союз"],
    ["1315", "Моргартен", "Первая крупная победа конфедератов"],
    ["1499", "Швабская война", "Фактическая независимость от Империи"],
    ["1648", "Вестфальский мир", "Независимость признана всей Европой"],
  ];
  const ly = 3.75, x0 = 1.0, step = 2.95;
  s.addShape(pres.shapes.LINE, { x: 0.85, y: ly, w: W - 1.7, h: 0, line: { color: C.gold, width: 1 } });
  ev.forEach(([yr, h, b], i) => {
    const x = x0 + i * step;
    s.addShape(pres.shapes.DIAMOND, { x: x - 0.14, y: ly - 0.14, w: 0.28, h: 0.28, fill: { color: C.oxblood }, line: { color: C.gold, width: 1.25 } });
    text(s, yr, { x: x - 0.1, y: 2.6, w: 2.6, h: 0.8, fontFace: HEAD, fontSize: 38, bold: true, color: C.gold });
    text(s, h, { x: x - 0.1, y: 4.1, w: 2.85, h: 0.45, fontFace: HEAD, fontSize: 15, bold: true, color: C.cream });
    text(s, b, { x: x - 0.1, y: 4.6, w: 2.6, h: 0.9, fontFace: BODY, fontSize: 14, color: "D9C9A8", valign: "top" });
  });
  text(s, "Замените даты на этапы своего проекта — четыре узла держат ритм слайда.", { x: 0.85, y: 6.3, w: 11, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: C.gold });
  s.addNotes("Переход: Morph — картина раскрывается на весь экран и уходит в сумрак, заголовок поднимается вверх.");
}

// ───────── 5 · Большое число + девиз ─────────
{
  const s = pres.addSlide();
  bg(s, "dusk.jpg");
  veil(s, 70, "veil");
  shield(s, 0.85, 0.85, 0.62);
  // parchment folio on the right
  s.addImage({ path: IMG + "parchment.jpg", x: 7.1, y: 0.85, w: 5.4, h: 5.8, sizing: { type: "cover", w: 5.4, h: 5.8 }, objectName: "!!folio" });
  s.addShape(pres.shapes.RECTANGLE, { x: 7.1, y: 0.85, w: 5.4, h: 5.8, fill: { type: "none" }, line: { color: C.gold, width: 1.5 }, shadow: shadow() });
  text(s, "XIII", { x: 7.1, y: 1.4, w: 5.4, h: 2.0, fontFace: HEAD, fontSize: 120, bold: true, color: C.oxblood, align: "center", objectName: "!!big" });
  text(s, "кантонов", { x: 7.1, y: 3.4, w: 5.4, h: 0.6, fontFace: HEAD, fontSize: 26, color: C.ink, align: "center" });
  text(s, "Ключевая цифра и короткая подпись к ней — одна мысль, которую должны запомнить.", { x: 7.7, y: 4.3, w: 4.2, h: 1.4, fontFace: BODY, fontSize: 15, color: C.muted, align: "center", valign: "top" });
  text(s, "Unus pro omnibus,\nomnes pro uno", { x: 0.85, y: 2.6, w: 5.8, h: 2.0, fontFace: HEAD, fontSize: 38, italic: true, color: C.cream, valign: "top" });
  text(s, "Один за всех, все за одного — неофициальный девиз Конфедерации", { x: 0.85, y: 4.75, w: 5.6, h: 0.8, fontFace: BODY, fontSize: 15, color: C.gold, valign: "top" });
  s.addNotes("Переход: «Престиж» (Prestige). Число можно заменить на любую ключевую метрику.");
}

// ───────── 6 · Финал ─────────
{
  const s = pres.addSlide();
  bg(s, "winter.jpg");
  veil(s, 40, "veil");
  frame(s, "!!frame");
  shield(s, W / 2 - 0.75, 0.75, 1.5);
  text(s, "FINIS", { x: 1, y: 3.15, w: W - 2, h: 0.45, fontFace: HEAD, fontSize: 14, color: C.gold, align: "center", charSpacing: 10, objectName: "!!kicker" });
  text(s, "Благодарю за внимание", { x: 1, y: 3.65, w: W - 2, h: 1.1, fontFace: HEAD, fontSize: 48, bold: true, color: C.cream, align: "center", objectName: "!!title" });
  text(s, "имя@почта.ru  ·  +7 000 000-00-00", { x: 1.5, y: 5.0, w: W - 3, h: 0.5, fontFace: BODY, fontSize: 18, italic: true, color: "E2D2B0", align: "center" });
  s.addNotes("Переход: Morph — герб вырастает в центр, рамка возвращается. Замените контакты.");
}

pres.writeFile({ fileName: "raw.pptx" }).then(() => console.log("written"));
