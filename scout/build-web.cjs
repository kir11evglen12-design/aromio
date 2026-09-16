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
const OUT = path.join(ROOT, "..", "docs", "scout", "index.html");

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
  "/* public/web.js */\n" + read("public/web.js")
];

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

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);

console.log("docs/scout/index.html — " + (Buffer.byteLength(html) / 1024).toFixed(0) + " KB, " +
            MODULES.length + " модулей и стили внутри");
