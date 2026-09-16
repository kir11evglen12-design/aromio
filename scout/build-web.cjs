/**
 * Bakes the standalone page: node scout/build-web.cjs
 *
 * The detectors are plain JavaScript with no Node in them, and both
 * Binance and Bybit answer kline requests from a browser. So the same
 * `lib/` that the service runs can run in a tab — this script inlines it
 * into one file with no imports, no build tooling and no network beyond
 * the exchange itself.
 *
 * The point of building rather than copying: there is one copy of the
 * detectors. If the page and the service ever disagreed about what a
 * setup is, the page would be a lie.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DEMO = process.argv.includes("--demo");

/* An Artifact is given its own <head> and <body>, so the page ships as a
   fragment there: title, styles, content. That window also has no way out
   to an exchange, so the fragment build goes straight to the demo. */
const FRAGMENT = process.argv.includes("--fragment");
const outFlag = process.argv.indexOf("--out");
const OUT = outFlag > 0 && process.argv[outFlag + 1]
  ? path.resolve(process.argv[outFlag + 1])
  : DEMO
    ? path.join(ROOT, "demo.html")
    : path.join(ROOT, "..", "docs", "scout", "index.html");

const read = file => fs.readFileSync(path.join(ROOT, file), "utf8");

/** Applies a required replacement, or stops the build saying which one failed. */
function must(source, from, to, what) {
  if (!source.includes(from)) {
    console.error("build-web: не найдено «" + from + "» в " + what + " — модуль изменился, поправьте сборку.");
    process.exit(1);
  }
  return source.replace(from, to);
}

/* Node modules become browser globals. Each one keeps its own scope. */
function browserify(file, global, replacements) {
  let code = read(file);
  (replacements || []).forEach(pair => { code = must(code, pair[0], pair[1], file); });
  code = must(code, "module.exports = ", "globalThis." + global + " = ", file);
  return "/* " + file + " */\n(function () {\n" + code + "\n})();";
}

const MODULES = [
  browserify("lib/ta.js", "TA"),
  browserify("lib/setups.js", "Setups", [['const ta = require("./ta.js");', "const ta = globalThis.TA;"]]),
  browserify("lib/market.js", "Market"),
  "/* public/render.js */\n" + read("public/render.js"),
  "/* public/chart.js */\n" + read("public/chart.js")
];

/**
 * The demo build carries four series with a known pattern in each, so the
 * page still shows what a setup looks like where no exchange answers — a
 * sandboxed frame, a blocked network. They are deliberately named so that
 * nobody could mistake them for a real pair.
 */
if (DEMO) {
  MODULES.push("/* встроенные ряды для демонстрации */\n" +
    (FRAGMENT ? "window.SCOUT_OFFLINE = true;\n" : "") + demoData());
}

MODULES.push("/* public/web.js */\n" + read("public/web.js"));

function demoData() {
  const F = require("./tests/fixtures.js");
  const round = v => Number(v.toFixed(4));
  const pack = candles => candles.map(b => [b.t, round(b.o), round(b.h), round(b.l), round(b.c), Math.round(b.v)]);
  const sets = [
    { symbol: "ПРИМЕР·ПРОБОЙ",      tf: "1h", htfTrend: "up",   candles: F.breakRetestLong().candles },
    { symbol: "ПРИМЕР·ОТКАТ",       tf: "4h", htfTrend: "up",   candles: F.trendPullbackLong().candles },
    { symbol: "ПРИМЕР·СЖАТИЕ",      tf: "15m", htfTrend: null,  candles: F.squeezeBreakUp().candles },
    { symbol: "ПРИМЕР·ДИВЕРГЕНЦИЯ", tf: "1h", htfTrend: "down", candles: F.mirror(F.rsiDivergenceLong()).candles }
  ].map(set => ({ symbol: set.symbol, tf: set.tf, htfTrend: set.htfTrend, candles: pack(set.candles) }));
  return "window.SCOUT_DEMO = " + JSON.stringify(sets) + ";";
}

let html = read("public/standalone.html");

html = must(
  html,
  '<link rel="stylesheet" href="styles.css">',
  "<style>\n" + read("public/styles.css") + "\n</style>",
  "standalone.html"
);

html = must(
  html,
  "<!-- scripts -->",
  MODULES.map(code => "<script>\n" + code + "\n</script>").join("\n"),
  "standalone.html"
);

/* A closing tag inside inlined source would end the block early. */
const closers = (html.match(/<\/script>/g) || []).length;
if (closers !== MODULES.length) {
  console.error("build-web: ожидалось " + MODULES.length + " закрывающих тегов script, найдено " + closers);
  process.exit(1);
}

if (FRAGMENT) html = fragment(html);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);

/** Keeps the title, the styles and the content; drops the document shell. */
function fragment(source) {
  const drop = [
    /^<!doctype html>$/i, /^<html[^>]*>$/i, /^<\/html>$/i,
    /^<head>$/i, /^<\/head>$/i, /^<body>$/i, /^<\/body>$/i,
    /^<meta [^>]*>$/i, /^<link rel="icon"[^>]*>$/i
  ];
  const kept = source.split("\n").filter(line => !drop.some(rule => rule.test(line.trim())));
  const text = kept.join("\n").trim();
  if (!/^<title>/.test(text)) {
    console.error("build-web: фрагмент должен начинаться с <title> — проверьте standalone.html");
    process.exit(1);
  }
  return text;
}

console.log(path.relative(path.join(ROOT, ".."), OUT) + " — " + (Buffer.byteLength(html) / 1024).toFixed(0) +
            " KB, " + MODULES.length + " модулей и стили внутри" + (DEMO ? ", со встроенными рядами" : ""));
